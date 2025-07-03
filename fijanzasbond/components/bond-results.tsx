// Reemplaza el contenido completo de: components/bond-results.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"
import { apiClient, type ApiFlow, type ApiResults, type ApiBondResponse } from "@/lib/apiClient"

// --- Calculadora del Frontend (Versión Corregida y Simplificada) ---
class FrontendCalculator {
  static calculateAdvancedMetrics(
      flows: ApiFlow[],
      backendResults: ApiResults,
      bondData: ApiBondResponse
  ) {
    console.log("--- Iniciando Cálculo de Métricas Avanzadas ---");
    console.log("Datos del Bono recibidos:", bondData);
    console.log("Resultados del Backend recibidos:", backendResults);

    // --- SALVAGUARDA INICIAL ---
    if (!backendResults || flows.length === 0 || !bondData) {
      console.error("Faltan datos para el cálculo.");
      return { duration: NaN, modified_duration: NaN, convexity: NaN };
    }

    // --- VALORES CLAVE CON DEPURACIÓN ---
    // Usamos '|| 2' como fallback por si el dato no viniera, aunque debería.
    const periodsPerYear = bondData.payment_frequency || 2;
    console.log("Períodos por Año:", periodsPerYear);

    const periodicMarketRate = Math.pow(1 + bondData.market_rate, 1 / periodsPerYear) - 1;
    console.log("Tasa de Mercado Periódica:", periodicMarketRate);

    const theoreticalPrice = backendResults.Precio_Maximo;
    console.log("Precio Teórico:", theoreticalPrice);

    // --- SALVAGUARDA DE DIVISIÓN POR CERO ---
    if (theoreticalPrice <= 0 || isNaN(theoreticalPrice) || isNaN(periodicMarketRate)) {
      console.error("Precio teórico inválido o tasa de mercado inválida. Abortando cálculo.");
      return { duration: NaN, modified_duration: NaN, convexity: NaN };
    }

    let durationNumerator = 0;
    let convexityNumerator = 0;

    flows.forEach(entry => {
      const t = entry.period;
      const pvFlow = entry.net_flow / Math.pow(1 + periodicMarketRate, t);
      durationNumerator += t * pvFlow;
      convexityNumerator += t * (t + 1) * pvFlow;
    });

    console.log("Numerador de Duración:", durationNumerator);
    console.log("Numerador de Convexidad:", convexityNumerator);

    const macaulayDurationInPeriods = durationNumerator / theoreticalPrice;
    const durationInYears = macaulayDurationInPeriods / periodsPerYear;
    const modifiedDuration = durationInYears / (1 + periodicMarketRate);
    const convexity = convexityNumerator / (theoreticalPrice * Math.pow(1 + periodicMarketRate, 2));

    console.log("Resultados Finales del Cálculo:", { durationInYears, modifiedDuration, convexity });
    console.log("-------------------------------------------------");

    return { duration: durationInYears, modified_duration: modifiedDuration, convexity: convexity };
  }
}


interface BondResultsProps { bondId: string }

export function BondResults({ bondId }: BondResultsProps) {
  const router = useRouter()
  const [projectionData, setProjectionData] = useState<{
    flows: ApiFlow[],
    results: ApiResults,
    bond: ApiBondResponse,
    advancedMetrics: { duration: number, modified_duration: number, convexity: number }
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bondId) { setIsLoading(false); setError("No Bond ID provided."); return; }

    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        const numericId = parseInt(bondId, 10);
        const [flowsData, resultsData, bondData] = await Promise.all([
          apiClient.getBondFlows(numericId),
          apiClient.getBondResults(numericId),
          apiClient.getBondById(numericId)
        ]);

        const advancedMetrics = FrontendCalculator.calculateAdvancedMetrics(flowsData, resultsData, bondData);

        setProjectionData({ flows: flowsData, results: resultsData, bond: bondData, advancedMetrics });
      } catch (err) {
        setError((err as Error).message || "Could not fetch or process bond data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
  }, [bondId]);

  const priceYieldChartData = useMemo(() => {
    if (!projectionData) return [];
    const { flows, results, advancedMetrics, bond } = projectionData;
    const data = [];
    const baseRate = results.TREA;
    const priceAtBaseRate = results.Precio_Maximo;

    for (let i = -5; i <= 5; i++) {
      const rateChange = i / 100;
      const newRate = baseRate + rateChange;
      if (newRate > -1) {
        const periodicRate = Math.pow(1 + newRate, 1 / bond.payment_frequency) - 1;
        const actualPrice = flows.reduce((sum, entry) => sum + (entry.net_flow / Math.pow(1 + periodicRate, entry.period)), 0);
        const estimatedPrice = priceAtBaseRate * (1 - advancedMetrics.modified_duration * rateChange);
        data.push({ rate: (newRate * 100).toFixed(2) + "%", actualPrice, estimatedPrice });
      }
    }
    return data;
  }, [projectionData]);

  const balanceChartData = useMemo(() => projectionData?.flows.map(e => ({ period: e.period, balance: e.final_balance })) || [], [projectionData]);
  const paymentChartData = useMemo(() => projectionData?.flows.map(e => ({ period: e.period, amortization: e.amortization, interest: e.coupon })) || [], [projectionData]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  const formatPercentage = (value: number) => isNaN(value) ? 'N/A' : `${(value * 100).toFixed(4)}%`;
  const formatDecimal = (value: number) => isNaN(value) ? 'N/A' : value.toFixed(4);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-400 p-4 bg-red-900/50 rounded-lg">Error: {error}</div>
  if (!projectionData) return <div className="flex items-center justify-center min-h-screen text-white">No projection data available.</div>

  const { flows, results, bond, advancedMetrics } = projectionData;

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => router.push('/bonds')} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"><ArrowLeft className="h-4 w-4 mr-2" />Back to Bonds</Button>
            <div><h1 className="text-3xl font-bold text-white">Projection Results for Bond #{bond.id}</h1></div>
          </div>

          <Tabs defaultValue="metrics" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700"><TabsTrigger value="metrics">Metrics</TabsTrigger><TabsTrigger value="cashflow">Cash Flow</TabsTrigger><TabsTrigger value="graphs">Graphs</TabsTrigger></TabsList>

            <TabsContent value="metrics">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white text-lg">TCEA</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{formatPercentage(results.TCEA)}</p></CardContent></Card>
                <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white text-lg">TREA</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{formatPercentage(results.TREA)}</p></CardContent></Card>
                <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white text-lg">Theoretical Price</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{formatCurrency(results.Precio_Maximo)}</p></CardContent></Card>
                <Card className="bg-gray-800/50 border-gray-700 md:col-span-3">
                  <CardHeader><CardTitle className="text-white text-lg">Risk & Duration Metrics</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-gray-400">Duration (Macaulay)</p><p className="text-white font-semibold">{formatDecimal(advancedMetrics.duration)} years</p></div>
                    <div><p className="text-gray-400">Modified Duration</p><p className="text-white font-semibold">{formatDecimal(advancedMetrics.modified_duration)}</p></div>
                    <div><p className="text-gray-400">Convexity</p><p className="text-white font-semibold">{formatDecimal(advancedMetrics.convexity)}</p></div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cashflow">
              <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle>Cash Flow Schedule</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Initial Balance</TableHead><TableHead>Amortization</TableHead><TableHead>Coupon</TableHead><TableHead>Bonus</TableHead><TableHead>Net Flow</TableHead><TableHead>Final Balance</TableHead></TableRow></TableHeader><TableBody>{flows.map((entry, index) => <TableRow key={index}><TableCell>{entry.period}</TableCell><TableCell>{formatCurrency(entry.initial_balance)}</TableCell><TableCell>{formatCurrency(entry.amortization)}</TableCell><TableCell>{formatCurrency(entry.coupon)}</TableCell><TableCell>{formatCurrency(entry.bonus)}</TableCell><TableCell>{formatCurrency(entry.net_flow)}</TableCell><TableCell>{formatCurrency(entry.final_balance)}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
            </TabsContent>

            <TabsContent value="graphs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle>Balance Evolution</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={balanceChartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="period" /><YAxis tickFormatter={formatCurrency}/><Tooltip formatter={(v: number) => formatCurrency(v)}/><Line type="monotone" dataKey="balance" name="Balance" stroke="#008080" /></LineChart></ResponsiveContainer></CardContent></Card>
                <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle>Payment Breakdown</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={paymentChartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="period" /><YAxis tickFormatter={formatCurrency}/><Tooltip formatter={(v: number) => formatCurrency(v)}/><Legend /><Bar dataKey="amortization" stackId="a" fill="#008080" name="Amortization"/><Bar dataKey="interest" stackId="a" fill="#4DC3C3" name="Interest"/></BarChart></ResponsiveContainer></CardContent></Card>
                <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
                  <CardHeader><CardTitle className="text-white">Price-Yield Curve & Convexity</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={priceYieldChartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="rate" /><YAxis tickFormatter={formatCurrency}/><Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{backgroundColor:"#1F2937"}} /><Legend /><Line type="monotone" dataKey="actualPrice" name="Actual Price (Convex)" stroke="#4DC3C3" /><Line type="linear" dataKey="estimatedPrice" name="Duration Estimate (Linear)" stroke="#F87171" strokeDasharray="5 5" /></LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}