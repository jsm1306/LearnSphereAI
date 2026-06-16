import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_EMAIL = "demo@learnsphere.ai";
const DEMO_PASSWORD = "demo123";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        console.log("[NextAuth] authorize called", {
          hasEmail: typeof email === "string",
          hasPassword: typeof password === "string",
          email,
        });

        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          console.log("[NextAuth] demo credentials accepted");
          // Minimal user object for JWT/session.
          return {
            id: "demo-user",
            name: "Demo",
            email: DEMO_EMAIL,
          };
        }

        console.log("[NextAuth] demo credentials rejected");
        // Invalid credentials => null.
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the demo user info into the JWT.
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        token.email = (user as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string | undefined;
      }
      return session;
    },
  },
  // Hackathon demo: avoid noisy logs.
  debug: false,
};

export function getAuthOptions() {
  return authOptions;
}

