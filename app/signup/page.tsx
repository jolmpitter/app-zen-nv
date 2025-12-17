'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Ler o parâmetro role da URL
    const roleParam = searchParams.get('role');
    if (roleParam && ['gerente', 'gestor', 'atendente'].includes(roleParam)) {
      setInviteRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData?.password !== formData?.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if ((formData?.password?.length || 0) < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData?.name,
          email: formData?.email,
          password: formData?.password,
          role: inviteRole || 'atendente', // Usa o role do convite ou atendente como padrão
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || 'Erro ao criar conta');
        return;
      }

      toast.success('Conta criada com sucesso!');

      // Fazer login automático
      const result = await signIn('credentials', {
        email: formData?.email,
        password: formData?.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Conta criada, mas erro ao fazer login. Tente fazer login manualmente.');
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Preencha os dados para criar sua conta
          </CardDescription>
          {inviteRole && (
            <div className="flex justify-center mt-4">
              <Badge className={
                inviteRole === 'gerente' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                  inviteRole === 'gestor' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                    'bg-blue-100 text-blue-700 border-blue-300'
              }>
                Convite para: {inviteRole === 'gerente' ? 'Gerente' : inviteRole === 'gestor' ? 'Gestor' : 'Atendente'}
              </Badge>
            </div>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={formData?.name}
                onChange={(e) => setFormData({ ...formData, name: e?.target?.value || '' })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData?.email}
                onChange={(e) => setFormData({ ...formData, email: e?.target?.value || '' })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData?.password}
                onChange={(e) => setFormData({ ...formData, password: e?.target?.value || '' })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData?.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e?.target?.value || '' })}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
