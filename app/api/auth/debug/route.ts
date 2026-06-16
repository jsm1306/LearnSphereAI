import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasAuthUrlEnv: Boolean(process.env.NEXTAUTH_URL),
    envKeysPresent: Object.fromEntries(
      ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "NEXTAUTH_SITE_URL"].map((k) => [k, Boolean((process as any).env?.[k])])
    ),
  });
}

