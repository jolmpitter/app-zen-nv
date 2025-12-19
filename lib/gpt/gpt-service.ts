import OpenAI from 'openai';
import { prisma } from '@/lib/db';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

interface GPTContext {
    customerName?: string;
    conversationHistory?: string[];
    tags?: string[];
    funnelStage?: string;
    companyName?: string;
}

interface GPTResponse {
    message: string;
    shouldEscalate: boolean;
    escalationReason?: string;
    tokensUsed: number;
    latencyMs: number;
}

// Default humanized prompt
const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de atendimento amigável e profissional.

PERSONALIDADE:
- Seja empático, acolhedor e natural
- Use linguagem simples e direta
- Use emojis com moderação (máximo 2 por mensagem)
- Adapte o tom ao contexto da conversa

REGRAS IMPORTANTES:
1. NUNCA invente informações sobre produtos, preços ou prazos
2. Se não souber algo, diga: "Vou verificar isso para você e já retorno!"
3. Mantenha respostas curtas (máximo 3 parágrafos)
4. Sempre termine com uma pergunta ou próximo passo claro

QUANDO ESCALAR PARA HUMANO:
- Cliente pedir para falar com atendente/pessoa
- Reclamação grave ou insatisfação
- Assuntos financeiros complexos
- Após 3 trocas sem conseguir resolver`;

// Triggers for escalation to human
const ESCALATION_TRIGGERS = [
    /falar com (humano|pessoa|atendente|alguém)/i,
    /quero (reclamar|cancelar|reembolso)/i,
    /(insatisfeito|decepcionado|péssimo|horrível)/i,
    /vou processar|advogado|procon|reclameaqui/i,
];

export class GPTService {
    private model: string;
    private temperature: number;
    private systemPrompt: string;
    private companyId: string;

    constructor(config: {
        model?: string;
        temperature?: number;
        systemPrompt?: string;
        companyId: string;
    }) {
        this.model = config.model || 'gpt-4';
        this.temperature = config.temperature || 0.7;
        this.systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        this.companyId = config.companyId;
    }

    async generateResponse(
        userMessage: string,
        context: GPTContext
    ): Promise<GPTResponse> {
        const startTime = Date.now();

        // Check for escalation triggers first
        const shouldEscalate = ESCALATION_TRIGGERS.some((trigger) =>
            trigger.test(userMessage)
        );

        if (shouldEscalate) {
            return {
                message: 'Entendo! Vou transferir você para um de nossos atendentes especializados. Um momento, por favor! 🙏',
                shouldEscalate: true,
                escalationReason: 'Trigger de escalação detectado na mensagem',
                tokensUsed: 0,
                latencyMs: Date.now() - startTime,
            };
        }

        // Build context-aware prompt
        const contextualPrompt = this.buildContextualPrompt(context);

        try {
            const completion = await getOpenAIClient().chat.completions.create({
                model: this.model,
                temperature: this.temperature,
                max_tokens: 300,
                messages: [
                    {
                        role: 'system',
                        content: `${this.systemPrompt}\n\n${contextualPrompt}`,
                    },
                    ...(context.conversationHistory?.slice(-10).map((msg, i) => ({
                        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
                        content: msg,
                    })) || []),
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ],
            });

            const latencyMs = Date.now() - startTime;
            const tokensUsed = completion.usage?.total_tokens || 0;
            const responseMessage = completion.choices[0]?.message?.content || 'Desculpe, tive um problema ao processar sua mensagem. Pode repetir?';

            // Log the interaction
            await this.logInteraction({
                prompt: userMessage,
                response: responseMessage,
                tokens: tokensUsed,
                latencyMs,
            });

            return {
                message: responseMessage,
                shouldEscalate: false,
                tokensUsed,
                latencyMs,
            };
        } catch (error) {
            console.error('GPT Service Error:', error);

            return {
                message: 'Desculpe, estou com dificuldades técnicas no momento. Um atendente vai ajudá-lo em breve! 🙏',
                shouldEscalate: true,
                escalationReason: 'Erro na API do GPT',
                tokensUsed: 0,
                latencyMs: Date.now() - startTime,
            };
        }
    }

    private buildContextualPrompt(context: GPTContext): string {
        const parts: string[] = [];

        if (context.companyName) {
            parts.push(`EMPRESA: ${context.companyName}`);
        }

        if (context.customerName) {
            parts.push(`CLIENTE: ${context.customerName}`);
        }

        if (context.funnelStage) {
            parts.push(`ETAPA DO FUNIL: ${context.funnelStage}`);
        }

        if (context.tags && context.tags.length > 0) {
            parts.push(`TAGS: ${context.tags.join(', ')}`);
        }

        return parts.length > 0 ? `CONTEXTO DO ATENDIMENTO:\n${parts.join('\n')}` : '';
    }

    private async logInteraction(data: {
        prompt: string;
        response: string;
        tokens: number;
        latencyMs: number;
        leadId?: string;
        whatsappId?: string;
    }) {
        try {
            await prisma.aILog.create({
                data: {
                    companyId: this.companyId,
                    leadId: data.leadId,
                    whatsappId: data.whatsappId,
                    prompt: data.prompt,
                    response: data.response,
                    tokens: data.tokens,
                    model: this.model,
                    temperature: this.temperature,
                    latencyMs: data.latencyMs,
                },
            });
        } catch (error) {
            console.error('Error logging AI interaction:', error);
        }
    }
}

// Factory function for easy instantiation
export async function createGPTServiceForFlow(flowId: string) {
    const flow = await prisma.automationFlow.findUnique({
        where: { id: flowId },
    });

    if (!flow) {
        throw new Error(`Flow ${flowId} not found`);
    }

    return new GPTService({
        model: flow.gptModel,
        temperature: flow.gptTemperature,
        systemPrompt: flow.gptSystemPrompt || undefined,
        companyId: flow.companyId,
    });
}
