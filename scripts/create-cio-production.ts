const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCIOInProduction() {
    try {
        console.log('🔍 Verificando se o CIO já existe...');

        const existingCIO = await prisma.user.findUnique({
            where: { email: 'jolmpitter@icloud.com' }
        });

        if (existingCIO) {
            console.log('✅ CIO já existe! Atualizando senha e role...');

            const hashedPassword = await bcrypt.hash('Jolm30', 10);

            const updated = await prisma.user.update({
                where: { email: 'jolmpitter@icloud.com' },
                data: {
                    password: hashedPassword,
                    role: 'cio',
                    status: 'ATIVO',
                    name: 'CIO Admin'
                }
            });

            console.log('✅ CIO atualizado com sucesso!');
            console.log(`ID: ${updated.id}`);
            console.log(`Email: ${updated.email}`);
            console.log(`Role: ${updated.role}`);
            console.log(`Status: ${updated.status}`);
            return;
        }

        console.log('📝 Criando novo usuário CIO...');

        // Buscar ou criar empresa POLODASH HQ
        let company = await prisma.company.findFirst({
            where: { name: 'POLODASH HQ' }
        });

        if (!company) {
            console.log('🏢 Criando empresa POLODASH HQ...');
            company = await prisma.company.create({
                data: {
                    name: 'POLODASH HQ',
                    status: 'ACTIVE',
                    userLimit: 999999
                }
            });
        }

        const hashedPassword = await bcrypt.hash('Jolm30', 10);

        const cio = await prisma.user.create({
            data: {
                email: 'jolmpitter@icloud.com',
                password: hashedPassword,
                name: 'CIO Admin',
                role: 'cio',
                status: 'ATIVO',
                companyId: company.id,
                subscriptionStatus: 'ACTIVE'
            }
        });

        console.log('✅ CIO criado com sucesso!');
        console.log(`ID: ${cio.id}`);
        console.log(`Email: ${cio.email}`);
        console.log(`Role: ${cio.role}`);
        console.log(`Status: ${cio.status}`);
        console.log(`Empresa: ${company.name}`);
        console.log('\n🎯 Agora você pode fazer login com:');
        console.log('Email: jolmpitter@icloud.com');
        console.log('Senha: Jolm30');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createCIOInProduction();
