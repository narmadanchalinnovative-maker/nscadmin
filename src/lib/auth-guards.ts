import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { AdminUser } from '@/types';

async function findAdminRecord(uid: string, email?: string): Promise<AdminUser | null> {
  try {
    const adminDocRef = doc(db, 'admin_users', uid);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists() && adminDoc.data()?.active === true) {
      return {
        uid,
        ...adminDoc.data(),
      } as AdminUser;
    }

    if (!email) {
      return null;
    }

    const adminQuery = query(
      collection(db, 'admin_users'),
      where('email', '==', email),
      limit(1)
    );
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
      return null;
    }

    const matchedDoc = adminSnapshot.docs[0];
    if (matchedDoc.data()?.active === true) {
      return {
        uid,
        ...matchedDoc.data(),
      } as AdminUser;
    }

    return null;
  } catch (error) {
    console.error('Error loading admin record:', error);
    return null;
  }
}

export async function checkAdminStatus(uid: string, email?: string): Promise<boolean> {
  const adminRecord = await findAdminRecord(uid, email);
  return adminRecord !== null;
}

export async function getAdminUser(uid: string, email?: string): Promise<AdminUser | null> {
  return findAdminRecord(uid, email);
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
