const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'jolmpitter@icloud.com';
    const password = 'Jolm30';

    console.log('--- Configurando Acesso CIO ---');

    const hashedPassword = await bcrypt.hash(password, 12);

    // Garantir que existe uma empresa "POLODASH"
    let company = await prisma.company.findFirst({
        where: { name: 'POLODASH HQ' }
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'POLODASH HQ',
                status: 'ACTIVE',
                userLimit: 999
            }
        });
        console.log('✅ Empresa POLODASH HQ criada.');
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'cio',
            status: 'ATIVO',
            companyId: company.id
        },
        create: {
            email,
            name: 'CIO Jolm Pitter',
            password: hashedPassword,
            role: 'cio',
            status: 'ATIVO',
            companyId: company.id
        },
    });

    console.log(`✅ Usuário CIO ${user.email} configurado com sucesso!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
