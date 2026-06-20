import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.isActive) return null
        const isValid = await compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id

        const [assignments, userPerms] = await Promise.all([
          prisma.roleAssignment.findMany({
            where: { userId: user.id },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          }),
          prisma.userPermission.findMany({ where: { userId: user.id } }),
        ])
        const perms: any[] = []
        for (const a of assignments) {
          for (const rp of a.role.permissions) {
            const existing = perms.find(p => p.permissionId === rp.permissionId)
            if (existing) {
              existing.canCreate = existing.canCreate || rp.canCreate
              existing.canRead = existing.canRead || rp.canRead
              existing.canUpdate = existing.canUpdate || rp.canUpdate
              existing.canDelete = existing.canDelete || rp.canDelete
            } else {
              perms.push({
                permissionId: rp.permissionId,
                permission: rp.permission,
                canCreate: rp.canCreate,
                canRead: rp.canRead,
                canUpdate: rp.canUpdate,
                canDelete: rp.canDelete,
              })
            }
          }
        }
        for (const up of userPerms) {
          const existing = perms.find(p => p.permission?.module === up.module)
          if (existing) {
            existing.canCreate = up.canCreate
            existing.canRead = up.canRead
            existing.canUpdate = up.canUpdate
            existing.canDelete = up.canDelete
          } else {
            perms.push({
              permissionId: up.module,
              permission: { module: up.module },
              canCreate: up.canCreate,
              canRead: up.canRead,
              canUpdate: up.canUpdate,
              canDelete: up.canDelete,
            })
          }
        }
        token.permissions = perms
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
        ;(session.user as any).permissions = token.permissions
      }
      return session
    },
  },
}
