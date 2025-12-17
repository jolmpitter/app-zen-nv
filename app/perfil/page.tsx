'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Save,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  facebookAccessToken?: string | null;
  facebookAdAccountId?: string | null;
  createdAt: string;
  gestor?: {
    id: string;
    name: string;
  } | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name,
          email: data.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Buscar URL assinada do avatar se existir
        if (data.avatarUrl) {
          const avatarResponse = await fetch('/api/profile/avatar');
          if (avatarResponse.ok) {
            const avatarData = await avatarResponse.json();
            if (avatarData.url) {
              setAvatarPreview(avatarData.url);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      toast.error('Digite sua senha atual para alterá-la');
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);

      if (formData.currentPassword) {
        form.append('currentPassword', formData.currentPassword);
      }
      if (formData.newPassword) {
        form.append('newPassword', formData.newPassword);
      }
      if (avatarFile) {
        form.append('avatar', avatarFile);
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        body: form,
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setAvatarFile(null);
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-6 p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Clique para alterar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{profile?.name}</h3>
              <Badge
                variant="outline"
                className={
                  profile?.role === 'gerente'
                    ? 'border-orange-600 text-orange-600'
                    : profile?.role === 'gestor'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-blue-600 text-blue-600'
                }
              >
                {profile?.role === 'gerente' ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Gerente
                  </>
                ) : profile?.role === 'gestor' ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Gestor
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3 h-3 mr-1" />
                    Atendente
                  </>
                )}
              </Badge>
              {profile?.gestor && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Gestor: {profile.gestor.name}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Membro desde{' '}
                {new Date(profile?.createdAt || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados e segurança da conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="seu@email.com"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha (opcional)
                </h4>

                {/* Senha Atual */}
                <div className="space-y-2 mb-3">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Digite sua senha atual"
                  />
                </div>

                {/* Nova Senha */}
                <div className="space-y-2 mb-3">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Digite a nova senha"
                  />
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* Invite Links - Visible only for Gerente */}
      {profile?.role === 'gerente' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Links de Convite
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Compartilhe estes links para convidar novos usuários por hierarquia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Gerente Invite Link */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Link para Gerente
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const inviteLink = `${baseUrl}/signup?role=gerente`;
                      navigator.clipboard.writeText(inviteLink);
                      toast.success('Link copiado!');
                    }}
                    className="text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </Button>
                </div>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block overflow-x-auto text-gray-900 dark:text-gray-100 dark:text-gray-100">
                  {typeof window !== 'undefined' && `${window.location.origin}/signup?role=gerente`}
                </code>
              </div>

              {/* Gestor Invite Link */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Link para Gestor
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const inviteLink = `${baseUrl}/signup?role=gestor`;
                      navigator.clipboard.writeText(inviteLink);
                      toast.success('Link copiado!');
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </Button>
                </div>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block overflow-x-auto text-gray-900 dark:text-gray-100 dark:text-gray-100">
                  {typeof window !== 'undefined' && `${window.location.origin}/signup?role=gestor`}
                </code>
              </div>

              {/* Atendente Invite Link */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    Link para Atendente
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const inviteLink = `${baseUrl}/signup?role=atendente`;
                      navigator.clipboard.writeText(inviteLink);
                      toast.success('Link copiado!');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </Button>
                </div>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block overflow-x-auto text-gray-900 dark:text-gray-100 dark:text-gray-100">
                  {typeof window !== 'undefined' && `${window.location.origin}/signup?role=atendente`}
                </code>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2 text-blue-800 dark:text-blue-300">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Como usar os links de convite:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Clique em "Copiar" para copiar o link correspondente</li>
                      <li>Compartilhe o link com a pessoa que deseja convidar</li>
                      <li>O usuário será cadastrado automaticamente com a hierarquia correta</li>
                      <li>Gestores cadastrados por este link ficarão sob sua supervisão</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}