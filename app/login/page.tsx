'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData?.email,
        password: formData?.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result?.error || 'Erro ao fazer login');
      } else {
        toast.success('Login realizado com sucesso!');

        // Redirecionamento completo para garantir carregamento limpo da sessão
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden p-4">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white tracking-tight">POLODASH</CardTitle>
          <CardDescription className="text-center text-white/60">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData?.email}
                onChange={(e) => setFormData({ ...formData, email: e?.target?.value || '' })}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/80 font-medium">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 hover:underline font-semibold"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData?.password}
                onChange={(e) => setFormData({ ...formData, password: e?.target?.value || '' })}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:ring-primary focus:border-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
            <div className="text-sm text-center text-white/50">
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 hover:underline font-bold">
                Cadastre-se agora
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Rodapé sutil */}
      <div className="absolute bottom-6 text-white/20 text-xs font-medium tracking-widest uppercase">
        Powered by Zen Company
      </div>
    </div>
  );
}
