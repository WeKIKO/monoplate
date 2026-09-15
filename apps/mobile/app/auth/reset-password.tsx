import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
export default function ResetPassword() { const { token } = useLocalSearchParams<{ token: string }>(); return <View className="flex-1 items-center justify-center bg-background p-lg"><Text accessibilityRole="header" className="font-heading text-2xl text-foreground">Reset password</Text><Text className="mt-sm text-foreground">Token received: {token ? "yes" : "no"}</Text></View>; }
