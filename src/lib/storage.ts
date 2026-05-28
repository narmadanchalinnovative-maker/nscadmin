import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadLiveClassAsset(file: File, docId: string, folder = 'live_classes') {
  if (!storage) throw new Error('Firebase storage not initialized');
  const path = `${folder}/${docId}/${file.name}`;
  const storageRef = ref(storage, path);
  const snap = await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, reject, () => resolve(task.snapshot));
  });
  const url = await getDownloadURL(ref(storage, path));
  return { path, url };
}
