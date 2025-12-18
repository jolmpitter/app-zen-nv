import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'gerente' && session.user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    const { accountId, status, dailyBudget } = await req.json();
    const campaignId = params.id;

    // Buscar conta
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { facebookAdAccounts: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    let account;
    if (accountId) {
      account = user.facebookAdAccounts.find(acc => acc.id === accountId);
    } else {
      account = user.facebookAdAccounts.find(acc => acc.isActive);
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    const metaAdsAPI = new MetaAdsAPI(account.accessToken, account.accountId);

    // Atualizar campanha
    const result = await metaAdsAPI.updateCampaign(campaignId, { status, dailyBudget });

    // Auditoria Enterprise
    await prisma.auditLog.create({
      data: {
        companyId: session.user.companyId || '',
        userId: session.user.id,
        action: status ? 'META_ADS_STATUS_CHANGE' : 'META_ADS_BUDGET_CHANGE',
        details: JSON.stringify({ campaignId, status, dailyBudget })
      }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campanha' },
      { status: 500 }
    );
  }
}
