"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { BondStorage } from "@/lib/bond-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Bond } from "@/lib/types"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react"

export default function BondsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bonds, setBonds] = useState<Bond[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      const storedBonds = BondStorage.getBonds()
      setBonds(storedBonds)
    }
  }, [user, isLoading, router])

  const handleDelete = (bondId: string) => {
    BondStorage.deleteBond(bondId)
    setBonds(BondStorage.getBonds())
    setDeleteConfirm(null)
  }

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
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
            {deleteConfirm && (
              <Alert className="mb-6 bg-red-900/50 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  Are you sure you want to delete this bond? This action cannot be undone.
                  <div className="mt-2 space-x-2">
                    <Button
                      onClick={() => handleDelete(deleteConfirm)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirm(null)}
                      size="sm"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Bond Name</TableHead>
                        <TableHead className="text-gray-300">Issuer</TableHead>
                        <TableHead className="text-gray-300">Issue Date</TableHead>
                        <TableHead className="text-gray-300">Maturity Date</TableHead>
                        <TableHead className="text-gray-300">Coupon Rate</TableHead>
                        <TableHead className="text-gray-300">Face Value</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                            <div className="space-y-2">
                              <p>No bonds registered yet.</p>
                              <Button
                                onClick={() => router.push("/bonds/new")}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Register Your First Bond
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bonds.map((bond) => (
                          <TableRow key={bond.id} className="border-gray-700">
                            <TableCell className="text-gray-300 font-medium">{bond.name}</TableCell>
                            <TableCell className="text-gray-400">{bond.issuer}</TableCell>
                            <TableCell className="text-gray-400">{bond.issueDate}</TableCell>
                            <TableCell className="text-gray-400">{bond.maturityDate}</TableCell>
                            <TableCell className="text-gray-400">{bond.interestRate.toFixed(2)}%</TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(bond.nominalValue, bond.currency)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  bond.status === "active"
                                    ? "bg-green-900/50 text-green-300 border border-green-700"
                                    : bond.status === "matured"
                                      ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                                      : "bg-red-900/50 text-red-300 border border-red-700"
                                }`}
                              >
                                {bond.status.charAt(0).toUpperCase() + bond.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => router.push(`/bonds/${bond.id}/edit`)}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => setDeleteConfirm(bond.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-700 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
