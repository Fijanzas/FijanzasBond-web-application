"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="flex h-16 items-center px-6">
              <SidebarTrigger className="text-white" />
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-white">Settings</h1>
                <p className="text-sm text-gray-400">Configure your application preferences</p>
              </div>
            </div>
          </header>

          <main className="p-6">
            <Card className="max-w-2xl bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Application Settings</CardTitle>
                <CardDescription className="text-gray-400">Customize your FijanzasBond experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-gray-300">
                    <h3 className="font-medium mb-2">User Information</h3>
                    <p className="text-sm text-gray-400">Username: {user.username}</p>
                    <p className="text-sm text-gray-400">Email: {user.email || "Not provided"}</p>
                  </div>

                  <div className="text-gray-300">
                    <h3 className="font-medium mb-2">Application Version</h3>
                    <p className="text-sm text-gray-400">FijanzasBond v1.0.0</p>
                  </div>

                  <div className="text-gray-300">
                    <h3 className="font-medium mb-2">Features</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• German Amortization Method</li>
                      <li>• Grace Period Support (Partial/Total)</li>
                      <li>• Financial Metrics (Duration, Convexity, TCEA, TREA)</li>
                      <li>• Multi-currency Support (USD, PEN, EUR)</li>
                      <li>• Cash Flow Export</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
