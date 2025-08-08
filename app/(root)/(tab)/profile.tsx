import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ViewBase,
  ImageSourcePropType,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { settings } from "@/constants/data";
import { logout } from "@/lib/supabase";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchUserThunk } from "@/lib/redux/slices/userSlice";

interface CustomeLinkProps {
  icon: ImageSourcePropType;
  title: string;
  isLink?: boolean;
  textStyle?: string;
  handlePress?: () => void;
}

const CustomeLink = ({
  icon,
  title,
  isLink = true,
  textStyle,
  handlePress = () => {},
}: CustomeLinkProps) => {
  return (
    <TouchableOpacity onPress={handlePress}>
      <View className="flex flex-row justify-between items-center">
        <View className="flex flex-row gap-3 items-center">
          <Image source={icon} resizeMode="contain" className="size-8" />
          <Text
            className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}
          >
            {title}
          </Text>
        </View>
        {isLink && <Image source={icons.right_arrow} className="size-6" />}
      </View>
    </TouchableOpacity>
  );
};

const Profile = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const handleLogout = async () => {
    await logout();
    dispatch(fetchUserThunk());
  };
  return (
    <SafeAreaView className="bg-accent-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-5"
      >
        <View className="flex flex-row w-full justify-between pt-5 items-center">
          <Text className="text-xl font-rubik-semibold text-black-300">
            Profile
          </Text>
          <TouchableOpacity>
            <Image
              source={icons.bell}
              resizeMode="contain"
              className="size-7"
            />
          </TouchableOpacity>
        </View>
        <View className="w-full mt-7 flex flex-col gap-5 justify-center items-center">
          <View className="relative w-fit">
            <Image
              className="rounded-full size-44 z-20"
              source={{ uri: user?.avatar_url }}
              resizeMode="contain"
            />
            <TouchableOpacity className="z-40 absolute top-[80%] right-3">
              <Image
                className="size-8"
                source={icons.edit}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-rubik-semibold text-black-300 text-pretty break-words text-center">
            {user?.full_name}
          </Text>
        </View>
        <View className="flex flex-col gap-5 py-5 border-t-[1px] border-primary-200 mt-7">
          {settings.slice(0, 2).map((value, i) => (
            <CustomeLink title={value.title} icon={value.icon} key={i} />
          ))}
        </View>
        <View className="flex flex-col gap-5 py-5 border-t-[1px] border-primary-200">
          {settings.slice(2).map((value, i) => (
            <CustomeLink title={value.title} icon={value.icon} key={i} />
          ))}
        </View>
        <View className="flex flex-col gap-5 py-5 border-t-[1px] border-primary-200">
          <CustomeLink
            title="Logout"
            icon={icons.logout}
            isLink={false}
            textStyle="text-danger"
            handlePress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
