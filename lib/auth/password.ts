import 'server-only'
import bcrypt from 'bcryptjs'

// bcrypt cost 12 (brief: argon2id or bcrypt cost ≥ 12). bcryptjs is pure-JS — no native build.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
