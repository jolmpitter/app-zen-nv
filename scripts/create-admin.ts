import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando criação do administrador...');

    const email = 'john@doe.com';
    const password = 'johndoe123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Deleta se já existir para garantir que a senha seja resetada
    try {
        await prisma.user.delete({ where: { email } }).catch(() => { });

        const user = await prisma.user.create({
            data: {
                name: 'John Doe',
                email: email,
                password: hashedPassword,
                role: 'cio',
                status: 'ATIVO',
                subscriptionStatus: 'ACTIVE',
                subscriptionPlan: 'ANUAL',
                expiresAt: new Date('2099-12-31'),
            },
        });

        console.log('✅ Administrador criado com sucesso!');
        console.log('📧 Email:', user.email);
        console.log('🔑 Senha:', password);
    } catch (error) {
        console.error('❌ Erro ao criar administrador:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
