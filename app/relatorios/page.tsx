'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileDown, Mail, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FacebookAccount {
  id: string;
  accountName: string;
}

export default function RelatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [period, setPeriod] = useState('last_30d');
  const [recipients, setRecipients] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [createLink, setCreateLink] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState('7');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    loadAccounts();
  }, [session, status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/integrations/facebook/accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
      if (data.accounts?.length > 0) {
        setSelectedAccount(data.accounts[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar contas');
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleGenerateReport = async () => {
    if (!selectedAccount) {
      toast.error('Selecione uma conta');
      return;
    }

    if (sendEmail) {
      if (!recipients.trim()) {
        toast.error('Digite os emails dos destinatários');
        return;
      }

      // Validar cada email
      const emails = recipients.split(',').map(e => e.trim());
      const invalidEmails = emails.filter(email => !validateEmail(email));

      if (invalidEmails.length > 0) {
        toast.error(`Emails inválidos: ${invalidEmails.join(', ')}`);
        return;
      }
    }

    if (createLink) {
      const expiryDays = parseInt(linkExpiry);
      if (isNaN(expiryDays) || expiryDays < 1 || expiryDays > 365) {
        toast.error('Dias de validade deve ser entre 1 e 365');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          period,
          sendEmail,
          recipients: sendEmail ? recipients.split(',').map(e => e.trim()) : [],
          createPublicLink: createLink,
          linkExpiresInDays: createLink ? parseInt(linkExpiry) : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
      }

      const data = await res.json();

      // Download PDF
      const linkElement = document.createElement('a');
      linkElement.href = `data:application/pdf;base64,${data.pdfBase64}`;
      linkElement.download = `relatorio-meta-ads-${new Date().toISOString().split('T')[0]}.pdf`;
      linkElement.click();

      if (sendEmail) {
        toast.success('Relatório gerado e enviado por email!');
      } else {
        toast.success('Relatório gerado com sucesso!');
      }

      if (data.publicLink) {
        toast.success(`Link público: ${data.publicLink}`, { duration: 10000 });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Relatórios de Meta Ads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gere relatórios em PDF e envie por email
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
          <CardDescription>
            Configure e gere relatórios personalizados de suas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Conta de Anúncios</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
                  <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="this_month">Este mês</SelectItem>
                  <SelectItem value="last_month">Mês passado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="cursor-pointer">
                Enviar por email
              </Label>
            </div>

            {sendEmail && (
              <div>
                <Label>Destinatários (separados por vírgula)</Label>
                <Input
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createLink"
                checked={createLink}
                onCheckedChange={(checked) => setCreateLink(checked as boolean)}
              />
              <Label htmlFor="createLink" className="cursor-pointer">
                Criar link público
              </Label>
            </div>

            {createLink && (
              <div>
                <Label>Validade do link (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Configuração SMTP</CardTitle>
          <CardDescription>
            Para enviar emails, configure as variáveis de ambiente SMTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>Adicione as seguintes variáveis no arquivo .env:</p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
              SMTP_HOST=smtp.gmail.com
              SMTP_PORT=587
              SMTP_SECURE=false
              SMTP_USER=seu-email@gmail.com
              SMTP_PASS=sua-senha-app
              SMTP_FROM_NAME=GESTÃO ZEN
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
