'use client';

import { OKRManager } from '@/components/okr/okr-manager';
import { AnimatedDiv } from '@/components/animated/motion-components';
import { fadeIn } from '@/lib/animations';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OKRPage() {
    const router = useRouter();
    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 min-h-full space-y-4">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard')}
                    className="rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">OKRs e Metas</h1>
            </div>
            <AnimatedDiv variants={fadeIn}>
                <OKRManager />
            </AnimatedDiv>
        </div>
    );
}
