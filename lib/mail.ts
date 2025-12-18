import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: process.env.EMAIL_SERVER_PORT === '465',
});

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
    // Se não houver configurações, logamos no console para desenvolvimento
    if (!process.env.EMAIL_SERVER_USER) {
        console.log('--- EMAIL SIMULADO ---');
        console.log(`Para: ${to}`);
        console.log(`Assunto: ${subject}`);
        console.log(`Conteúdo: ${html}`);
        console.log('----------------------');
        return { success: true, simulated: true };
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"PoloDash" <noreply@polodash.com.br>',
            to,
            subject,
            html,
        });
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error };
    }
}
