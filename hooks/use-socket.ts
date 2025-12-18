'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { data: session } = useSession() || {};

    useEffect(() => {
        if (!session?.user?.companyId) return;

        const socketInstance = io('http://localhost:3001', {
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            socketInstance.emit('join', `company_${session.user.companyId}`);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [session?.user?.companyId]);

    return socket;
};
