import { useState, useEffect, useCallback } from 'react'

// Cache untuk menyimpan data API
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 menit

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
}

export function useCourses(userId?: string, role?: string) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async (skipCache = false) => {
    const cacheKey = userId && role ? `courses-${role}-${userId}` : 'courses'
    
    if (!skipCache) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setCourses(cachedData)
        setLoading(false)
        return
      }
    } else {
      // Clear cache when forcing refetch
      cache.delete(cacheKey)
    }

    try {
      setLoading(true)
      let url = '/api/courses'
      
      // Add filters based on role and userId
      if (userId && role === 'SISWA') {
        url += `?siswaId=${userId}`
      } else if (userId && role === 'GURU') {
        url += `?guruId=${userId}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setCourses(data.courses)
        setCachedData(cacheKey, data.courses)
      } else {
        setError(data.error || 'Gagal mengambil data courses')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data')
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, role])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const refetch = useCallback(() => fetchCourses(true), [fetchCourses])

  return { courses, loading, error, refetch }
}

export function useUsers(role?: string) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (skipCache = false) => {
    const cacheKey = role ? `users-${role}` : 'users'
    
    if (!skipCache) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setUsers(cachedData)
        setLoading(false)
        return
      }
    } else {
      // Clear cache when forcing refetch
      cache.delete(cacheKey)
    }

    try {
      setLoading(true)
      const url = role ? `/api/users?role=${role}` : '/api/users'
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
        setCachedData(cacheKey, data.users)
      } else {
        setError(data.error || 'Gagal mengambil data users')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const refetch = useCallback(() => fetchUsers(true), [fetchUsers])

  return { users, loading, error, refetch }
}

export function useProyek(guruId?: string) {
  const [proyek, setProyek] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProyek = useCallback(async (skipCache = false) => {
    const cacheKey = guruId ? `proyek-${guruId}` : 'proyek'
    
    if (!skipCache) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setProyek(cachedData)
        setLoading(false)
        return
      }
    } else {
      cache.delete(cacheKey)
    }

    try {
      setLoading(true)
      const url = guruId ? `/api/proyek?guruId=${guruId}` : '/api/proyek'
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setProyek(data.proyek)
        setCachedData(cacheKey, data.proyek)
      } else {
        setError(data.error || 'Gagal mengambil data proyek')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data')
      console.error('Error fetching proyek:', err)
    } finally {
      setLoading(false)
    }
  }, [guruId])

  useEffect(() => {
    fetchProyek()
  }, [fetchProyek])

  const refetch = useCallback(() => fetchProyek(true), [fetchProyek])

  return { proyek, loading, error, refetch }
}

export function useAsesmen(courseId?: string) {
  const [asesmen, setAsesmen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAsesmen = useCallback(async (skipCache = false) => {
    const cacheKey = courseId ? `asesmen-${courseId}` : 'asesmen'
    
    if (!skipCache) {
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setAsesmen(cachedData)
        setLoading(false)
        return
      }
    } else {
      cache.delete(cacheKey)
    }

    try {
      setLoading(true)
      const url = courseId ? `/api/asesmen?courseId=${courseId}` : '/api/asesmen'
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setAsesmen(data.asesmen)
        setCachedData(cacheKey, data.asesmen)
      } else {
        setError(data.error || 'Gagal mengambil data asesmen')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data')
      console.error('Error fetching asesmen:', err)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchAsesmen()
  }, [fetchAsesmen])

  const refetch = useCallback(() => fetchAsesmen(true), [fetchAsesmen])

  return { asesmen, loading, error, refetch }
}

export function useStats(userId?: string, role?: string) {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (role) params.append('role', role)
      
      const response = await fetch(`/api/stats?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      } else {
        setError(data.error || 'Gagal mengambil data statistik')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId && role) {
      fetchStats()
    }
  }, [userId, role])

  return { stats, loading, error, refetch: fetchStats }
}
