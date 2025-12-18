import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Reseeding Database (Clean) ---');

    // 1. Limpar Tudo
    await prisma.auditLog.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.leadHistory.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.dailyMetric.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();
    await prisma.sector.deleteMany();
    await prisma.company.deleteMany();

    console.log('✅ Base de dados limpa.');

    // 2. Criar Empresa HQ
    const company = await prisma.company.create({
        data: {
            name: 'POLODASH Enterprise',
            subdomain: 'polodash',
            status: 'ACTIVE',
            themeSettings: JSON.stringify({ primaryColor: '#3b82f6', font: 'Inter' }),
        }
    });
    console.log('✅ Empresa Criada: ' + company.name);

    // 3. Senha Padrão
    const password = 'johndoe123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar CIO
    const cio = await prisma.user.create({
        data: {
            name: 'Administrador CIO',
            email: 'john@doe.com',
            password: hashedPassword,
            role: 'cio',
            status: 'ATIVO',
            companyId: company.id,
            subscriptionStatus: 'ACTIVE',
            expiresAt: new Date('2099-12-31'),
        }
    });
    console.log('✅ CIO Criado: john@doe.com');

    // 5. Criar Gerente
    const gerente = await prisma.user.create({
        data: {
            name: 'Gerente Operacional',
            email: 'gerente@polodash.com.br',
            password: hashedPassword,
            role: 'gerente',
            status: 'ATIVO',
            companyId: company.id,
            subscriptionStatus: 'ACTIVE',
            expiresAt: new Date('2099-12-31'),
        }
    });
    console.log('✅ Gerente Criado: gerente@polodash.com.br');

    console.log('\n--- TUDO PRONTO ---');
    console.log('Acessos:');
    console.log('- john@doe.com / johndoe123');
    console.log('- gerente@polodash.com.br / johndoe123');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
