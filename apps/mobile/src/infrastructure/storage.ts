import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export interface KeyValueStorage { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void>; }
function namespacedStorage(prefix: string, storage: KeyValueStorage): KeyValueStorage { return { get: (key) => storage.get(`${prefix}.${key}`), set: (key, value) => storage.set(`${prefix}.${key}`, value), remove: (key) => storage.remove(`${prefix}.${key}`) }; }
export const preferencesStorage = namespacedStorage("monoplate.preferences", { get: AsyncStorage.getItem, set: AsyncStorage.setItem, remove: AsyncStorage.removeItem });
export const credentialsStorage = namespacedStorage("monoplate.credentials", { get: SecureStore.getItemAsync, set: SecureStore.setItemAsync, remove: SecureStore.deleteItemAsync });
export async function clearCredentials(keys: readonly string[]) { await Promise.all(keys.map((key) => credentialsStorage.remove(key))); }
