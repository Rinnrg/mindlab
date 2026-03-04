"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import type { User, UserRole } from "./types"

interface AuthContextType {
  user: User | null
  setUser: (user: User) => void
  setUserRole: (role: UserRole) => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (e) {
        console.error('Failed to parse saved user:', e)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  // Save user to localStorage and cookie when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      // Set cookie for middleware access
      document.cookie = `user=${encodeURIComponent(JSON.stringify({ role: user.role }))};path=/;max-age=604800;SameSite=Lax`
    } else {
      localStorage.removeItem('user')
      // Remove cookie
      document.cookie = 'user=;path=/;max-age=0'
    }
  }, [user])

  const setUserRole = useCallback((role: UserRole) => {
    // This is for backward compatibility with quick login buttons
    // For actual login, use setUser() directly
    setUser({
      id: 'temp',
      email: `${role.toLowerCase()}@temp.com`,
      nama: role,
      role,
      createdAt: new Date(),
    })
  }, [])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [user?.id])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    document.cookie = 'user=;path=/;max-age=0'
  }, [])

  const value = useMemo(() => ({
    user,
    setUser,
    setUserRole,
    refreshUser,
    isAuthenticated: !!user,
    logout,
    isLoading,
  }), [user, setUserRole, refreshUser, logout, isLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
