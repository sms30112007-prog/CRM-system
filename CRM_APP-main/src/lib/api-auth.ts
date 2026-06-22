import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    return await verifyJWT(token);
  } catch (error) {
    return null;
  }
}

export function isAuthorized(user: any, allowedRoles: string[]) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
