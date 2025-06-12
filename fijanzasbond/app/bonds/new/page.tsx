"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BondForm } from "@/components/bond-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewBondPage() {
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
              <div className="ml-4 flex items-center space-x-4">
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
                  <h1 className="text-xl font-semibold text-white">Register New Bond</h1>
                  <p className="text-sm text-gray-400">Create a new bond for cash flow analysis</p>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            <BondForm />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
