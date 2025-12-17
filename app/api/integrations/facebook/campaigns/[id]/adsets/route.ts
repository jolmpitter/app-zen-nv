import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { facebookAdAccounts: true }
    });

    if (!user || (user.role !== 'gerente' && user.role !== 'gestor')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const campaignId = params.id;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    // Buscar a conta do Meta Ads
    let account;
    if (accountId) {
      account = user.facebookAdAccounts.find(acc => acc.id === accountId);
    } else {
      account = user.facebookAdAccounts.find(acc => acc.isActive);
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Conta do Meta Ads não encontrada' },
        { status: 404 }
      );
    }

    // Buscar ad sets da campanha
    const metaAdsAPI = new MetaAdsAPI(account.accessToken, account.accountId);
    const adsets = await metaAdsAPI.getAdSets(campaignId);

    return NextResponse.json({ adsets });
  } catch (error: any) {
    console.error('Erro ao buscar ad sets:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar ad sets' },
      { status: 500 }
    );
  }
}
