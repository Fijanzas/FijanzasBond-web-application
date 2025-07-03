// Crea este archivo: components/signup-form.tsx

"use client"
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/apiClient"

export function SignupForm() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.")
            setIsLoading(false)
            return
        }

        try {
            const response = await apiClient.createUser({ username, email, password })
            setSuccess(`User "${response.username}" created successfully! Redirecting to login...`)
            setTimeout(() => {
                router.push("/") // Redirige al login después de 2 segundos
            }, 2000)
        } catch (err) {
            setError((err as Error).message || "Signup failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">Create an Account</CardTitle>
                    <CardDescription className="text-gray-400">Join FijanzasBond to manage your portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-white">Username</Label>
                            <Input id="username" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
                            <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" required />
                        </div>

                        {error && <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200"><AlertDescription>{error}</AlertDescription></Alert>}
                        {success && <Alert variant="default" className="bg-green-900/50 border-green-700 text-green-200"><AlertDescription>{success}</AlertDescription></Alert>}

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading || !!success}>
                            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</>) : ("Sign Up")}
                        </Button>

                        <div className="text-center">
                            <a href="/" className="text-sm text-gray-400 hover:text-white">
                                Already have an account? Sign In
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}