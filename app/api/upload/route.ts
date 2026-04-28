import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('No file in request')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // In production (Vercel/serverless) we can't rely on writing to local disk,
    // and returning base64 data URLs breaks DB constraints (fileUrl is VARCHAR(255)).
    // So we fail fast with a clear message.
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

    if (isProduction) {
      return NextResponse.json(
        {
          error:
            'Upload file langsung belum didukung di production. Silakan gunakan link (Google Drive/OneDrive) atau integrasikan storage (Supabase Storage/S3) agar menghasilkan URL pendek.',
        },
        { status: 400 }
      )
    }

    // Development: save to file system
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    console.log('Upload directory:', uploadDir)
    
    if (!existsSync(uploadDir)) {
      console.log('Creating upload directory...')
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`
    const filepath = join(uploadDir, filename)

    console.log('Writing file to:', filepath)

    // Write file
    await writeFile(filepath, buffer)

    console.log('File written successfully')

    // Return URL
    const url = `/uploads/${filename}`
    
    return NextResponse.json({ 
      url,
      filename: file.name,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
