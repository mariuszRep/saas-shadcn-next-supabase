import { z } from 'zod'

/**
 * Email validation schema
 * - Must contain @
 * - Maximum 320 characters (RFC 5321)
 * - Basic format check
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(320, 'Email is too long (maximum 320 characters)')
  .email('Invalid email format')

/**
 * Password validation schema for sign up
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Relaxed password schema for sign in
 * - Minimum 6 characters
 */
export const signInPasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

/**
 * Sign in form validation schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
})

/**
 * Sign up form validation schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/**
 * Magic link validation schema
 */
export const magicLinkSchema = z.object({
  email: emailSchema,
})

/**
 * Password reset request validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

/**
 * Password update validation schema
 */
export const passwordUpdateSchema = z.object({
  password: passwordSchema,
})

// Export types
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>
