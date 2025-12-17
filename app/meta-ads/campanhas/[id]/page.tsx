'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Edit, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  end_time?: string;
}

interface FacebookAdAccount {
  id: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
}

export default function AdSetsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [adsets, setAdsets] = useState<MetaAdSet[]>([]);
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [editingAdSet, setEditingAdSet] = useState<MetaAdSet | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado do formulário de edição
  const [editForm, setEditForm] = useState({
    status: '',
    dailyBudget: '',
    bidAmount: ''
  });

  // Buscar contas do Meta Ads
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/integrations/facebook/accounts');
        const data = await res.json();

        if (data.facebookAdAccounts && data.facebookAdAccounts.length > 0) {
          setAccounts(data.facebookAdAccounts);
          const activeAccount = data.facebookAdAccounts.find((acc: FacebookAdAccount) => acc.isActive);
          if (activeAccount) {
            setSelectedAccount(activeAccount.id);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar contas:', error);
      }
    }

    if (session?.user) {
      fetchAccounts();
    }
  }, [session]);

  // Buscar ad sets da campanha
  useEffect(() => {
    async function fetchAdSets() {
      if (!selectedAccount) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/integrations/facebook/campaigns/${campaignId}/adsets?accountId=${selectedAccount}`
        );
        const data = await res.json();

        if (data.adsets) {
          setAdsets(data.adsets);
        }
      } catch (error) {
        console.error('Erro ao buscar ad sets:', error);
        toast.error('Erro ao carregar conjuntos de anúncios');
      } finally {
        setLoading(false);
      }
    }

    fetchAdSets();
  }, [campaignId, selectedAccount]);

  // Abrir diálogo de edição
  const handleEdit = (adset: MetaAdSet) => {
    setEditingAdSet(adset);
    setEditForm({
      status: adset.status,
      dailyBudget: adset.daily_budget || '',
      bidAmount: adset.bid_amount || ''
    });
    setEditDialogOpen(true);
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!editingAdSet) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/integrations/facebook/adsets/${editingAdSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          status: editForm.status,
          dailyBudget: editForm.dailyBudget ? parseFloat(editForm.dailyBudget) : undefined,
          bidAmount: editForm.bidAmount ? parseFloat(editForm.bidAmount) : undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Conjunto de anúncios atualizado com sucesso!');
        setEditDialogOpen(false);
        // Recarregar ad sets
        const refreshRes = await fetch(
          `/api/integrations/facebook/campaigns/${campaignId}/adsets?accountId=${selectedAccount}`
        );
        const refreshData = await refreshRes.json();
        if (refreshData.adsets) {
          setAdsets(refreshData.adsets);
        }
      } else {
        toast.error(data.error || 'Erro ao atualizar conjunto de anúncios');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pausado</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Arquivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <div className="container mx-auto p-4 sm:p-6 pt-16 lg:pt-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/meta-ads/campanhas')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Conjuntos de Anúncios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os conjuntos de anúncios desta campanha
            </p>
          </div>
        </div>

        {/* Seleção de conta */}
        {accounts.length > 1 && (
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.accountName}
                  {account.isActive && ' (Ativa)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Lista de Ad Sets */}
      {adsets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum conjunto de anúncios encontrado para esta campanha.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {adsets.map((adset) => (
            <Card key={adset.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{adset.name}</CardTitle>
                      {getStatusBadge(adset.status)}
                    </div>
                    <CardDescription>
                      ID: {adset.id}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(adset)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {adset.daily_budget && (
                    <div>
                      <p className="text-sm text-muted-foreground">Orçamento Diário</p>
                      <p className="text-lg font-semibold">
                        R$ {parseFloat(adset.daily_budget).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {adset.lifetime_budget && (
                    <div>
                      <p className="text-sm text-muted-foreground">Orçamento Total</p>
                      <p className="text-lg font-semibold">
                        R$ {parseFloat(adset.lifetime_budget).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {adset.bid_amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Lance</p>
                      <p className="text-lg font-semibold">
                        R$ {parseFloat(adset.bid_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {adset.optimization_goal && (
                    <div>
                      <p className="text-sm text-muted-foreground">Objetivo de Otimização</p>
                      <p className="text-sm font-medium">
                        {adset.optimization_goal}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="text-sm">
                      {format(new Date(adset.created_time), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conjunto de Anúncios</DialogTitle>
            <DialogDescription>
              {editingAdSet?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingAdSet?.daily_budget && (
              <div>
                <Label htmlFor="dailyBudget">Orçamento Diário (R$)</Label>
                <Input
                  id="dailyBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.dailyBudget}
                  onChange={(e) => setEditForm({ ...editForm, dailyBudget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}

            {editingAdSet?.bid_amount && (
              <div>
                <Label htmlFor="bidAmount">Lance (R$)</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.bidAmount}
                  onChange={(e) => setEditForm({ ...editForm, bidAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
