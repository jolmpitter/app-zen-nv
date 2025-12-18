import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = 'johndoe123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const email = 'gerente@polodash.com.br';

    await prisma.user.upsert({
        where: { email },
        update: {
            role: 'gerente',
            status: 'ATIVO',
            password: hashedPassword
        },
        create: {
            name: 'Gerente Polodash',
            email: email,
            password: hashedPassword,
            role: 'gerente',
            status: 'ATIVO',
            subscriptionStatus: 'ACTIVE',
            subscriptionPlan: 'ANUAL',
            expiresAt: new Date('2099-12-31'),
        },
    });

    console.log('✅ Gerente criado: ' + email);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
