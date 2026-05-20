const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],  // GIF8
}

export async function isValidImage(file: File): Promise<boolean> {
  const allowedTypes = Object.keys(MAGIC_BYTES)

  // Check declared MIME type
  if (!allowedTypes.includes(file.type)) return false

  // Read first 8 bytes and check magic bytes
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const signatures = MAGIC_BYTES[file.type]
  if (!signatures) return false

  return signatures.some(sig =>
    sig.every((byte, i) => bytes[i] === byte)
  )
}

export const MAX_POST_IMAGE = 2 * 1024 * 1024    // 2MB
export const MAX_PROOF_IMAGE = 5 * 1024 * 1024   // 5MB