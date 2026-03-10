import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // 1. We only want to protect data-mutating requests (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    
    // 2. EXCEPTION: Let the login route pass through freely!
    if (request.nextUrl.pathname === '/api/auth/login') {
      return NextResponse.next();
    }

    // 3. Initialize Supabase in the middleware to check cookies
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    );

    // 4. Verify the session token
    const { data: { user } } = await supabase.auth.getUser();

    // 5. Reject immediately if no valid session is found
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Middleware blocked request' },
        { status: 401 }
      );
    }
    
    // If they have a token, let them pass
    return supabaseResponse;
  }

  // If it is just a standard GET request (like fetching standings), let it pass
  return NextResponse.next();
}

// 6. Matcher Config: Tell Next.js to only run this middleware on /api/ routes
export const config = {
  matcher: [
    '/api/:path*',
  ],    
};