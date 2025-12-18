'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref = '/dashboard', children }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(backHref)}
                    className="rounded-xl hover:bg-white/5 border border-white/10 h-10 w-10 shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-white/40">{subtitle}</p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
