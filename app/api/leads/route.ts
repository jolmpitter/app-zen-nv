import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};

    // Filtro de status
    if (status && status !== 'todos') {
      where.status = status;
    }

    // Controle de acesso por role
    if (session.user.role === 'atendente') {
      where.atendenteId = session.user.id;
    }
    // Gestor e Gerente veem todos os leads sem filtro

    const leads = await prisma.lead.findMany({
      where,
      include: {
        atendente: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, source, valorPotencial, notes, atendenteId } = body;

    // Validações
    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Determinar atendente
    let finalAtendenteId = atendenteId;

    if (session.user.role === 'atendente') {
      // Atendentes criam leads para si mesmos
      finalAtendenteId = session.user.id;
    } else if ((session.user.role === 'gestor' || session.user.role === 'gerente') && !atendenteId) {
      // Se gestor/gerente não especificou atendente, usa o primeiro disponível
      const primeiroAtendente = await prisma.user.findFirst({
        where: session.user.role === 'gestor' ? { gestorId: session.user.id } : {},
      });
      finalAtendenteId = primeiroAtendente?.id || session.user.id;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        source,
        valorPotencial: valorPotencial ? parseFloat(valorPotencial) : null,
        notes,
        atendenteId: finalAtendenteId,
        status: 'novo',
      },
      include: {
        atendente: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Criar histórico
    await prisma.leadHistory.create({
      data: {
        leadId: lead?.id || '',
        userId: session.user.id,
        action: 'lead_created',
        description: 'Lead criado',
        newValue: 'novo',
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lead' },
      { status: 500 }
    );
  }
}
