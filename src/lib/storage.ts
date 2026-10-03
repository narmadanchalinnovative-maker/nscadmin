export async function uploadLiveClassAsset(file: File, docId: string, folder = 'live_classes') {
  const formData = new FormData();
  formData.append('file', file);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/external-api';
  const response = await fetch(`${apiUrl}/video/upload-file`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (response.ok && data.success) {
    const url = data.fileUrl;
    // We return path same as url since we don't have a storage ref path anymore
    return { path: url, url };
  } else {
    throw new Error(data.error || 'Upload failed');
  }
}
