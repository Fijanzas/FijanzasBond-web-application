// Reemplaza el contenido de: app/bonds/page.tsx

"use client"

import { useEffect, useState, useCallback } from "react" // <-- CAMBIO: Añadimos useCallback
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert" // <-- CAMBIO: Importamos Alert
import type { Bond } from "@/lib/types"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react" // <-- CAMBIO: Importamos AlertCircle
import { apiClient, type ApiBondResponse } from "@/lib/apiClient"

// En app/dashboard/page.tsx y app/bonds/page.tsx

function mapApiBondToFrontend(apiBond: ApiBondResponse): Bond {
  return {
    id: String(apiBond.id),
    name: `Bond #${apiBond.id}`, // Usaremos esto como nombre principal
    nominalValue: apiBond.nominal_value,
    interestRate: apiBond.coupon_rate * 100,
    totalTerm: apiBond.duration, // Recuerda que esto viene en periodos (ej. 10 semestres)
    paymentFrequency: "semiannual", // Asumimos esto
    // La API no devuelve estos datos, así que los generamos o los omitimos
    issueDate: new Date().toISOString().split("T")[0],
    maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + (apiBond.duration / 2))).toISOString().split("T")[0],
    currency: "USD",
    rateType: "effective",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function BondsPage() {
  const { user, isLoading: authIsLoading } = useAuth()
  const router = useRouter()
  const [bonds, setBonds] = useState<Bond[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null); // Estado para errores

  // --- CAMBIO: Usamos useCallback para evitar que la función se recree en cada render ---
  const fetchBonds = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    setError(null); // Limpiamos errores previos
    try {
      const apiBonds = await apiClient.getBonds(parseInt(user.id, 10));
      setBonds(apiBonds.map(mapApiBondToFrontend));
    } catch (err) {
      console.error("Failed to fetch bonds:", err);
      setError((err as Error).message || "Could not fetch bonds.");
      setBonds([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]); // La dependencia es el usuario

  // --- CAMBIO: useEffect simplificado para llamar a fetchBonds ---
  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchBonds();
    }
  }, [user, authIsLoading, router, fetchBonds]);


  // --- CAMBIO: Función para manejar el borrado ---
  const handleDelete = async (bondId: string) => {
    setError(null);
    try {
      await apiClient.deleteBond(parseInt(bondId, 10));
      // Después de borrar exitosamente, recargamos la lista de bonos
      await fetchBonds();
    } catch (err) {
      console.error("Failed to delete bond:", err);
      setError((err as Error).message || "Could not delete the bond.");
    } finally {
      setDeleteConfirm(null); // Cerramos el diálogo de confirmación
    }
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }

  if (authIsLoading || isDataLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-white">Loading...</div>
        </div>
    )
  }

  if (!user) {
    return null
  }

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center">
                  <SidebarTrigger className="text-white" />
                  <div className="ml-4">
                    <h1 className="text-xl font-semibold text-white">Registered Bonds</h1>
                    <p className="text-sm text-gray-400">Manage your bond portfolio</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/bonds/new")} className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Bond
                </Button>
              </div>
            </header>

            <main className="p-6">
              {/* --- CAMBIO: Diálogo de confirmación para borrar --- */}
              {deleteConfirm && (
                  <Alert className="mb-6 bg-red-900/50 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      Are you sure you want to delete Bond #{deleteConfirm}? This action cannot be undone.
                      <div className="mt-2 space-x-2">
                        <Button onClick={() => handleDelete(deleteConfirm)} size="sm" className="bg-red-600 hover:bg-red-700 text-white">Yes, Delete</Button>
                        <Button onClick={() => setDeleteConfirm(null)} size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">Cancel</Button>
                      </div>
                    </AlertDescription>
                  </Alert>
              )}

              {/* Alerta para otros errores */}
              {error && <Alert variant="destructive" className="mb-6">{error}</Alert>}

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Bond ID</TableHead>
                          <TableHead className="text-gray-300">Face Value</TableHead>
                          <TableHead className="text-gray-300">Coupon Rate</TableHead>
                          <TableHead className="text-gray-300">Duration</TableHead>
                          <TableHead className="text-right text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonds.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-400 py-12">
                                <div className="space-y-2">
                                  <p>No bonds registered yet.</p>
                                  <Button onClick={() => router.push("/bonds/new")} className="bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4 mr-2" />Register Your First Bond</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ) : (
                            bonds.map((bond, index) => (
                                <TableRow key={bond.id} className="border-gray-700">
                                  <TableCell className="text-gray-300 font-medium">Bond #{index + 1}</TableCell>
                                  <TableCell className="text-gray-300">{formatCurrency(bond.nominalValue, bond.currency)}</TableCell>
                                  <TableCell className="text-gray-400">{bond.interestRate.toFixed(2)}%</TableCell>
                                  <TableCell className="text-gray-400">{bond.totalTerm} years</TableCell>
                                  <TableCell className="text-right">
                                    {/* --- CAMBIO: Botones habilitados y funcionales --- */}
                                    <div className="flex space-x-2 justify-end">
                                      <Button onClick={() => router.push(`/bonds/${bond.id}/results`)} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">Results</Button>
                                      <Button onClick={() => router.push(`/bonds/${bond.id}/edit`)} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"><Edit className="h-4 w-4" /></Button>
                                      <Button onClick={() => setDeleteConfirm(bond.id)} variant="outline" size="sm" className="border-red-700 text-red-400 hover:text-red-300 hover:bg-red-900/50"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
  )
}