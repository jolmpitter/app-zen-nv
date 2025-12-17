import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { uploadFile, deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        gestor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const facebookAccessToken = formData.get('facebookAccessToken') as string;
    const facebookAdAccountId = formData.get('facebookAdAccountId') as string;

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name) updateData.name = name;

    // Verificar se email já existe (se for diferente do atual)
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // Atualizar senha se fornecida
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Senha atual é obrigatória para trocar a senha' },
          { status: 400 }
        );
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Upload de avatar se fornecido
    if (avatarFile) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const fileName = `avatars/${Date.now()}-${avatarFile.name}`;

      // Deletar avatar anterior se existir
      if (user.avatarUrl) {
        try {
          await deleteFile(user.avatarUrl);
        } catch (error) {
          console.error('Erro ao deletar avatar anterior:', error);
        }
      }

      const avatarKey = await uploadFile(buffer, fileName, avatarFile.type);
      updateData.avatarUrl = avatarKey;
    }

    // Atualizar credenciais do Facebook Ads (apenas para gestor e gerente)
    if (user.role === 'gestor' || user.role === 'gerente') {
      if (facebookAccessToken) {
        updateData.facebookAccessToken = facebookAccessToken;
      }
      if (facebookAdAccountId) {
        updateData.facebookAdAccountId = facebookAdAccountId;
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        facebookAccessToken: true,
        facebookAdAccountId: true,
        createdAt: true,
        gestor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
