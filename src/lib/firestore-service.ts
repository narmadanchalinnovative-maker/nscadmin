import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  Timestamp,
  writeBatch,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { BaseEntity, PaginatedResponse } from '@/types';

export async function createDocument<T extends BaseEntity>(
  collectionName: string,
  data: Omit<T, 'id'>,
  userId: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      updatedBy: userId,
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    throw error;
  }
}

export async function getDocument<T extends BaseEntity>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T & { id: string };
    }
    return null;
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument<T extends BaseEntity>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error);
    throw error;
  }
}

export async function toggleStatus(
  collectionName: string,
  docId: string,
  currentStatus: 'active' | 'inactive',
  userId: string
): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateDocument(collectionName, docId, { status: newStatus } as any, userId);
}

export async function listDocuments<T extends BaseEntity>(
  collectionName: string,
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, any>,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<T & { id: string }>> {
  try {
    let constraints: QueryConstraint[] = [];

    // Add filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          constraints.push(where(key, '==', value));
        }
      }
    }

    // Add sorting
    constraints.push(orderBy(sortBy, sortOrder));

    // Build pagination constraints
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(limit, 100); // Cap at 100
    const skipCount = (pageNum - 1) * pageSize;

    // Get all results matching filters and sort
    const totalQuery = query(collection(db, collectionName), ...constraints);
    const totalDocs = await getDocs(totalQuery);
    const total = totalDocs.size;

    // Get paginated results by slicing the fetched documents
    const allDocs = totalDocs.docs;
    const data = allDocs
      .slice(skipCount, skipCount + pageSize)
      .map((d) => ({
        id: d.id,
        ...d.data(),
      })) as (T & { id: string })[];

    return {
      data,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error(`Error listing ${collectionName}:`, error);
    throw error;
  }
}

export async function searchDocuments<T extends BaseEntity>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<T & { id: string }>> {
  try {
    const constraints: QueryConstraint[] = [
      where(searchField, '>=', searchTerm),
      where(searchField, '<', searchTerm + '\uf8ff'),
      orderBy(searchField),
      orderBy('createdAt', 'desc'),
    ];

    const pageNum = Math.max(1, page);
    const pageSize = Math.min(limit, 100);
    const skipCount = (pageNum - 1) * pageSize;

    // Get all matching results
    const totalQuery = query(collection(db, collectionName), ...constraints);
    const totalDocs = await getDocs(totalQuery);
    const total = totalDocs.size;

    // Get paginated results by slicing the fetched documents
    const allDocs = totalDocs.docs;
    const data = allDocs
      .slice(skipCount, skipCount + pageSize)
      .map((d) => ({
        id: d.id,
        ...d.data(),
      })) as (T & { id: string })[];

    return {
      data,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error(`Error searching ${collectionName}:`, error);
    throw error;
  }
}

export async function batchDelete(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    docIds.forEach((docId) => {
      batch.delete(doc(db, collectionName, docId));
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error batch deleting from ${collectionName}:`, error);
    throw error;
  }
}
