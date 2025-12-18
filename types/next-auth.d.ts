import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    gestorId?: string | null;
    gerenteId?: string | null;
    companyId?: string | null;
    sectorId?: string | null;
    teamId?: string | null;
    status?: string;
    expiresAt?: Date | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    gestorId?: string | null;
    gerenteId?: string | null;
    companyId?: string | null;
    sectorId?: string | null;
    teamId?: string | null;
  }
}
