import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailSender {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar transporter com credenciais de ambiente
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Envia email genérico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'GESTÃO ZEN'} <${process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Envia relatório de Meta Ads por email
   */
  async sendMetaAdsReport({
    recipients,
    accountName,
    period,
    pdfBuffer,
    reportLink,
  }: {
    recipients: string[];
    accountName: string;
    period: string;
    pdfBuffer: Buffer;
    reportLink?: string;
  }): Promise<boolean> {
    const subject = `Relatório de Meta Ads - ${accountName} - ${this.formatPeriod(period)}`;

    const html = this.generateMetaAdsEmailHTML({
      accountName,
      period,
      reportLink,
    });

    const text = `
Relatório de Meta Ads

Conta: ${accountName}
Período: ${this.formatPeriod(period)}

${reportLink ? `Visualizar online: ${reportLink}` : ''}

Relatório em anexo.
    `;

    return this.sendEmail({
      to: recipients,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `relatorio-meta-ads-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Gera HTML do email de relatório
   */
  private generateMetaAdsEmailHTML({
    accountName,
    period,
    reportLink,
  }: {
    accountName: string;
    period: string;
    reportLink?: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Meta Ads</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #228B22 0%, #006400 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #228B22;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #228B22;
      font-size: 16px;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #228B22 0%, #006400 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(135deg, #006400 0%, #004d00 100%);
    }
    .attachment-info {
      background-color: #e8f5e9;
      border: 1px solid #a5d6a7;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
    .attachment-info svg {
      width: 40px;
      height: 40px;
      margin-bottom: 10px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 GESTÃO ZEN</h1>
      <p>Relatório de Meta Ads</p>
    </div>
    
    <div class="content">
      <p>Olá!</p>
      
      <p>Segue o relatório automático de performance de Meta Ads:</p>
      
      <div class="info-box">
        <h3>🎯 Detalhes do Relatório</h3>
        <p><strong>Conta:</strong> ${accountName}</p>
        <p><strong>Período:</strong> ${this.formatPeriod(period)}</p>
        <p><strong>Gerado em:</strong> ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
      
      ${reportLink ? `
      <div style="text-align: center;">
        <a href="${reportLink}" class="button">
          🔗 Visualizar Relatório Online
        </a>
        <p style="font-size: 12px; color: #666;">Este link permite visualizar o relatório completo no navegador</p>
      </div>
      ` : ''}
      
      <div class="attachment-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #228B22;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p><strong>Relatório em PDF anexado</strong></p>
        <p style="font-size: 12px; color: #666;">O arquivo PDF contém todas as métricas, gráficos e análises detalhadas</p>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Este é um email automático. Se você tiver dúvidas ou sugestões, entre em contato com o administrador do sistema.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>GESTÃO ZEN</strong></p>
      <p>Sistema de Gestão de Tráfego Pago</p>
      <p style="margin-top: 10px; color: #999;">
        © ${new Date().getFullYear()} - Todos os direitos reservados
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Formata período para exibição
   */
  private formatPeriod(period: string): string {
    const periodMap: Record<string, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      last_7d: 'Últimos 7 dias',
      last_14d: 'Últimos 14 dias',
      last_30d: 'Últimos 30 dias',
      this_month: 'Este mês',
      last_month: 'Mês passado',
    };

    return periodMap[period] || period;
  }

  /**
   * Testa configuração de email
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão SMTP:', error);
      return false;
    }
  }
}
