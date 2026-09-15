import { theme } from "@monoplate/design-tokens";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return <View className="flex-1 items-center justify-center bg-background p-lg"><StatusBar style="auto"/><Text className="font-heading text-2xl text-foreground">{t("welcome")}</Text><Text className="mt-sm text-primary">{theme.colors.primary}</Text></View>;
}
