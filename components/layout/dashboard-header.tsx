'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Search, ChevronDown, User, Settings, LogOut, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsBell } from '@/components/notifications-bell';
import { UserAvatar } from '@/components/user-avatar';
import { signOut } from 'next-auth/react';
import { DateFilter } from '@/components/date-filter';
import { DateRange } from 'react-day-picker';

interface DashboardHeaderProps {
    title?: string;
    subtitle?: string;
    showSearch?: boolean;
    showDateFilter?: boolean;
    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    children?: React.ReactNode;
}

export function DashboardHeader({
    title = 'Dashboard',
    subtitle,
    showSearch = true,
    showDateFilter = true,
    dateRange,
    onDateRangeChange,
    children
}: DashboardHeaderProps) {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl mb-6">
            <div className="flex flex-col lg:flex-row lg:h-16 items-start lg:items-center justify-between px-4 sm:px-6 py-3 lg:py-0 gap-3 lg:gap-0">
                {/* Left: Title */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-white/40">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Center: Search (hidden on mobile) */}
                {showSearch && (
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                                placeholder="Buscar leads, campanhas..."
                                className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:ring-primary/50"
                            />
                        </div>
                    </div>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
                    {/* Date Filter */}
                    {showDateFilter && onDateRangeChange && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-white/40 hidden sm:block" />
                            <DateFilter value={dateRange} onChange={onDateRangeChange} />
                        </div>
                    )}

                    {/* Custom children */}
                    {children}

                    {/* Notifications */}
                    <NotificationsBell />

                    {/* User Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="flex items-center gap-2 h-10 px-2 sm:px-3 hover:bg-white/5 rounded-xl"
                            >
                                <UserAvatar 
                                    name={session?.user?.name || 'Usuário'} 
                                    size="sm" 
                                />
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-medium text-white truncate max-w-[100px]">
                                        {session?.user?.name?.split(' ')[0] || 'Usuário'}
                                    </p>
                                    <p className="text-[10px] text-white/40 uppercase">
                                        {session?.user?.role === 'cio' ? 'CIO Master' : session?.user?.role || 'Membro'}
                                    </p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-white/40 hidden sm:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-56 bg-[#0a0a0f] border-white/10 text-white rounded-xl shadow-2xl"
                        >
                            <DropdownMenuLabel className="text-white/60">Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                                onClick={() => router.push('/perfil')}
                                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                            >
                                <User className="w-4 h-4 mr-2" />
                                Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => router.push('/integracoes')}
                                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Configurações
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
