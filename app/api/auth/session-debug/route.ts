import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return NextResponse.json({
    hasToken: Boolean(token),
    token: token ?? null,
  });
}

