import { useEffect, useState } from "react";
import { Appearance, Pressable, Text, View } from "react-native";

import { StatusBar } from "expo-status-bar";
import { colorScheme } from "react-native-css";

import "../global.css";

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(colorScheme.get());

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    colorScheme.set(newTheme);
    setCurrentTheme(newTheme);
  };

  useEffect(() => {
    // Sync with system changes
    const subscription = Appearance.addChangeListener(
      ({ colorScheme: systemScheme }) => {
        setCurrentTheme(systemScheme ?? "light");
      },
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View className="flex-1 bg-app items-center justify-center">
      <Pressable
        onPress={toggleTheme}
        className="absolute top-12 right-4 p-3 bg-button rounded-full"
      >
        <Text className="text-2xl">
          {currentTheme === "dark" ? "☀️" : "🌙"}
        </Text>
      </Pressable>

      <Text className="text-app text-2xl font-bold animate-bounce">
        Hello world!!
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
