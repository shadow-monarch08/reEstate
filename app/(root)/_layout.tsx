import { useUserStore } from "@/lib/zustand/store/useUserStore";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";
import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AppLayout = () => {
  const { userLoading, user, isLoggedIn } = useUserStore();
  const { fetchWishlistPropertyIds } = useWishlistStore();
  useEffect(() => {
    (async () => {
      if (user) {
        await fetchWishlistPropertyIds(user.id);
      }
    })();
  }, [user]);

  if (userLoading) {
    return (
      <SafeAreaView className="h-full flex justify-center items-center bg-white">
        <ActivityIndicator className="text-primary-300" size="large" />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/sign-in" />;
  }

  return <Slot />;
};

export default AppLayout;
