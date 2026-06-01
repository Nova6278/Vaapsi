const MAGIC_BYTES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  'image/png':  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
  'image/gif':  (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  'image/webp': (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,  // WEBP
}

export async function isValidImage(file: File): Promise<boolean> {
  const allowedTypes = Object.keys(MAGIC_BYTES)
  if (!allowedTypes.includes(file.type)) return false

  const buffer = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const check = MAGIC_BYTES[file.type]
  if (!check) return false

  return check(bytes)
}

export const MAX_POST_IMAGE = 2 * 1024 * 1024
export const MAX_PROOF_IMAGE = 5 * 1024 * 1024