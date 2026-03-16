import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from './lib/rate-limit'; // Import our new shield!

export async function proxy(request: NextRequest) {
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(request.method);
  
  // 1. PUBLIC READ RATE LIMIT (60 requests / minute)
  // THE COLLEGE WIFI FIX: We combine IP + User-Agent to identify specific devices on the same network
  if (!isMutation) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'unknown-device';
    const deviceFingerprint = `public_${ip}_${userAgent}`;
    
    const limitCheck = checkRateLimit(deviceFingerprint, 60, 60 * 1000);
    
    if (!limitCheck.success) {
      return NextResponse.json({ success: false, message: 'Too Many Requests' }, { status: 429 });
    }
    return NextResponse.next();
  }

  // 2. EXCEPTION: Let the login route pass through freely!
  if (request.nextUrl.pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // 3. MUTATION SECURITY & RATE LIMITING (5 requests / minute)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Block unauthorized users immediately
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Middleware blocked request' },
      { status: 401 }
    );
  }

  // Rate limit authenticated admins by their exact User ID! (5 per minute)
  const adminLimitCheck = checkRateLimit(`admin_${user.id}`, 5, 60 * 1000);
  
  if (!adminLimitCheck.success) {
    return NextResponse.json({ success: false, message: 'Too Many Requests (Admin Limit Reached)' }, { status: 429 });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};