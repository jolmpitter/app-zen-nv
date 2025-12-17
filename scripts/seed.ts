import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ExcelRow {
  Data: string;
  'Valor Gasto (R$)'?: number;
  'Quantidade de Leads'?: number;
  'Quantidade de Vendas'?: number;
  'Valor Vendido (R$)'?: number;
  Gestor?: string;
  Atendente?: string;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Limpar dados existentes
  await prisma.leadHistory.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.dailyMetric.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash da senha padrão
  const hashedPassword = await bcrypt.hash('johndoe123', 10);

  // Criar usuário gerente (acesso total)
  const gerenteUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: hashedPassword,
      role: 'gerente',
    },
  });

  console.log('✅ Created manager user (gerente): john@doe.com');

  // Ler planilha Excel
  const workbook = XLSX.readFile('/home/ubuntu/Uploads/Gestao_Trafego_Profissional.xlsx');
  const worksheet = workbook.Sheets['Dados Diários'];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data?.length || 0} rows in Excel`);

  // Extrair gestores e atendentes únicos
  const gestores = new Set<string>();
  const atendentes = new Set<string>();

  data?.forEach((row) => {
    if (row?.Gestor) gestores.add(row.Gestor);
    if (row?.Atendente) atendentes.add(row.Atendente);
  });

  console.log(`Found ${gestores?.size || 0} gestores and ${atendentes?.size || 0} atendentes`);

  // Criar gestores
  const gestorMap = new Map<string, string>();
  for (const gestorName of gestores) {
    const gestor = await prisma.user.create({
      data: {
        name: gestorName,
        email: `${gestorName?.toLowerCase()?.replace(/\s+/g, '.')}@empresa.com`,
        password: hashedPassword,
        role: 'gestor',
      },
    });
    gestorMap.set(gestorName, gestor?.id);
    console.log(`✅ Created gestor: ${gestorName}`);
  }

  // Criar atendentes (atribuir a gestores aleatoriamente para demonstração)
  const atendenteMap = new Map<string, string>();
  const gestorIds = Array.from(gestorMap?.values() || []);

  let atendenteIndex = 0;
  for (const atendenteName of atendentes) {
    const gestorId = gestorIds?.[atendenteIndex % (gestorIds?.length || 1)];
    const atendente = await prisma.user.create({
      data: {
        name: atendenteName,
        email: `${atendenteName?.toLowerCase()?.replace(/\s+/g, '.')}@empresa.com`,
        password: hashedPassword,
        role: 'atendente',
        gestorId: gestorId,
      },
    });
    atendenteMap.set(atendenteName, atendente?.id);
    console.log(`✅ Created atendente: ${atendenteName} (under gestor)`);
    atendenteIndex++;
  }

  // Criar métricas diárias
  let metricsCreated = 0;
  for (const row of data) {
    if (!row?.Atendente || !row?.Data) continue;

    const atendenteId = atendenteMap.get(row.Atendente);
    if (!atendenteId) continue;

    const valorGasto = row['Valor Gasto (R$)'] || 0;
    const quantidadeLeads = row['Quantidade de Leads'] || 0;
    const quantidadeVendas = row['Quantidade de Vendas'] || 0;
    const valorVendido = row['Valor Vendido (R$)'] || 0;

    // Calcular métricas
    const roi = valorGasto > 0 ? ((valorVendido - valorGasto) / valorGasto) * 100 : 0;
    const custoPorLead = quantidadeLeads > 0 ? valorGasto / quantidadeLeads : 0;
    const taxaConversao = quantidadeLeads > 0 ? (quantidadeVendas / quantidadeLeads) * 100 : 0;
    const ticketMedio = quantidadeVendas > 0 ? valorVendido / quantidadeVendas : 0;

    // Converter data do Excel para Date
    let date: Date;
    if (typeof row.Data === 'number') {
      // Data é serial number do Excel
      date = new Date((row.Data - 25569) * 86400 * 1000);
    } else {
      // Data é string ISO
      date = new Date(row.Data);
    }

    await prisma.dailyMetric.create({
      data: {
        date: date,
        userId: atendenteId,
        valorGasto,
        quantidadeLeads: Math.floor(quantidadeLeads),
        quantidadeVendas: Math.floor(quantidadeVendas),
        valorVendido,
        roi: parseFloat(roi?.toFixed(2) || '0'),
        custoPorLead: parseFloat(custoPorLead?.toFixed(2) || '0'),
        taxaConversao: parseFloat(taxaConversao?.toFixed(2) || '0'),
        ticketMedio: parseFloat(ticketMedio?.toFixed(2) || '0'),
      },
    });
    metricsCreated++;
  }

  console.log(`✅ Created ${metricsCreated} daily metrics`);

  // Criar alguns leads de exemplo para o CRM
  const allAtendentes = Array.from(atendenteMap?.values() || []);

  const leadExamples = [
    { name: 'Maria Silva', email: 'maria.silva@email.com', phone: '(11) 98765-4321', status: 'novo', source: 'Facebook Ads', valorPotencial: 1500 },
    { name: 'João Santos', email: 'joao.santos@email.com', phone: '(11) 98765-4322', status: 'em_andamento', source: 'Google Ads', valorPotencial: 2500 },
    { name: 'Ana Paula', email: 'ana.paula@email.com', phone: '(11) 98765-4323', status: 'concluido', source: 'Instagram Ads', valorPotencial: 3200, valorFechado: 3200 },
    { name: 'Carlos Oliveira', email: 'carlos.oliveira@email.com', phone: '(11) 98765-4324', status: 'novo', source: 'Facebook Ads', valorPotencial: 1800 },
    { name: 'Patricia Costa', email: 'patricia.costa@email.com', phone: '(11) 98765-4325', status: 'em_andamento', source: 'Google Ads', valorPotencial: 2100 },
    { name: 'Ricardo Almeida', email: 'ricardo.almeida@email.com', phone: '(11) 98765-4326', status: 'perdido', source: 'Instagram Ads', valorPotencial: 1900 },
    { name: 'Fernanda Lima', email: 'fernanda.lima@email.com', phone: '(11) 98765-4327', status: 'novo', source: 'Facebook Ads', valorPotencial: 2800 },
    { name: 'Roberto Souza', email: 'roberto.souza@email.com', phone: '(11) 98765-4328', status: 'concluido', source: 'Google Ads', valorPotencial: 4500, valorFechado: 4200 },
    { name: 'Juliana Martins', email: 'juliana.martins@email.com', phone: '(11) 98765-4329', status: 'em_andamento', source: 'Instagram Ads', valorPotencial: 2200 },
    { name: 'Marcos Pereira', email: 'marcos.pereira@email.com', phone: '(11) 98765-4330', status: 'novo', source: 'Facebook Ads', valorPotencial: 1700 },
  ];

  for (let i = 0; i < leadExamples?.length; i++) {
    const leadData = leadExamples[i];
    const atendenteId = allAtendentes?.[i % (allAtendentes?.length || 1)];

    if (!atendenteId) continue;

    const lead = await prisma.lead.create({
      data: {
        name: leadData?.name || '',
        email: leadData?.email,
        phone: leadData?.phone,
        status: leadData?.status || 'novo',
        source: leadData?.source,
        valorPotencial: leadData?.valorPotencial,
        valorFechado: leadData?.valorFechado,
        atendenteId: atendenteId,
        notes: `Lead captado via ${leadData?.source}`,
        closedAt: leadData?.status === 'concluido' || leadData?.status === 'perdido' ? new Date() : null,
      },
    });

    // Criar histórico inicial
    await prisma.leadHistory.create({
      data: {
        leadId: lead?.id || '',
        userId: atendenteId,
        action: 'lead_created',
        description: `Lead criado e atribuído`,
        newValue: 'novo',
      },
    });

    // Se o lead foi processado, adicionar mais histórico
    if (leadData?.status !== 'novo') {
      await prisma.leadHistory.create({
        data: {
          leadId: lead?.id || '',
          userId: atendenteId,
          action: 'status_change',
          description: `Status alterado para ${leadData?.status}`,
          oldValue: 'novo',
          newValue: leadData?.status || '',
        },
      });
    }
  }

  console.log(`✅ Created ${leadExamples?.length} example leads`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
