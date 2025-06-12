"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { BondStorage } from "@/lib/bond-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import type { Bond } from "@/lib/types"
import { Plus, TrendingUp, DollarSign } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bonds, setBonds] = useState<Bond[]>([])

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

  const totalValue = bonds.reduce((sum, bond) => sum + bond.nominalValue, 0)
  const activeBonds = bonds.filter((bond) => bond.status === "active")

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger className="text-white" />
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-white">Dashboard</h1>
                <p className="text-sm text-gray-400">Here's a summary of your registered bonds.</p>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Quick Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Bonds</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{bonds.length}</div>
                    <p className="text-xs text-gray-400">{activeBonds.length} active</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
                    <p className="text-xs text-gray-400">Nominal value</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Avg. Interest Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {bonds.length > 0
                        ? (bonds.reduce((sum, bond) => sum + bond.interestRate, 0) / bonds.length).toFixed(2)
                        : "0.00"}
                      %
                    </div>
                    <p className="text-xs text-gray-400">Weighted average</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Avg. Term</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {bonds.length > 0
                        ? (bonds.reduce((sum, bond) => sum + bond.totalTerm, 0) / bonds.length).toFixed(1)
                        : "0.0"}{" "}
                      years
                    </div>
                    <p className="text-xs text-gray-400">Average maturity</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Bond Summary</h2>
              <Button onClick={() => router.push("/bonds/new")} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Bond
              </Button>
            </div>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Bond Name</TableHead>
                        <TableHead className="text-gray-300">Issuer</TableHead>
                        <TableHead className="text-gray-300">Maturity Date</TableHead>
                        <TableHead className="text-gray-300">Coupon Rate</TableHead>
                        <TableHead className="text-gray-300">Current Value</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                            No bonds registered yet. Create your first bond to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        bonds.map((bond) => (
                          <TableRow key={bond.id} className="border-gray-700">
                            <TableCell className="text-gray-300 font-medium">{bond.name}</TableCell>
                            <TableCell className="text-gray-400">{bond.issuer}</TableCell>
                            <TableCell className="text-gray-400">{bond.maturityDate}</TableCell>
                            <TableCell className="text-gray-400">{bond.interestRate}%</TableCell>
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
                              <Button
                                onClick={() => router.push(`/bonds/${bond.id}/results`)}
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                              >
                                View
                              </Button>
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
