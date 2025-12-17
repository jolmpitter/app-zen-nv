'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateFilterProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

type PresetOption = 'today' | 'last7days' | 'last30days' | 'last90days' | 'custom' | 'all';

export function DateFilter({ value, onChange, className }: DateFilterProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<PresetOption>('all');

  const presets: Record<PresetOption, { label: string; range: DateRange | undefined }> = {
    all: {
      label: 'Todos os períodos',
      range: undefined,
    },
    today: {
      label: 'Hoje',
      range: {
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
    },
    last7days: {
      label: 'Últimos 7 dias',
      range: {
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
      },
    },
    last30days: {
      label: 'Últimos 30 dias',
      range: {
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
      },
    },
    last90days: {
      label: 'Últimos 90 dias',
      range: {
        from: startOfDay(subDays(new Date(), 89)),
        to: endOfDay(new Date()),
      },
    },
    custom: {
      label: 'Período personalizado',
      range: value,
    },
  };

  const handlePresetChange = (preset: PresetOption) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      onChange(presets[preset].range);
    }
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    setSelectedPreset('custom');
    onChange(range);
  };

  const formatDateRange = () => {
    if (!value?.from) return 'Selecione o período';
    if (!value.to) return format(value.from, 'dd/MM/yyyy', { locale: ptBR });
    return `${format(value.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`;
  };

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
      {/* Seletor de Preset */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os períodos</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="last7days">Últimos 7 dias</SelectItem>
          <SelectItem value="last30days">Últimos 30 dias</SelectItem>
          <SelectItem value="last90days">Últimos 90 dias</SelectItem>
          <SelectItem value="custom">Período personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Picker para Período Personalizado */}
      {selectedPreset === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[280px] justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
