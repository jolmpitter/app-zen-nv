import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            gestor: true,
          },
        });

        if (!user) {
          console.log(`[AUTH] Login falhou: usuário não encontrado (${email})`);
          throw new Error('Usuário não encontrado');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Credenciais inválidas');
        }

        if (user.status !== 'ATIVO' && user.role !== 'cio') {
          if (user.status === 'PENDIENTE') throw new Error('Seu cadastro aguarda aprovação');
          if (user.status === 'BLOQUEADO') throw new Error('Sua conta foi bloqueada');
          if (user.status === 'REJEITADO') throw new Error('Seu cadastro foi rejeitado');
        }

        // Validar expiração (exceto para CIO)
        if (user.role !== 'cio' && user.expiresAt && new Date(user.expiresAt) < new Date()) {
          throw new Error('Sua assinatura expirou. Entre em contato com o suporte.');
        }

        // Registrar Auditoria de Login (não bloqueante)
        try {
          await prisma.auditLog.create({
            data: {
              companyId: user.companyId || '',
              userId: user.id,
              action: 'LOGIN',
              details: JSON.stringify({ email: user.email, role: user.role })
            }
          });
        } catch (auditError) {
          console.error('Erro ao registrar log de auditoria:', auditError);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          gestorId: user.gestorId,
          gerenteId: user.gerenteId,
          companyId: user.companyId,
          sectorId: user.sectorId,
          teamId: user.teamId,
          status: user.status,
          expiresAt: user.expiresAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.gestorId = (user as any).gestorId;
        token.gerenteId = (user as any).gerenteId;
        token.companyId = (user as any).companyId;
        token.sectorId = (user as any).sectorId;
        token.teamId = (user as any).teamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.gestorId = token.gestorId as string | null;
        session.user.gerenteId = token.gerenteId as string | null;
        session.user.companyId = token.companyId as string | null;
        session.user.sectorId = token.sectorId as string | null;
        session.user.teamId = token.teamId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
