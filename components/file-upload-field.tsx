"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Link2, X, File, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

export interface FileUploadFieldProps {
  // Newer call sites (projects)
  onFileUpload?: (url: string | null) => void
  currentFile?: string
  maxSizeMB?: number
  placeholder?: string

  // Older call sites (other forms)
  label?: string
  value?: string
  onChange?: (value: string) => void

  accept?: string
  description?: string
}

export function FileUploadField({
  // new
  onFileUpload,
  currentFile,
  maxSizeMB = 5,
  placeholder,

  // old
  label = 'Lampiran',
  value,
  onChange,

  accept,
  description,
}: FileUploadFieldProps) {
  const resolvedValue = value ?? currentFile ?? ''
  const updateValue = (next: string) => {
    onChange?.(next)
    onFileUpload?.(next || null)
  }
  const [uploadType, setUploadType] = useState<'link' | 'file'>('link')
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    
  const maxSize = maxSizeMB * 1024 * 1024 
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Ukuran file terlalu besar. Maksimal 5MB",
        variant: "destructive",
      })
      e.target.value = '' 
      return
    }

    setIsUploading(true)
    setFileName(file.name)

    try {
      // Convert file to base64 and save directly
      const reader = new FileReader()
      
      reader.onloadend = () => {
        const base64String = reader.result as string
        // Save as data URL (includes file type info)
  updateValue(base64String)
        setIsUploading(false)
        toast({
          title: "Berhasil",
          description: "File berhasil diupload",
        })
      }

      reader.onerror = () => {
        setIsUploading(false)
        toast({
          title: "Error",
          description: "Gagal membaca file",
          variant: "destructive",
        })
        setFileName('')
        e.target.value = ''
      }

      // Read file as data URL (base64)
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupload file",
        variant: "destructive",
      })
      setFileName('')
      e.target.value = ''
      setIsUploading(false)
    }
  }

  const handleClearFile = () => {
  updateValue('')
    setFileName('')
  }

  // Check if value is a data URL (base64)
  const isDataURL = resolvedValue && resolvedValue.startsWith('data:')

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      
      <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'link' | 'file')}>
        <TabsList className="ios-tab-list">
          <TabsTrigger value="link" className="ios-tab-trigger">
            <Link2 className="ios-tab-icon" />
            <span className="ios-tab-text">Link URL</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="ios-tab-trigger">
            <Upload className="ios-tab-icon" />
            <span className="ios-tab-text">Upload File</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-2">
          <Input
            type="url"
            placeholder={placeholder || "https://..."}
            value={isDataURL ? '' : resolvedValue}
            onChange={(e) => updateValue(e.target.value)}
          />
          {isDataURL && (
            <p className="text-xs text-amber-600">
              File sudah diupload. Ganti ke tab "Upload File" untuk melihat atau menggantinya.
            </p>
          )}
        </TabsContent>

        <TabsContent value="file" className="space-y-2">
          {resolvedValue ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {fileName || (isDataURL ? 'File terupload' : 'Link eksternal')}
                    </p>
                    {isDataURL ? (
                      <p className="text-xs text-muted-foreground">
                        File disimpan di database
                      </p>
                    ) : (
                      <a 
                        href={resolvedValue} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Lihat file
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Maksimal {maxSizeMB}MB. File akan disimpan di database.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
