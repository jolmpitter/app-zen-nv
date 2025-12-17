'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

interface LeadData {
  id: string;
  nome: string;
  status: string;
  data: string;
  origem: string;
  valorPrevisto: number;
}

interface Props {
  leads: LeadData[];
}

const statusColors: Record<string, string> = {
  'novo': 'bg-blue-500',
  'em_contato': 'bg-yellow-500',
  'negociacao': 'bg-orange-500',
  'concluido': 'bg-green-500',
  'perdido': 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  'novo': 'Novo',
  'em_contato': 'Em Contato',
  'negociacao': 'Negociação',
  'concluido': 'Concluído',
  'perdido': 'Perdido',
};

export function LeadsPipelineTable({ leads }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-cyan-500" />
          Leads e Pipeline de Conversão
        </CardTitle>
        <CardDescription>Status, origem e valor previsto de cada lead</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Data</TableHead>
                <TableHead className="text-gray-300">Origem</TableHead>
                <TableHead className="text-gray-300 text-right">Valor Previsto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.length > 0 ? (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-200">
                      {lead.nome}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusColors[lead.status] || 'bg-gray-500'} text-white`}
                      >
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(lead.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {lead.origem}
                    </TableCell>
                    <TableCell className="text-right text-gray-200 font-semibold">
                      R$ {lead.valorPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumo do Pipeline */}
        {leads?.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Total de Leads</p>
              <p className="text-xl font-bold text-white">{leads.length}</p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Em Negociação</p>
              <p className="text-xl font-bold text-orange-400">
                {leads.filter(l => l.status === 'negociacao').length}
              </p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Concluídos</p>
              <p className="text-xl font-bold text-green-400">
                {leads.filter(l => l.status === 'concluido').length}
              </p>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Valor Total Previsto</p>
              <p className="text-xl font-bold text-cyan-400">
                R$ {leads.reduce((acc, l) => acc + l.valorPrevisto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
