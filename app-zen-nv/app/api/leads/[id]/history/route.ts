import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params?.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'atendente' && lead.atendenteId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { action, description } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      );
    }

    const history = await prisma.leadHistory.create({
      data: {
        leadId: params?.id || '',
        userId: session.user.id,
        action: action || 'note_added',
        description,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('Error adding lead history:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar histórico' },
      { status: 500 }
    );
  }
}
