'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setIsSubmitted(true);
                toast.success('Instruções enviadas com sucesso!');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Erro ao processar solicitação');
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/20">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Recuperar Senha</CardTitle>
                    <CardDescription className="text-center">
                        {isSubmitted
                            ? 'Verifique seu email para redefinir a senha'
                            : 'Informe seu email cadastrado para receber as instruções'}
                    </CardDescription>
                </CardHeader>

                {isSubmitted ? (
                    <CardContent className="space-y-6 pt-4 text-center">
                        <div className="flex justify-center flex-col items-center gap-4 py-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Enviamos um link de redefinição para <strong>{email}</strong>.
                                O link expira em 1 hora.
                            </p>
                        </div>
                        <Link href="/login" className="block w-full">
                            <Button variant="outline" className="w-full">
                                Voltar para o Login
                            </Button>
                        </Link>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Link'
                                )}
                            </Button>
                            <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o Login
                            </Link>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
