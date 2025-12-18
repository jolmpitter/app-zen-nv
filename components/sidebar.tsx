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
      allowedRoles: ['gerente', 'gestor', 'atendente'],
    },
    {
      name: 'WhatsApp',
      href: '/whatsapp',
      icon: MessageSquare,
      allowedRoles: ['gerente', 'gestor', 'atendente'],
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
      allowedRoles: ['gerente', 'gestor', 'atendente'],
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
      allowedRoles: ['gerente', 'gestor', 'atendente'],
    },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Componente de conteúdo do sidebar (reutilizável)
  const SidebarContent = ({ onLinkClick, isMobile = false }: { onLinkClick?: () => void; isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-center">
          {(!collapsed || isMobile) && (
            <div className="w-full h-16 flex items-center justify-center">
              <h1 className="text-2xl font-bold text-white tracking-wider font-display">
                POLODASH
              </h1>
            </div>
          )}
          {collapsed && !isMobile && (
            <div className="w-12 h-12 flex items-center justify-center">
              <span className="text-xl font-bold text-white font-display">
                PD
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className={cn('flex items-center', (collapsed && !isMobile) ? 'justify-center' : 'space-x-3')}>
          <UserAvatar
            name={session?.user?.name || 'Usuário'}
            userId={session?.user?.id}
            size="md"
          />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{session?.user?.name || 'Usuário'}</p>
              <p className="text-xs text-white/70 truncate">
                {session?.user?.role === 'cio' ? 'CIO' : session?.user?.role === 'gerente' ? 'Gerente' : session?.user?.role === 'gestor' ? 'Gestor' : 'Atendente'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                  'flex items-center px-3 py-3 rounded-xl transition-all duration-300 group',
                  (collapsed && !isMobile) ? 'justify-center' : 'space-x-3',
                  isActive
                    ? 'bg-white/25 shadow-xl backdrop-blur-sm font-semibold'
                    : 'hover:bg-white/15 hover:shadow-lg hover:translate-x-1'
                )}
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md shadow-lg transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:shadow-2xl group-hover:bg-white/20">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                {(!collapsed || isMobile) && <span className="font-medium">{item?.name}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-2 border-t border-white/10">
        <Button
          onClick={() => {
            handleLogout();
            if (onLinkClick) onLinkClick();
          }}
          variant="ghost"
          className={cn(
            'w-full text-white hover:bg-white/15 hover:text-white hover:shadow-lg hover:scale-105 transition-all duration-300 rounded-xl',
            (collapsed && !isMobile) ? 'px-0' : 'justify-start'
          )}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobile) && <span className="ml-3">Sair</span>}
        </Button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full p-2 rounded-xl hover:bg-white/15 hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-black text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Mobile (Sheet Overlay) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-black text-white border-none"
        >
          <SidebarContent onLinkClick={() => setMobileOpen(false)} isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:fixed lg:block left-0 top-0 h-screen bg-gradient-to-br from-emerald-900 via-emerald-950 to-black text-white transition-all duration-300 z-50 shadow-2xl',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
