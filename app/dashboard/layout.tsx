'use client';

import { Sidebar } from '@/components/sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NotificationsBell } from '@/components/notifications-bell';
import { UserAvatar } from '@/components/user-avatar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#091a14]">
      <Sidebar />
      <main className="pl-64 min-h-screen transition-all duration-300">
        <header className="h-16 border-b border-white/5 bg-[#091a14]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Espaço para pão de trigo ou título dinâmico se necessário */}
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <UserAvatar name={session.user.name || 'Usuário'} />
          </div>
        </header>
        <div className="p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
