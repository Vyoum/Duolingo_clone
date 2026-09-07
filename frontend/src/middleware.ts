import { NextRequest, NextResponse } from "next/server";

const PUBLIC = new Set(["/login"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const authed = request.cookies.get("duo_demo_session")?.value === "1";

  if (!authed && !PUBLIC.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
