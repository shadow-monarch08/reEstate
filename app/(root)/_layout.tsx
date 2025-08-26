import { useChatStore } from "@/lib/zustand/store/useChatStore";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";
import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import { useAppStore } from "@/lib/zustand/store/useAppStore";

const AppLayout = () => {
  const { userLoading, user, isLoggedIn } = useUserStore();
  const { setInternetStatus } = useAppStore();
  const { fetchWishlistPropertyIds } = useWishlistStore();
  const {
    start,
    stop,
    fetchConversationOverview,
    activeConversationId,
    changeChatBusConversationId,
  } = useChatStore();
  useEffect(() => {
    let unsubscribe: NetInfoSubscription;
    (async () => {
      if (user) {
        unsubscribe = NetInfo.addEventListener((state) => {
          if (state.isConnected) {
            setInternetStatus("online");
            start(user.id, activeConversationId);
          } else {
            setInternetStatus("offline");
            stop();
          }
        });

        await fetchWishlistPropertyIds(user.id);
        await fetchConversationOverview({
          range: [0, 20],
        });
        await start(user.id, activeConversationId);
      }
    })();

    return () => {
      unsubscribe();
      stop();
    };
  }, [user]);

  useEffect(() => {
    changeChatBusConversationId(activeConversationId);
  }, [activeConversationId]);

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
