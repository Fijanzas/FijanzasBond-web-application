"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BondCalculator } from "@/lib/bond-calculations"
import { BondStorage } from "@/lib/bond-storage"
import type { BondProjection } from "@/lib/types"
import { Download, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface BondResultsProps {
  bondId: string
}

export function BondResults({ bondId }: BondResultsProps) {
  const router = useRouter()
  const [projection, setProjection] = useState<BondProjection | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const bond = BondStorage.getBond(bondId)
    if (bond) {
      const result = BondCalculator.projectBond(bond)
      setProjection(result)
    }
    setIsLoading(false)
  }, [bondId])

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const exportToCSV = () => {
    if (!projection) return

    const headers = ["Date", "Period", "Amortization", "Interest", "Payment", "Balance"]
    const csvContent = [
      headers.join(","),
      ...projection.cashFlow.map((entry) =>
        [entry.date, entry.period, entry.amortization, entry.interest, entry.payment, entry.balance].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projection.bond.name}_cash_flow.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!projection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Bond not found</div>
      </div>
    )
  }

  const balanceChartData = projection.cashFlow.map((entry, index) => ({
    period: index + 1,
    balance: entry.balance,
    date: entry.date,
  }))

  const paymentChartData = projection.cashFlow.map((entry, index) => ({
    period: index + 1,
    amortization: entry.amortization,
    interest: entry.interest,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Projection Results</h1>
              <p className="text-gray-400">
                View the results of your bond projection based on the German amortization method.
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="bg-primary hover:bg-primary/90 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Metrics
            </TabsTrigger>
            <TabsTrigger value="graphs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Graphs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cash Flow Schedule</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed payment schedule for {projection.bond.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Period</TableHead>
                        <TableHead className="text-gray-300">Amortization</TableHead>
                        <TableHead className="text-gray-300">Interest</TableHead>
                        <TableHead className="text-gray-300">Payment</TableHead>
                        <TableHead className="text-gray-300">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projection.cashFlow.map((entry, index) => (
                        <TableRow key={index} className="border-gray-700">
                          <TableCell className="text-gray-300">{entry.date}</TableCell>
                          <TableCell className="text-gray-300">{entry.period}</TableCell>
                          <TableCell className="text-gray-300">
                            {formatCurrency(entry.amortization, projection.bond.currency)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatCurrency(entry.interest, projection.bond.currency)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatCurrency(entry.payment, projection.bond.currency)}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatCurrency(entry.balance, projection.bond.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{projection.metrics.duration.toFixed(2)} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modified Duration:</span>
                      <span className="text-white">{projection.metrics.modifiedDuration.toFixed(2)} years</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Convexity:</span>
                      <span className="text-white">{projection.metrics.convexity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Yield to Maturity:</span>
                      <span className="text-white">{formatPercentage(projection.metrics.yieldToMaturity)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">TCEA:</span>
                      <span className="text-white">{formatPercentage(projection.metrics.tcea)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">TREA:</span>
                      <span className="text-white">{formatPercentage(projection.metrics.trea)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Theoretical Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(projection.metrics.theoreticalPrice, projection.bond.currency)}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Present value of all future cash flows</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="graphs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Balance Evolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={balanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                        }}
                        labelStyle={{ color: "#F3F4F6" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#008080"
                        strokeWidth={2}
                        dot={{ fill: "#008080", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                        }}
                        labelStyle={{ color: "#F3F4F6" }}
                      />
                      <Bar dataKey="amortization" stackId="a" fill="#008080" />
                      <Bar dataKey="interest" stackId="a" fill="#4DC3C3" />
                    </BarChart>
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
