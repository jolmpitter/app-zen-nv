const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const email = 'jolmpitter@icloud.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
    });

    if (user) {
        console.log('✅ Usuário encontrado:');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log(`Empresa: ${user.company?.name || 'Nenhuma'}`);
    } else {
        console.log('❌ Usuário NÃO encontrado no banco de dados.');

        // Listar todos os usuários para ver o que temos
        const allUsers = await prisma.user.findMany({
            take: 5,
            select: { email: true, role: true }
        });
        console.log('Alguns usuários existentes:', allUsers);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
