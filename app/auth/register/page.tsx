import { redirect } from 'next/navigation'

/**
 * Register Page Redirect
 *
 * Redirects /auth/register to /auth/signup for compatibility
 */
export default function RegisterPage() {
  redirect('/auth/signup')
}