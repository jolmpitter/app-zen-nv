'use client';

import { PageHeader } from '@/components/layout/page-header';
import { WhatsAppManager } from '@/components/whatsapp/whatsapp-manager';

export default function WhatsAppPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 pt-16 lg:pt-6">
            <PageHeader
                title="WhatsApp CRM"
                subtitle="Gerencie suas conexões e chats"
                backHref="/dashboard"
            />
            <WhatsAppManager />
        </div>
    );
}
