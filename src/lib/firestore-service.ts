import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collectionGroup,
  getDoc,
  query,
  where,
  documentId,
  limit,
  orderBy,
  QueryConstraint,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { BaseEntity, PaginatedResponse } from '@/types';

export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: Omit<T, 'id'>,
  userId: string
): Promise<string> {
  try {
    // Remove undefined fields (Firestore does not accept undefined values)
    const payload: Record<string, any> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) payload[k] = v;
    });

    const docRef = await addDoc(collection(db, collectionName), {
      ...payload,
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

export async function getDocument<T extends Record<string, any>>(
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

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    // Remove undefined fields so we don't send unsupported values to Firestore
    const payload: Record<string, any> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) payload[k] = v;
    });

    await updateDoc(docRef, {
      ...payload,
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

export async function setBatchChildDocument<T extends BaseEntity & { batchId?: string }>(
  collectionName: 'courses' | 'tests',
  docId: string,
  data: T & { id?: string }
): Promise<void> {
  if (!data.batchId) {
    console.warn(`No batchId found for ${collectionName} ${docId}. Skipping batch child sync.`);
    return;
  }
  try {
    await setDoc(
      doc(db, 'batches', data.batchId, collectionName, docId),
      {
        ...data,
        id: docId,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Error syncing ${collectionName} to batch ${data.batchId}:`, error);
    throw error;
  }
}

export async function deleteBatchChildDocument(
  collectionName: 'courses' | 'tests',
  batchId: string,
  docId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'batches', batchId, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting ${collectionName} from batch ${batchId}:`, error);
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
  await updateDocument<BaseEntity>(collectionName, docId, { status: newStatus }, userId);
}

export async function listDocuments<T extends Record<string, any>>(
  collectionName: string,
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, unknown>,
  sortBy: string | null = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<T & { id: string }>> {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          constraints.push(where(key, '==', value));
        }
      }
    }

    // Add sorting if specified
    if (sortBy) {
      constraints.push(orderBy(sortBy, sortOrder));
    }

    // Build pagination constraints
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(limit, 100); // Cap at 100
    const skipCount = (pageNum - 1) * pageSize;

    // Get all results matching filters and sort
    const totalQuery = query(collection(db, collectionName), ...constraints);
    const totalDocs = await getDocs(totalQuery);
    const total = totalDocs.size;

    // Get paginated results by slicing the fetched documents
    let allDocs = totalDocs.docs;

    // If we skipped Firestore ordering to avoid index requirements, sort in memory by createdAt
    if (!sortBy) {
      allDocs.sort((a, b) => {
        const dataA = a.data();
        const dataB = b.data();
        const timeA = dataA.createdAt && typeof dataA.createdAt.toMillis === 'function' ? dataA.createdAt.toMillis() : 0;
        const timeB = dataB.createdAt && typeof dataB.createdAt.toMillis === 'function' ? dataB.createdAt.toMillis() : 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

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

export async function searchDocuments<T extends Record<string, any>>(
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

export async function findDocumentInCollectionGroup<T extends BaseEntity>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string; ref?: any }) | null> {
  try {
    const cg = collectionGroup(db, collectionName);
    const snap = await getDocs(cg);
    if (snap.empty) return null;
    const d = snap.docs.find((docSnap) => docSnap.id === docId);
    if (!d) return null;
    return { id: d.id, ref: d.ref, ...(d.data() as T) } as T & { id: string; ref?: any };
  } catch (error) {
    console.error(`Error finding ${collectionName} in collectionGroup:`, error);
    throw error;
  }
}

// Re-export a small set of firebase/firestore helpers for compatibility with
// modules that previously imported them from this file. Prefer using the
// higher-level helpers above; these exports exist as a compatibility shim.
export { collectionGroup, getDocs, query, where, documentId, limit, doc };

export async function sendDoubtMessage(doubtId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video', senderName: string = 'Admin'): Promise<void> {
  const messagesRef = collection(db, 'doubts', doubtId, 'messages');
  await addDoc(messagesRef, {
    text,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    senderId: 'admin',
    senderName,
    createdAt: Timestamp.now(),
  });
  
  await updateDoc(doc(db, 'doubts', doubtId), {
    hasUnreadAdmin: false
  });
}

export async function uploadChatMedia(doubtId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not initialized');
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `chat_media/${doubtId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export async function sendSupportTicketMessage(ticketId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video', senderName: string = 'Admin'): Promise<void> {
  const messagesRef = collection(db, 'support_tickets', ticketId, 'messages');
  await addDoc(messagesRef, {
    text,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    senderId: 'admin',
    senderName,
    createdAt: Timestamp.now(),
  });
  
  await updateDoc(doc(db, 'support_tickets', ticketId), {
    hasUnreadAdmin: false,
    updatedAt: Timestamp.now()
  });
}

export async function uploadSupportChatMedia(ticketId: string, file: File): Promise<string> {
  if (!storage) throw new Error('Storage is not initialized');
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `support_chat_media/${ticketId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
