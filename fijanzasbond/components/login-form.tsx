// Reemplaza el contenido de: components/login-form.tsx
"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const response = await login(username, password)
      if (response.success) router.push("/dashboard")
      else setError(response.message || "Invalid credentials.")
    } catch (err) {
      setError((err as Error).message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
            <CardDescription className="text-gray-400">Sign in to your FijanzasBond account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" required />
              </div>
              {error && <Alert className="bg-red-900/50 border-red-700"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Login"}</Button>
              <div className="text-center text-sm">
                <span className="text-gray-400">Don't have an account? </span>
                <a href="/signup" className="font-semibold text-primary hover:text-primary/80">
                  Sign Up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}