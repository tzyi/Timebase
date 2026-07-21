import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";

const prisma = require("@prisma/client").PrismaClient;

// 擴充 Session 型別 : NextAuth 預設的 session.user 不一定包含自訂的 id。這段TypeScript 宣告擴充讓程式知道他們型別
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name?: string;
    };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const prismaInstance = new prisma();
        const user = await prismaInstance.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        await prismaInstance.$disconnect();

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id);
      }
      return session;
    },
  },
});
