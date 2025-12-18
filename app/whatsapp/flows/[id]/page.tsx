'use client';

import { FlowEditor } from '@/components/whatsapp/flow-builder/flow-editor';
import { useParams } from 'next/navigation';

export default function FlowEditorPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="h-screen w-full flex flex-col pt-16 lg:pt-0">
            <FlowEditor id={id === 'new' ? undefined : id} />
        </div>
    );
}
