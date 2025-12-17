import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedDownloadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!user?.avatarUrl) {
      return NextResponse.json({ url: null });
    }

    const signedUrl = await getSignedDownloadUrl(user.avatarUrl);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error fetching avatar URL:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avatar' },
      { status: 500 }
    );
  }
}
