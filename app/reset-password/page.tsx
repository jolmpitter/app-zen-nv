'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (!token) {
            toast.error('Token de recuperação não encontrado');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return toast.error('As senhas não coincidem');
        }

        if (formData.password.length < 6) {
            return toast.error('A senha deve ter pelo menos 6 caracteres');
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: formData.password
                }),
            });

            if (response.ok) {
                setIsSuccess(true);
                toast.success('Senha atualizada com sucesso!');
                setTimeout(() => router.push('/login'), 3000);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Erro ao redefinir senha');
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-red-100">
                    <CardHeader className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle>Token Inválido</CardTitle>
                        <CardDescription>O link de recuperação está incompleto ou inválido.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/forgot-password" title="Recuperar Senha" className="w-full">
                            <Button variant="outline" className="w-full">Solicitar Novo Link</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Nova Senha</CardTitle>
                    <CardDescription className="text-center">
                        Crie uma senha forte e segura para sua conta
                    </CardDescription>
                </CardHeader>

                {isSuccess ? (
                    <CardContent className="space-y-6 pt-4 text-center">
                        <div className="flex justify-center flex-col items-center gap-4 py-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <p className="font-medium">Senha alterada com sucesso!</p>
                            <p className="text-sm text-muted-foreground">Você será redirecionado para o login em instantes...</p>
                        </div>
                        <Link href="/login" className="block w-full">
                            <Button variant="default" className="w-full">Entrar Agora</Button>
                        </Link>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Atualizando...
                                    </>
                                ) : (
                                    'Redefinir Senha'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
