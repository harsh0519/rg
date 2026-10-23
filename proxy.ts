import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Next 16: middleware.ts is renamed to proxy.ts (nodejs runtime). Coarse gate — a valid session
// is required for /admin and /account. The admin ROLE check is enforced in app/admin/layout.tsx.
const key = new TextEncoder().encode(process.env.SESSION_SECRET);

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("rg_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  if (!(await hasValidSession(req))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
