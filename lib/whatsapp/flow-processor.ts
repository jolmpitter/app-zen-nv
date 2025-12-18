import { prisma } from '@/lib/db';
import { EvolutionAPI } from './evolution';

export class FlowProcessor {
    static async processMessage(instanceId: string, leadId: string, content: string) {
        try {
            // 1. Buscar a instância para pegar o companyId
            const instance = await prisma.whatsappInstance.findUnique({
                where: { id: instanceId },
                include: { company: true }
            });

            if (!instance) return;

            // 2. Buscar fluxos ativos desta empresa
            const activeFlows = await prisma.automationFlow.findMany({
                where: {
                    companyId: instance.companyId,
                    isActive: true
                }
            });

            for (const flow of activeFlows) {
                const context = JSON.parse(flow.flowContext || '{}');
                const nodes = context.nodes || [];
                const edges = context.edges || [];

                // 3. Encontrar gatilho correspondente
                const triggerNode = nodes.find((n: any) => n.type === 'trigger');
                if (!triggerNode) continue;

                let shouldExecute = false;
                if (triggerNode.data.triggerType === 'keyword') {
                    const keyword = triggerNode.data.keyword?.toLowerCase();
                    if (content.toLowerCase().includes(keyword)) {
                        shouldExecute = true;
                    }
                } else if (triggerNode.data.triggerType === 'new_lead') {
                    // Lógica para novo lead (poderia ser checada no momento da criação do lead)
                }

                if (shouldExecute) {
                    await this.executeFlow(flow, triggerNode, nodes, edges, leadId, instanceId);
                }
            }
        } catch (error) {
            console.error('Error processing flow:', error);
        }
    }

    private static async executeFlow(flow: any, currentNode: any, nodes: any[], edges: any[], leadId: string, instanceId: string) {
        // Buscar o próximo node
        const outgoingEdges = edges.filter((e: any) => e.source === currentNode.id);

        for (const edge of outgoingEdges) {
            const nextNode = nodes.find((n: any) => n.id === edge.target);
            if (!nextNode) continue;

            // Executar ação baseada no tipo de node
            if (nextNode.type === 'message') {
                await this.executeMessageAction(nextNode.data.label, leadId, instanceId);
            } else if (nextNode.type === 'action') {
                await this.executeSystemAction(nextNode.data, leadId);
            } else if (nextNode.type === 'condition') {
                const result = await this.evaluateCondition(nextNode.data, leadId);
                const branchedEdge = edges.find((e: any) => e.source === nextNode.id && e.sourceHandle === (result ? 'true' : 'false'));
                if (branchedEdge) {
                    const branchedNextNode = nodes.find((n: any) => n.id === branchedEdge.target);
                    if (branchedNextNode) {
                        await this.executeFlow(flow, branchedNextNode, nodes, edges, leadId, instanceId);
                    }
                }
                continue; // Condição já gerencia a recursão pela ramificação
            }

            // Continuar para o próximo node
            await this.executeFlow(flow, nextNode, nodes, edges, leadId, instanceId);
        }
    }

    private static async executeMessageAction(text: string, leadId: string, instanceId: string) {
        const evolution = new EvolutionAPI();
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead || !lead.phone) return;

        // Sanitizar número
        const remoteJid = lead.phone.replace(/\D/g, '') + '@s.whatsapp.net';

        // Enviar via Evolution
        try {
            await evolution.sendMessage(instanceId, remoteJid, text);

            // Gravar no histórico
            await prisma.message.create({
                data: {
                    whatsappId: instanceId,
                    leadId: leadId,
                    content: text,
                    fromMe: true,
                    status: 'sent'
                }
            });
        } catch (error) {
            console.error('Error sending flow message:', error);
        }
    }

    private static async executeSystemAction(data: any, leadId: string) {
        if (data.actionType === 'add_tag') {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (!lead) return;

            let currentTags = [];
            try {
                currentTags = JSON.parse(lead.tags || '[]');
            } catch (e) {
                currentTags = [];
            }

            if (!currentTags.includes(data.tag)) {
                currentTags.push(data.tag);
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { tags: JSON.stringify(currentTags) }
                });
            }
        }
        // Outras ações poderiam ser implementadas aqui
    }

    private static async evaluateCondition(data: any, leadId: string): Promise<boolean> {
        if (data.conditionType === 'lead_field') {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } }) as any;
            if (!lead) return false;

            const field = data.field?.toLowerCase();
            const value = data.value;

            if (lead[field] === value) return true;
        }
        return false;
    }
}
