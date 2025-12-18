import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando Migração para Estrutura Enterprise ---');

    // 1. Criar Empresa Padrão
    const defaultCompany = await prisma.company.upsert({
        where: { subdomain: 'polodash' },
        update: {},
        create: {
            name: 'POLODASH HQ',
            subdomain: 'polodash',
            themeSettings: JSON.stringify({ primaryColor: '#10b981', font: 'Inter' }),
        },
    });

    console.log(`✅ Empresa criada: ${defaultCompany.name}`);

    // 2. Criar Setor e Equipe Padrão
    const salesSector = await prisma.sector.create({
        data: {
            name: 'Vendas',
            companyId: defaultCompany.id,
        },
    });

    const alphaTeam = await prisma.team.create({
        data: {
            name: 'Equipe Alfa',
            companyId: defaultCompany.id,
            sectorId: salesSector.id,
        },
    });

    console.log('✅ Setor "Vendas" e Equipe "Alfa" criados.');

    // 3. Vincular usuários existentes à empresa
    const users = await prisma.user.findMany();
    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                companyId: defaultCompany.id,
                // Se for atendente, podemos opcionalmente colocar no setor/equipe padrão
                ...(user.role === 'atendente' ? { sectorId: salesSector.id, teamId: alphaTeam.id } : {}),
            },
        });
    }

    console.log(`✅ ${users.length} usuários vinculados à empresa.`);

    // 4. Vincular Leads e Métricas
    const leadsCount = await prisma.lead.updateMany({
        data: { companyId: defaultCompany.id },
    });

    const metricsCount = await prisma.dailyMetric.updateMany({
        data: { companyId: defaultCompany.id },
    });

    const accountsCount = await prisma.facebookAdAccount.updateMany({
        data: { companyId: defaultCompany.id },
    });

    console.log(`✅ ${leadsCount.count} leads, ${metricsCount.count} métricas e ${accountsCount.count} contas de anúncios migradas.`);

    console.log('--- Migração Concluída com Sucesso! ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
