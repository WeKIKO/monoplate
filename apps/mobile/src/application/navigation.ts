import { router } from "expo-router";
export const navigation = { push: (path: Parameters<typeof router.push>[0]) => router.push(path), replace: (path: Parameters<typeof router.replace>[0]) => router.replace(path), back: () => router.back(), canGoBack: () => router.canGoBack() } as const;
