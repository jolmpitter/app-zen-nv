import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const where: any = {};

    // Isolamento Multi-tenant
    if (session.user.role !== 'cio') {
      const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;
      where.OR = [
        { id: currentGerenteId }, // O próprio gerente
        { gerenteId: currentGerenteId } // A equipe do gerente
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        gerenteId: true,
        gestorId: true,
        gestor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['cio', 'gerente', 'gestor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, gestorId } = body;

    // Validações
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Definir Gerente da equipe
    const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;

    if (!currentGerenteId && session.user.role !== 'cio') {
      return NextResponse.json({ error: 'Gerente não identificado para esta equipe' }, { status: 400 });
    }

    // Validar Limites da Equipe (Se não for CIO)
    if (session.user.role !== 'cio') {
      const teamUsers = await prisma.user.findMany({
        where: { gerenteId: currentGerenteId }
      });

      if (role === 'gestor') {
        const gestoresCount = teamUsers.filter(u => u.role === 'gestor').length;
        if (gestoresCount >= 2) {
          return NextResponse.json({ error: 'Limite de 2 Gestores por equipe atingido.' }, { status: 400 });
        }
      }

      if (role === 'atendente') {
        const atendentesCount = teamUsers.filter(u => u.role === 'atendente').length;
        if (atendentesCount >= 4) {
          return NextResponse.json({ error: 'Limite de 4 Atendentes por equipe atingido.' }, { status: 400 });
        }
      }
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: 'ATIVO', // Criado manualmente pelo gerente/gestor já nasce ativo
        gerenteId: currentGerenteId,
        gestorId: role === 'atendente' && gestorId ? gestorId : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        gerenteId: true,
        gestorId: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}