import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 登录/注册功能已临时关闭，所有页面均作为公开页面放行
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*$).*)"],
};
