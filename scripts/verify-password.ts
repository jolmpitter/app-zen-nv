const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPassword() {
    const email = 'jolmpitter@icloud.com';
    const inputPassword = 'Jolm30';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado.');
        return;
    }

    const isValid = await bcrypt.compare(inputPassword, user.password);
    console.log(`Email: ${user.email}`);
    console.log(`Password is valid: ${isValid ? '✅ SIM' : '❌ NÃO'}`);
}

checkPassword().catch(console.error).finally(() => prisma.$disconnect());
