import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect } from "react";
import images from "../constants/images";
import icons from "../constants/icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { Redirect } from "expo-router";

const SignIn = () => {
  const { refetch, isLoggedIn, loading } = useGlobalContext();
  useEffect(() => {
    GoogleSignin.configure({
      // scopes: ["https://www.googleapis.com/auth/drive"],
      scopes: ["openid", "email", "profile"],
      webClientId: Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  if (isLoggedIn) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    try {
      const result = await login();
      if (!result) {
        refetch();
      } else {
        Alert.alert("Error", "Login Failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error);
    }
  };

  return (
    <SafeAreaView className="bg-white">
      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
        className="px-2"
      >
        <Image
          source={images.onboarding}
          resizeMode="stretch"
          className="w-full h-2/3"
        />
        <Text className="text-center uppercase text-black-100 font-rubik mt-2 text-sm">
          welcome to Re-Estate
        </Text>
        <Text className="text-2xl font-rubik-semibold mt-3 text-center capitalize">
          Let's get you close {"\n"}to{" "}
          <Text className="text-primary-300">your ideal home</Text>
        </Text>

        <Text className="text-black-100 mt-5 font-rubik text-sm text-center">
          Login to Re-Estate with Google
        </Text>
        <View className="px-6 w-full">
          <TouchableOpacity
            className="shadow-md shadow-zinc-400 w-full h-fit rounded-full py-5 bg-white mt-4"
            onPress={handleLogin}
            disabled={loading}
          >
            <View className="flex flex-row justify-center items-center gap-3">
              <Image
                source={icons.google}
                className="h-5 w-5"
                resizeMode="contain"
              />
              <Text className="text-sm font-rubik-medium">
                Sign Up with Google
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
