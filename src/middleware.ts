import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Agar foydalanuvchi /banned sahifasida bo'lmasa, uni majburlab o'sha yerga otib yuboramiz
  if (path !== "/banned" && !path.startsWith("/_next")) {
    return NextResponse.redirect(new URL('/banned', request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
