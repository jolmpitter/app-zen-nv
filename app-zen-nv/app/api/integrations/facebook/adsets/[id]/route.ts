import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

/**
 * GET - Busca detalhes de um ad set específico
 */
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

    const adsetId = params.id;
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

    // Buscar detalhes do ad set
    const metaAdsAPI = new MetaAdsAPI(account.accessToken, account.accountId);
    const adset = await metaAdsAPI.getAdSetDetails(adsetId);

    return NextResponse.json({ adset });
  } catch (error: any) {
    console.error('Erro ao buscar ad set:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar ad set' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualiza um ad set (status, orçamento, lance)
 */
export async function PATCH(
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

    const adsetId = params.id;
    const body = await req.json();
    const { accountId, status, dailyBudget, bidAmount } = body;

    // Buscar a conta do Meta Ads
    const account = user.facebookAdAccounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Conta do Meta Ads não encontrada ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Buscar detalhes atuais do ad set antes da alteração
    const metaAdsAPI = new MetaAdsAPI(account.accessToken, account.accountId);
    const currentAdSet = await metaAdsAPI.getAdSetDetails(adsetId);

    // Preparar atualizações
    const updates: any = {};
    const changes: any[] = [];

    if (status && status !== currentAdSet.status) {
      updates.status = status;
      changes.push({
        changeType: 'status_change',
        previousValue: currentAdSet.status,
        newValue: status,
        metadata: JSON.stringify({ adsetId, adsetName: currentAdSet.name })
      });
    }

    if (dailyBudget !== undefined && parseFloat(currentAdSet.daily_budget || '0') !== dailyBudget) {
      updates.dailyBudget = dailyBudget;
      changes.push({
        changeType: 'daily_budget_change',
        previousValue: currentAdSet.daily_budget || '0',
        newValue: dailyBudget.toString(),
        metadata: JSON.stringify({ adsetId, adsetName: currentAdSet.name, entity: 'adset' })
      });
    }

    if (bidAmount !== undefined && parseFloat(currentAdSet.bid_amount || '0') !== bidAmount) {
      updates.bidAmount = bidAmount;
      changes.push({
        changeType: 'bid_amount_change',
        previousValue: currentAdSet.bid_amount || '0',
        newValue: bidAmount.toString(),
        metadata: JSON.stringify({ adsetId, adsetName: currentAdSet.name, entity: 'adset' })
      });
    }

    // Atualizar ad set no Meta Ads
    if (Object.keys(updates).length > 0) {
      await metaAdsAPI.updateAdSet(adsetId, updates);

      // Registrar alterações no banco de dados
      for (const change of changes) {
        await prisma.campaignChangeLog.create({
          data: {
            userId: user.id,
            facebookAdAccountId: account.id,
            campaignId: currentAdSet.campaign_id,
            ...change
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ad set atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar ad set:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar ad set' },
      { status: 500 }
    );
  }
}
