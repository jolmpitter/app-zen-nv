'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FacebookAccount {
  id: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  createdAt: string;
}

export default function IntegracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Formulário nova conta
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountId: '',
    accessToken: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    loadAccounts();
  }, [session, status, router]);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/integrations/facebook/accounts');
      if (!res.ok) throw new Error('Erro ao carregar contas');
      
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error: any) {
      toast.error('Erro ao carregar contas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.accountName || !newAccount.accountId || !newAccount.accessToken) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/integrations/facebook/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao adicionar conta');
      }

      toast.success('Conta adicionada com sucesso!');
      setShowDialog(false);
      setNewAccount({ accountName: '', accountId: '', accessToken: '' });
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;

    try {
      const res = await fetch(`/api/integrations/facebook/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao remover conta');

      toast.success('Conta removida com sucesso!');
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetActive = async (accountId: string) => {
    try {
      const res = await fetch(`/api/integrations/facebook/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) throw new Error('Erro ao ativar conta');

      toast.success('Conta ativada com sucesso!');
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTestConnection = async (accountId: string) => {
    setTesting(accountId);
    try {
      const res = await fetch('/api/integrations/facebook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Erro ao testar conexão: ' + error.message);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
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
            <h1 className="text-2xl sm:text-3xl font-bold">Integrações</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas contas de Meta Ads
            </p>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Conta do Meta Ads</DialogTitle>
              <DialogDescription>
                Conecte uma nova conta de anúncios do Facebook
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountName">Nome da Conta</Label>
                <Input
                  id="accountName"
                  placeholder="Ex: Cliente X - Campanha Y"
                  value={newAccount.accountName}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, accountName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="accountId">ID da Conta</Label>
                <Input
                  id="accountId"
                  placeholder="Ex: 123456789 ou act_123456789"
                  value={newAccount.accountId}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, accountId: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encontre em: Meta Business Suite → Configurações → Contas de Anúncios
                </p>
              </div>
              <div>
                <Label htmlFor="accessToken">Token de Acesso</Label>
                <div className="relative">
                  <Input
                    id="accessToken"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Seu token de acesso do Meta"
                    value={newAccount.accessToken}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, accessToken: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Gere em: developers.facebook.com → Tools → Graph API Explorer
                </p>
              </div>
              <Button onClick={handleAddAccount} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tutorial de Configuração */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Como conectar sua conta Meta Ads</CardTitle>
                <CardDescription>
                  Siga este guia passo a passo para obter suas credenciais
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTutorial(!showTutorial)}
            >
              {showTutorial ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        {showTutorial && (
          <CardContent className="space-y-6">
            {/* Passo 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-base">Obter o ID da Conta de Anúncios</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse o Meta Business Suite e navegue até as configurações de Contas de Anúncios
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open('https://business.facebook.com/settings/ad-accounts', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Meta Business Suite
                </Button>
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">📝 O que procurar:</p>
                  <p className="text-muted-foreground">
                    O ID aparece como um número grande (ex: 123456789012345) ou com prefixo "act_" (ex: act_123456789)
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-base">Gerar Token de Acesso</h4>
                <p className="text-sm text-muted-foreground">
                  Use o Graph API Explorer para gerar um token com as permissões necessárias
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open('https://developers.facebook.com/tools/explorer/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Graph API Explorer
                </Button>
                <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                  <p className="font-medium">✅ Permissões necessárias:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="bg-background px-1 py-0.5 rounded">ads_read</code> - Ler dados de anúncios</li>
                    <li><code className="bg-background px-1 py-0.5 rounded">ads_management</code> - Gerenciar campanhas</li>
                    <li><code className="bg-background px-1 py-0.5 rounded">read_insights</code> - Ler métricas e insights</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Dica: Gere um token de "Longa Duração" (60 dias) para não precisar renovar frequentemente
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-base">Adicionar no Sistema</h4>
                <p className="text-sm text-muted-foreground">
                  Com o ID da conta e o token em mãos, clique em "Adicionar Conta" no topo desta página
                </p>
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">🔒 Segurança:</p>
                  <p className="text-muted-foreground">
                    Seus tokens são armazenados de forma criptografada e nunca são expostos publicamente
                  </p>
                </div>
              </div>
            </div>

            {/* Links Úteis */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">📚 Links Úteis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => window.open('https://developers.facebook.com/docs/marketing-api/overview', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Documentação da API
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => window.open('https://www.facebook.com/business/help', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Central de Ajuda
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nenhuma conta conectada ainda
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{account.accountName}</CardTitle>
                    {account.isActive && (
                      <Badge variant="secondary">Ativa</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(account.id)}
                      >
                        Ativar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(account.id)}
                      disabled={testing === account.id}
                    >
                      {testing === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Testar'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  ID: {account.accountId} • Adicionada em{' '}
                  {new Date(account.createdAt).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Outras Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Google Ads</CardTitle>
            <CardDescription>
              Integração com Google Ads em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Em Breve</Badge>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>TikTok Ads</CardTitle>
            <CardDescription>
              Integração com TikTok Ads em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Em Breve</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
