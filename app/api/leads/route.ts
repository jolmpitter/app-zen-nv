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

    // Isolamento Multi-tenant
    if (session.user.role !== 'cio') {
      const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;
      where.gerenteId = currentGerenteId;

      // Filtro adicional para atendentes (só veem seus próprios leads dentro da equipe)
      if (session.user.role === 'atendente') {
        where.atendenteId = session.user.id;
      }
    }

    if (status && status !== 'todos') {
      where.status = status;
    }

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
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;

    if (!currentGerenteId && session.user.role !== 'cio') {
      return NextResponse.json({ error: 'Gerente da equipe não identificado' }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, source, valorPotencial, notes, atendenteId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    let finalAtendenteId = atendenteId;
    if (session.user.role === 'atendente') {
      finalAtendenteId = session.user.id;
    } else if (!atendenteId) {
      // Se gerente/cio/gestor não definiu, busca primeiro da equipe
      const primeiroAtendente = await prisma.user.findFirst({
        where: { gerenteId: currentGerenteId, role: 'atendente' },
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
        gerenteId: currentGerenteId,
        status: 'novo',
      },
      include: {
        atendente: { select: { id: true, name: true, email: true } },
      },
    });

    // Auditoria Enterprise
    await prisma.auditLog.create({
      data: {
        companyId: session.user.companyId || '',
        userId: session.user.id,
        action: 'LEAD_CREATED',
        details: JSON.stringify({ leadId: lead.id, name: lead.name })
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 });
  }
}
