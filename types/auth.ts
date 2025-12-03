import type { User } from '@supabase/supabase-js'

/**
 * Auth action result type
 */
export interface AuthResult {
  error: string | null
  data?: unknown
}

/**
 * Auth session type
 */
export interface AuthSession {
  user: User | null
  accessToken: string | null
}

/**
 * OAuth provider type
 */
export type OAuthProvider = 'google' | 'github'

/**
 * Auth context type for client-side state
 */
export interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

/**
 * Auth redirect options
 */
export interface AuthRedirectOptions {
  redirectTo?: string
}
