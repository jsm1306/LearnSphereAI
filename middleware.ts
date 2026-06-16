import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
  "/dashboard", 
  "/upload", 
  "/chat", 
  "/quiz", 
  "/recommendations", 
  "/progress"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect only the specified routes (and their subpaths).
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("[middleware] protected", {
    pathname,
    hasToken: Boolean(token),
  });

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Keep returnUrl for convenience.
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/upload/:path*", 
    "/chat/:path*", 
    "/quiz/:path*",
    "/recommendations/:path*",
    "/progress/:path*"
  ],
};

