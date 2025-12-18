'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  UserCog,
  User as UserIcon,
  Zap,
  FileText,
  Menu,
  X,
  Upload,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
    {
      name: 'Controle de Acesso',
      href: '/controle-acesso',
      icon: ShieldCheck,
      allowedRoles: ['cio', 'gerente'],
    },
    {
      name: 'CRM',
      href: '/crm',
      icon: Users,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
    {
      name: 'WhatsApp',
      href: '/whatsapp',
      icon: MessageSquare,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
    {
      name: 'Automações',
      href: '/whatsapp/flows',
      icon: Zap,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
    {
      name: 'Métricas',
      href: '/metricas',
      icon: BarChart3,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Importar Planilha',
      href: '/importar',
      icon: Upload,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Análise Semanal',
      href: '/analise-semanal',
      icon: Calendar,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
    {
      name: 'Meta Ads',
      href: '/meta-ads',
      icon: TrendingUp,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Relatórios',
      href: '/relatorios',
      icon: FileText,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Usuários',
      href: '/usuarios',
      icon: UserCog,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Integrações',
      href: '/integracoes',
      icon: Zap,
      allowedRoles: ['cio', 'gerente', 'gestor'],
    },
    {
      name: 'Enterprise',
      href: '/enterprise',
      icon: ShieldCheck,
      allowedRoles: ['cio', 'gerente'],
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: UserIcon,
      allowedRoles: ['cio', 'gerente', 'gestor', 'atendente'],
    },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const SidebarContent = ({ onLinkClick, isMobile = false }: { onLinkClick?: () => void; isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-r border-white/5">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
          </div>
          {(!collapsed || isMobile) && (
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
              POLODASH
            </h1>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-6 mx-2 my-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className={cn('flex items-center', (collapsed && !isMobile) ? 'justify-center' : 'space-x-3')}>
          <UserAvatar
            name={session?.user?.name || 'Usuário'}
            userId={session?.user?.id}
            size="md"
            className="border-2 border-primary/40 ring-4 ring-primary/10"
          />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{session?.user?.name || 'Usuário'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {session?.user?.role === 'cio' ? 'CIO MASTER' : session?.user?.role === 'gerente' ? 'Gerente' : session?.user?.role === 'gestor' ? 'Gestor' : 'Atendente'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navigation
          ?.filter((item) => item?.allowedRoles?.includes(session?.user?.role || ''))
          ?.map((item) => {
            const Icon = item?.icon;
            const isActive = pathname === item?.href;

            return (
              <Link
                key={item?.name}
                href={item?.href || '#'}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative',
                  (collapsed && !isMobile) ? 'justify-center' : 'space-x-3',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-white/60"
                )} />
                {(!collapsed || isMobile) && (
                  <span className="text-sm font-medium tracking-wide">
                    {item?.name}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-2 border-t border-white/5">
        <Button
          onClick={() => {
            handleLogout();
            if (onLinkClick) onLinkClick();
          }}
          variant="ghost"
          className={cn(
            'w-full text-white/60 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 rounded-xl px-4',
            (collapsed && !isMobile) ? 'justify-center' : 'justify-start'
          )}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobile) && <span className="ml-3 text-sm font-medium">Sair</span>}
        </Button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full py-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 flex items-center justify-center text-white/40 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Botão Hamburguer Mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#0a0a0f] text-white shadow-2xl border border-white/10 hover:scale-105 transition-all duration-300"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Mobile (Sheet Overlay) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-[#0a0a0f] text-white border-none shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
        >
          <SidebarContent onLinkClick={() => setMobileOpen(false)} isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:fixed lg:block left-0 top-0 h-screen bg-[#0a0a0f] text-white transition-all duration-500 z-50 border-r border-white/5',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
