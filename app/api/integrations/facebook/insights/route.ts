import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

export async function GET(req: NextRequest) {
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
        { error: 'Você não tem permissão para acessar as integrações' },
        { status: 403 }
      );
    }

    // Obter parâmetros
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'last_30d';
    const accountId = searchParams.get('accountId');

    // Buscar conta específica ou conta ativa
    let account;
    if (accountId) {
      account = await prisma.facebookAdAccount.findUnique({
        where: { id: accountId }
      });
      
      if (!account || account.userId !== user.id) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        );
      }
    } else {
      account = await prisma.facebookAdAccount.findFirst({
        where: { userId: user.id, isActive: true }
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Nenhuma conta conectada' },
        { status: 400 }
      );
    }

    // Buscar insights
    const metaApi = new MetaAdsAPI(account.accessToken, account.accountId);
    const insights = await metaApi.getAccountInsights(period);

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Erro ao buscar insights:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métricas', details: error.message },
      { status: 500 }
    );
  }
}
