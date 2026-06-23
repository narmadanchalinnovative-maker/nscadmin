import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Subject, PaginatedResponse } from '@/types';
import { subjectSchema } from '@/schemas';

const COLLECTION = 'subjects';

export const subjectService = {
  async create(data: Partial<Subject>, adminId: string): Promise<string> {
    const validated = subjectSchema.parse(data);
    const docRef = doc(collection(db, COLLECTION));
    
    await setDoc(docRef, {
      ...validated,
      createdBy: adminId,
      updatedBy: adminId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  },

  async update(id: string, data: Partial<Subject>, adminId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    const updateData = {
      ...data,
      updatedBy: adminId,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
  },

  async get(id: string): Promise<Subject | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Subject;
  },

  async listByCourse(courseId: string, page = 1, limitCount = 100): Promise<PaginatedResponse<Subject & { id: string }>> {
    const q = query(
      collection(db, COLLECTION),
      where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Subject & { id: string })[];

    // Sort in memory to avoid needing a composite index
    items.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt as any).toMillis() : 0;
      const timeB = b.createdAt ? (b.createdAt as any).toMillis() : 0;
      return timeB - timeA;
    });

    const total = items.length;
    const skipCount = (page - 1) * limitCount;
    items = items.slice(skipCount, skipCount + limitCount);

    return {
      data: items,
      total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount)
    };
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};
