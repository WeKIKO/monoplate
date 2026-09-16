import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export interface KeyValueStorage { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void>; }
function namespacedStorage(prefix: string, storage: KeyValueStorage): KeyValueStorage { return { get: (key) => storage.get(`${prefix}.${key}`), set: (key, value) => storage.set(`${prefix}.${key}`, value), remove: (key) => storage.remove(`${prefix}.${key}`) }; }
const asyncStorage: KeyValueStorage = { get: AsyncStorage.getItem, set: AsyncStorage.setItem, remove: AsyncStorage.removeItem };

export const preferencesStorage = namespacedStorage("monoplate.preferences", asyncStorage);
export const diagnosticsStorage = namespacedStorage("monoplate.diagnostics", asyncStorage);
export const credentialsStorage = namespacedStorage("monoplate.credentials", { get: SecureStore.getItemAsync, set: SecureStore.setItemAsync, remove: SecureStore.deleteItemAsync });
export const queryCacheStorage = {
  getItem: (key: string) => asyncStorage.get(key),
  setItem: (key: string, value: string) => asyncStorage.set(key, value),
  removeItem: (key: string) => asyncStorage.remove(key),
};
export async function clearCredentials(keys: readonly string[]) { await Promise.all(keys.map((key) => credentialsStorage.remove(key))); }
