'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle, PauseCircle, DollarSign, TrendingUp, Calendar, Settings, ArrowLeft, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
  created_time: string;
}

interface FacebookAdAccount {
  id: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
}

export default function CampanhasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newBudget, setNewBudget] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'gerente' && session?.user?.role !== 'gestor') {
      router.push('/dashboard');
      return;
    }

    fetchAccounts();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/integrations/facebook/accounts');
      const data = await res.json();
      if (data.facebookAdAccounts) {
        setAccounts(data.facebookAdAccounts);
        const active = data.facebookAdAccounts.find((acc: FacebookAdAccount) => acc.isActive);
        if (active) {
          setSelectedAccount(active.id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas');
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/facebook/campaigns?accountId=${selectedAccount}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setCampaigns([]);
      } else {
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    // Validações
    if (newBudget) {
      const budget = parseFloat(newBudget);
      if (isNaN(budget) || budget <= 0) {
        toast.error('Orçamento deve ser um valor positivo');
        return;
      }
      if (budget < 1) {
        toast.error('Orçamento mínimo é R$ 1,00');
        return;
      }
      if (budget > 1000000) {
        toast.error('Orçamento máximo é R$ 1.000.000,00');
        return;
      }
    }

    if (!newStatus && !newBudget) {
      toast.error('Nenhuma alteração foi feita');
      return;
    }

    const loadingToast = toast.loading('Atualizando campanha...');

    try {
      const updates: any = {};
      if (newStatus && newStatus !== editingCampaign.status) {
        updates.status = newStatus;
      }
      if (newBudget && parseFloat(newBudget) !== editingCampaign.daily_budget) {
        updates.dailyBudget = parseFloat(newBudget);
      }

      if (Object.keys(updates).length === 0) {
        toast.dismiss(loadingToast);
        toast.info('Nenhuma mudança detectada');
        setEditingCampaign(null);
        return;
      }

      const res = await fetch(`/api/integrations/facebook/campaigns/${editingCampaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccount, ...updates })
      });

      const data = await res.json();
      toast.dismiss(loadingToast);
      
      if (data.error) {
        toast.error(data.error);
      } else {
        const changesText = [];
        if (updates.status) changesText.push(`Status: ${updates.status}`);
        if (updates.dailyBudget) changesText.push(`Orçamento: R$ ${updates.dailyBudget.toFixed(2)}`);
        
        toast.success(`Campanha atualizada! ${changesText.join(' • ')}`);
        setEditingCampaign(null);
        setNewBudget('');
        setNewStatus('');
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setNewBudget(campaign.daily_budget?.toString() || '');
    setNewStatus(campaign.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'ARCHIVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativa';
      case 'PAUSED':
        return 'Pausada';
      case 'ARCHIVED':
        return 'Arquivada';
      default:
        return status;
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 pt-16 lg:pt-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/meta-ads')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestão de Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas campanhas do Meta Ads</p>
        </div>
      </div>

      {/* Seleção de Conta */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conta de Anúncios</CardTitle>
          <CardDescription>Selecione a conta para gerenciar</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.accountName} {account.isActive && '(Ativa)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista de Campanhas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {campaign.objective}
                      </span>
                      {campaign.daily_budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {campaign.daily_budget.toFixed(2)}/dia
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(campaign.created_time).toLocaleDateString('pt-BR')}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/meta-ads/campanhas/${campaign.id}`)}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Ad Sets
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(campaign)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>{editingCampaign?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      Ativa
                    </div>
                  </SelectItem>
                  <SelectItem value="PAUSED">
                    <div className="flex items-center gap-2">
                      <PauseCircle className="w-4 h-4" />
                      Pausada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Orçamento Diário (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="Ex: 100.00"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateCampaign} className="flex-1">
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingCampaign(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
