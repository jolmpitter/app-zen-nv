import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GPTService } from '@/lib/gpt/gpt-service';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { message, flowId, context } = await req.json();

        if (!message || !flowId) {
            return NextResponse.json(
                { error: 'Mensagem e flowId são obrigatórios' },
                { status: 400 }
            );
        }

        // Get flow configuration
        const flow = await prisma.automationFlow.findUnique({
            where: { id: flowId },
            include: { company: true },
        });

        if (!flow) {
            return NextResponse.json(
                { error: 'Fluxo não encontrado' },
                { status: 404 }
            );
        }

        if (!flow.gptEnabled) {
            return NextResponse.json(
                { error: 'GPT não está habilitado para este fluxo' },
                { status: 400 }
            );
        }

        // Initialize GPT service with flow config
        const gptService = new GPTService({
            model: flow.gptModel,
            temperature: flow.gptTemperature,
            systemPrompt: flow.gptSystemPrompt || undefined,
            companyId: flow.companyId,
        });

        // Generate response
        const response = await gptService.generateResponse(message, {
            companyName: flow.company.name,
            customerName: context?.customerName,
            conversationHistory: context?.conversationHistory,
            tags: context?.tags,
            funnelStage: context?.funnelStage,
        });

        return NextResponse.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error('GPT API Error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar mensagem' },
            { status: 500 }
        );
    }
}
