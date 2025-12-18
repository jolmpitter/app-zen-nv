import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['cio', 'gerente', 'gestor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();
    const { name, email, password, role, gestorId, status } = body;

    // Validações
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Nome, email e role são obrigatórios' },
        { status: 400 }
      );
    }

    if (role && !['cio', 'gerente', 'gestor', 'atendente'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já existe (exceto para o próprio usuário)
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: name || undefined,
      email: email || undefined,
      role: role || undefined,
      status: status || undefined,
      gestorId: role === 'atendente' && gestorId ? (gestorId === 'none' ? null : gestorId) : undefined,
    };

    // Se senha foi fornecida, fazer hash
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        gestorId: true,
        gestor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Apenas gerente ou CIO pode excluir usuários
    if (!session?.user || (session.user.role !== 'gerente' && session.user.role !== 'cio')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = params.id;

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir que o gestor delete a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar seu próprio usuário' },
        { status: 400 }
      );
    }

    // Deletar usuário (cascade vai cuidar de leads e métricas relacionadas)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    );
  }
}