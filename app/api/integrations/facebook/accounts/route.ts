import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Listar todas as contas de Facebook Ads do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        facebookAdAccounts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role !== 'gerente' && user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar as integrações' },
        { status: 403 }
      );
    }

    return NextResponse.json({ accounts: user.facebookAdAccounts });
  } catch (error: any) {
    console.error('Erro ao buscar contas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Adicionar uma nova conta de Facebook Ads
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role !== 'gerente' && user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar contas' },
        { status: 403 }
      );
    }

    const { accountName, accountId, accessToken } = await req.json();

    if (!accountName || !accountId || !accessToken) {
      return NextResponse.json(
        { error: 'Nome da conta, ID e token são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a conta já existe
    const existingAccount = await prisma.facebookAdAccount.findUnique({
      where: {
        userId_accountId: {
          userId: user.id,
          accountId: accountId
        }
      }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Esta conta já está conectada' },
        { status: 409 }
      );
    }

    // Se esta for a primeira conta, definir como ativa
    const accountCount = await prisma.facebookAdAccount.count({
      where: { userId: user.id }
    });

    const newAccount = await prisma.facebookAdAccount.create({
      data: {
        userId: user.id,
        accountName,
        accountId,
        accessToken,
        isActive: accountCount === 0 // Primeira conta é ativa automaticamente
      }
    });

    return NextResponse.json({
      message: 'Conta adicionada com sucesso',
      account: {
        id: newAccount.id,
        accountName: newAccount.accountName,
        accountId: newAccount.accountId,
        isActive: newAccount.isActive,
        createdAt: newAccount.createdAt
      }
    });
  } catch (error: any) {
    console.error('Erro ao adicionar conta:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar conta', details: error.message },
      { status: 500 }
    );
  }
}
