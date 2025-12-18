export class EvolutionAPI {
    private url: string;
    private apiKey: string;

    constructor() {
        this.url = process.env.EVOLUTION_API_URL || '';
        this.apiKey = process.env.EVOLUTION_API_KEY || '';
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
        };
    }

    async createInstance(instanceName: string) {
        if (!this.url || !this.apiKey) {
            console.error('Evolution API environment variables missing');
            return null;
        }

        try {
            const res = await fetch(`${this.url}/instance/create`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: '', // Let it generate a random token
                    qrcode: true,
                    number: ''
                })
            });

            return await res.json();
        } catch (error) {
            console.error('Error creating Evolution instance:', error);
            return null;
        }
    }

    async getQrCode(instanceName: string) {
        try {
            const res = await fetch(`${this.url}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: this.headers
            });
            return await res.json();
        } catch (error) {
            console.error('Error getting QR code:', error);
            return null;
        }
    }

    async logoutInstance(instanceName: string) {
        try {
            const res = await fetch(`${this.url}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: this.headers
            });
            return await res.json();
        } catch (error) {
            console.error('Error logging out instance:', error);
            return null;
        }
    }

    async deleteInstance(instanceName: string) {
        try {
            const res = await fetch(`${this.url}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: this.headers
            });
            return await res.json();
        } catch (error) {
            console.error('Error deleting instance:', error);
            return null;
        }
    }

    async sendMessage(instanceName: string, number: string, text: string) {
        try {
            const res = await fetch(`${this.url}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    number: number,
                    text: text
                })
            });
            return await res.json();
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    async setWebhook(instanceName: string, webhookUrl: string) {
        try {
            const res = await fetch(`${this.url}/webhook/set/${instanceName}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    url: webhookUrl,
                    enabled: true,
                    events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE', 'CONTACTS_UPSERT', 'CONTACTS_UPDATE', 'PRESENCE_UPDATE', 'CHATS_UPSERT', 'CHATS_UPDATE', 'CHATS_DELETE', 'GROUPS_UPSERT', 'GROUPS_UPDATE', 'GROUP_PARTICIPANTS_UPDATE', 'CONNECTION_UPDATE']
                })
            });
            return await res.json();
        } catch (error) {
            console.error('Error setting webhook:', error);
            return null;
        }
    }
}

export const evolutionApi = new EvolutionAPI();
