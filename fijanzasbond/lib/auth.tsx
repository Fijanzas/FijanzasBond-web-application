// Reemplaza el contenido de: lib/auth.tsx
"use client"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "./types"
import { apiClient, type LoginResponse } from "./apiClient"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<LoginResponse>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("bond-app-user")
    if (savedUser) setUser(JSON.parse(savedUser))
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.login({ username, password })
    if (response.success && response.user_id && response.username) {
      const user: User = {
        id: String(response.user_id),
        username: response.username,
        email: `${response.username}@fijanzas.com`,
      }
      setUser(user)
      localStorage.setItem("bond-app-user", JSON.stringify(user))
    }
    return response
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("bond-app-user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}