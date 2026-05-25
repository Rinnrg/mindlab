
/**
 * Uploads a file buffer or base64 string to Supabase Storage bucket 'upload'.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToSupabase(
  fileData: Buffer | string,
  fileName: string,
  fileType: string
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://noltlnkzgishtptqzpqd.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables')
  }

  // Convert input to Buffer if it is a base64 string
  let buffer: Buffer
  if (typeof fileData === 'string') {
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData
    buffer = Buffer.from(base64Data, 'base64')
  } else {
    buffer = fileData
  }

  // Sanitize filename: replace spaces and special characters with underscores
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniquePath = `${Date.now()}-${cleanName}`

  console.log(`Uploading file ${fileName} (${buffer.length} bytes, type: ${fileType}) to Supabase Storage...`)

  // Upload endpoint: /storage/v1/object/<bucket>/<path>
  const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/${uniquePath}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': fileType || 'application/octet-stream',
    },
    body: buffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Supabase upload failed:', errorText)
    throw new Error(`Failed to upload to Supabase Storage: ${errorText || response.statusText}`)
  }

  // Object is successfully uploaded, return the public URL
  // Public endpoint: /storage/v1/object/public/<bucket>/<path>
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/upload/${uniquePath}`
  console.log(`File uploaded successfully. Public URL: ${publicUrl}`)
  return publicUrl
}
