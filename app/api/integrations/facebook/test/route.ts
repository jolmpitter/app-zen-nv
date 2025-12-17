import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

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
        { error: 'Você não tem permissão para acessar as integrações' },
        { status: 403 }
      );
    }

    const { accountId } = await req.json();

    // Buscar conta específica ou conta ativa
    let account;
    if (accountId) {
      account = await prisma.facebookAdAccount.findUnique({
        where: { id: accountId }
      });
      
      if (!account || account.userId !== user.id) {
        return NextResponse.json(
          { success: false, message: 'Conta não encontrada' },
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
        { 
          success: false, 
          message: 'Nenhuma conta conectada' 
        },
        { status: 400 }
      );
    }

    // Testar conexão
    const metaApi = new MetaAdsAPI(account.accessToken, account.accountId);
    const result = await metaApi.testConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao testar conexão:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erro ao testar conexão com Facebook Ads' 
      },
      { status: 500 }
    );
  }
}
