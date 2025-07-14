import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};