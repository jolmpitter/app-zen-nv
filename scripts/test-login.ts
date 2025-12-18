import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testCredentials(email: string, pass: string) {
    console.log(`--- Testing Credentials for ${email} ---`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log(`✅ User found: ${user.name} (Role: ${user.role}, Status: ${user.status})`);

    const isValid = await bcrypt.compare(pass, user.password);
    if (isValid) {
        console.log('✅ Password MATCH');
    } else {
        console.log('❌ Password DOES NOT MATCH');
    }

    console.log(`Company ID: ${user.companyId}`);

    if (user.companyId) {
        const company = await prisma.company.findUnique({ where: { id: user.companyId } });
        if (company) {
            console.log(`✅ Company found: ${company.name}`);

            // Test AuditLog creation
            try {
                await prisma.auditLog.create({
                    data: {
                        companyId: user.companyId,
                        userId: user.id,
                        action: 'DIAGNOSTIC_TEST',
                        details: 'Testing if audit log works'
                    }
                });
                console.log('✅ AuditLog creation test passed');
            } catch (e: any) {
                console.log(`❌ AuditLog creation failed: ${e.message}`);
            }
        } else {
            console.log('❌ Company ID exists but company not found in DB');
        }
    }
}

async function main() {
    await testCredentials('john@doe.com', 'johndoe123');
    console.log('\n');
    await testCredentials('gerente@polodash.com.br', 'johndoe123');
}

main().finally(() => prisma.$disconnect());
