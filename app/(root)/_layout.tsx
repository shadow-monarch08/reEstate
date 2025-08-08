import { useGlobalContext } from "@/lib/global-provider";
import { RootState } from "@/lib/redux/store";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const AppLayout = () => {
  const { user, userLoading, isLoggedIn } = useSelector(
    (state: RootState) => state.user
  );

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
