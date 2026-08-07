import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isLoginPage = nextUrl.pathname === "/login";
  const isSignupPage = nextUrl.pathname === "/signup";
  const isAuthPage = isLoginPage || isSignupPage;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isManagerRoute = nextUrl.pathname.startsWith("/manager");
  const isMemberRoute = nextUrl.pathname.startsWith("/member");

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL(getRoleHome(userRole), nextUrl));
  }

  if (isLoggedIn) {
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(getRoleHome(userRole), nextUrl));
    }
    if (isManagerRoute && userRole !== "PROJECT_MANAGER") {
      return NextResponse.redirect(new URL(getRoleHome(userRole), nextUrl));
    }
    if (isMemberRoute && userRole !== "TEAM_MEMBER") {
      return NextResponse.redirect(new URL(getRoleHome(userRole), nextUrl));
    }
  }

  return NextResponse.next();
});

function getRoleHome(role?: string) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "PROJECT_MANAGER":
      return "/manager/dashboard";
    case "TEAM_MEMBER":
      return "/member/dashboard";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};