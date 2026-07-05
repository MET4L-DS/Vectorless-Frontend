import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin, href } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error_desc = searchParams.get('error_description')

  console.log(`[auth/callback] Hit! URL: ${href}`)

  if (error_desc) {
    console.error(`[auth/callback] Auth error from URL: ${error_desc}`)
  }

  let redirectUrl = `${origin}${next}`
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (!isLocalEnv && forwardedHost) {
    redirectUrl = `https://${forwardedHost}${next}`
  }
  const response = NextResponse.redirect(redirectUrl)

  if (code) {
    console.log(`[auth/callback] Found code. Exchanging for session...`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log(`[auth/callback] Exchange successful. User ID: ${data.session?.user.id}, is_anonymous: ${data.session?.user.is_anonymous}`)
    } else {
      console.error(`[auth/callback] Code exchange failed:`, error.message)
    }
  } else {
    console.log(`[auth/callback] No 'code' param found in URL.`)
  }

  return response
}
