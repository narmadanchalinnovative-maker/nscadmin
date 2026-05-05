import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AdminUser } from '@/types';

export async function checkAdminStatus(uid: string): Promise<boolean> {
  try {
    const adminDocRef = doc(db, 'admin_users', uid);
    const adminDoc = await getDoc(adminDocRef);
    return adminDoc.exists() && adminDoc.data()?.active === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    const adminDocRef = doc(db, 'admin_users', uid);
    const adminDoc = await getDoc(adminDocRef);
    if (adminDoc.exists() && adminDoc.data()?.active === true) {
      return {
        uid,
        ...adminDoc.data(),
      } as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

export function hasPermission(adminUser: AdminUser | null, permission: string): boolean {
  if (!adminUser) return false;
  if (adminUser.role === 'super_admin') return true;
  return adminUser.permissions.includes(permission);
}

export function canRead(adminUser: AdminUser | null, resource: string): boolean {
  return hasPermission(adminUser, `${resource}.read`);
}

export function canWrite(adminUser: AdminUser | null, resource: string): boolean {
  return hasPermission(adminUser, `${resource}.write`);
}
