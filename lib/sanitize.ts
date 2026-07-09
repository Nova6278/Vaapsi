/**
 * Strips HTML tags, trims whitespace, and enforces max length.
 * Use on every user text input before storing.
 */
export function sanitize(input: string, maxLength?: number): string {
  let cleaned = input
    .replace(/<[^>]*>/g, '')
    .trim()

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
  }

  return cleaned
}

/** Field length limits */
export const LIMITS = {
  title: 100,
  category: 50,
  location: 100,
  description: 500,
  verification_question: 200,
  claim_answer: 300,
} as const

/** Allowed image types and max size (2MB) */
export const IMAGE_RULES = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeBytes: 2 * 1024 * 1024,
} as const

/** Profanity / slang filter (deduped via Set as a safety net) */
const BANNED_WORDS = [...new Set([
  'fuck', 'fucker', 'fucking', 'fucked', 'fck', 'fuk', 'fuq',
  'shit', 'bullshit', 'shitty', 'sht',
  'ass', 'asshole', 'arsehole', 'arse',
  'bitch', 'biatch', 'bytch',
  'dick', 'dickhead',
  'bastard', 'cunt',
  'piss', 'pissed',
  'slut', 'whore', 'hoe',
  'crap', 'damn', 'dammit',
  'fag', 'faggot',
  'retard', 'retarded',
  'nigger', 'nigga', 'negro',
  'wanker', 'twat', 'tosser',
  'jackass', 'dumbass', 'badass',
  'moron', 'idiot',
  'cock', 'cocksucker',
  'motherfucker', 'mf',
  'chutiya', 'chutiye', 'chutia', 'chootiya', 'chu7iya',
  'madarchod', 'madarc hod', 'mc',
  'behenchod', 'bhenchod', 'behen chod', 'bc', 'b c',
  'bhosdike', 'bhosdiwale', 'bhosdi', 'bsdk', 'b s d k',
  'lund', 'lauda', 'lavda', 'lavde',
  'gaand', 'gand', 'gaandu', 'gandu',
  'randi', 'raand', 'rand',
  'harami', 'haramkhor',
  'saala', 'saale', 'sala', 'sale',
  'kamina', 'kamine', 'kamini',
  'jhatu', 'jhaatu',
  'tatti',
  'chod', 'chodna',
  'kutte', 'kutta', 'kutiya',
  'ullu', 'gadha',
  'dalle', 'dalli',
  'suar', 'suwar',
  'hagna',
  'bkl',
  'boka',
  'chhinala', 'randibaj',
  'f u c k', 'sh1t', 's h i t', 'b1tch', 'a$$', 'a s s',
  'stfu', 'gtfo', 'lmfao', 'wtf', 'af',
  'sexy', 'boobs', 'boob', 'tits', 'porn', 'nude', 'nudes',
  'sex', 'horny', 'thot',
])]

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@àáâãäåæ]/g, 'a')
    .replace(/[ßþ]/g, 'b')
    .replace(/[çčć¢©]/g, 'c')
    .replace(/[ðđď]/g, 'd')
    .replace(/[èéêëě3€]/g, 'e')
    .replace(/[ƒ]/g, 'f')
    .replace(/[ğ]/g, 'g')
    .replace(/[ĥ]/g, 'h')
    .replace(/[ìíîïı!1|]/g, 'i')
    .replace(/[ĵ]/g, 'j')
    .replace(/[ķ]/g, 'k')
    .replace(/[łľ£]/g, 'l')
    .replace(/[ñňń]/g, 'n')
    .replace(/[òóôõöø0]/g, 'o')
    .replace(/[ř]/g, 'r')
    .replace(/[$šśş5]/g, 's')
    .replace(/[ťț7]/g, 't')
    .replace(/[ùúûüů]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[žźż2]/g, 'z')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
}

export function containsProfanity(text: string): boolean {
  const normalized = normalizeText(text)
  return BANNED_WORDS.some(word => {
    if (word.includes(' ')) {
      return normalized.includes(word)
    }
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    return regex.test(normalized)
  })
}