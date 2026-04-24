import { useState, useCallback } from 'react'

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  folder: string
  uploadedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, userId?: string) => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      if (userId) formData.append('userId', userId)

      // Simulate progress (since we can't track real upload progress with fetch)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        ...data,
        url: `/api/upload/${data.id}`, // URL untuk akses file dari database
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
      throw err
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [])

  return { uploadFile, uploading, progress, error }
}

export function useFiles() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  })

  const fetchFiles = useCallback(async (options?: {
    folder?: string
    uploadedBy?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options?.folder) params.set('folder', options.folder)
      if (options?.uploadedBy) params.set('uploadedBy', options.uploadedBy)
      if (options?.page) params.set('page', options.page.toString())
      if (options?.limit) params.set('limit', options.limit.toString())

      const response = await fetch(`/api/upload/files?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      setFiles(data.files)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files')
      console.error('Error fetching files:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload/files?id=${fileId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file')
      }

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId))

      return data
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete file')
    }
  }, [])

  return {
    files,
    loading,
    error,
    pagination,
    fetchFiles,
    deleteFile,
  }
}

// Helper function untuk format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Helper function untuk get file icon based on mimetype
export function getFileIcon(mimetype: string): string {
  if (mimetype.startsWith('image/')) return '🖼️'
  if (mimetype.startsWith('video/')) return '🎥'
  if (mimetype === 'application/pdf') return '📄'
  if (mimetype.includes('word')) return '📝'
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return '📊'
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📊'
  return '📎'
}
