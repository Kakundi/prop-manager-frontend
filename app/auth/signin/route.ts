// app/auth/signin/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Redirect /auth/signin requests along with search params to /login
  return NextResponse.redirect(new URL(`/login${requestUrl.search}`, requestUrl.origin));
}