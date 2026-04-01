// Extension storage utilities

export async function getStoredData<T>(key: string): Promise<T | null> {
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

export async function setStoredData(key: string, value: any): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function removeStoredData(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}
