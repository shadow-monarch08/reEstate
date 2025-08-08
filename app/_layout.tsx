// app/_layout.tsx
import "react-native-get-random-values";
import { SplashScreen, Stack } from "expo-router";
import "./global.css";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import GlobalProvider from "@/lib/global-provider";
import { initializeDatabase } from "@/lib/database/db";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { FilterModal } from "@/components/FilterModal";
import { Provider, useDispatch } from "react-redux";
import { store, AppDispatch, RootState } from "@/lib/redux/store";
import { fetchUserThunk } from "@/lib/redux/slices/userSlice";

export default function RootLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady]);
  useEffect(() => {
    (async () => {
      await initializeDatabase();
      await dispatch(fetchUserThunk());
      setIsReady(true);
    })();
  }, []);

  if (!fontsLoaded || !isReady) return null;

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={store}>
          <GlobalProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <FilterModal />
          </GlobalProvider>
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
