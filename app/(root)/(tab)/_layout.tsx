import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import React from "react";
import icons from "@/constants/icons";
import { Tabs } from "expo-router";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

type CustomTabBarButtonProps = BottomTabBarButtonProps & {
  icon: ImageSourcePropType;
  title: string;
};

const TabsCustomeIcon = ({
  onPress,
  accessibilityState,
  icon,
  title,
}: CustomTabBarButtonProps) => {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center"
      onPress={onPress}
    >
      <Image
        tintColor={focused ? "#0061FF" : "#8C8E98"}
        source={icon}
        className="size-7"
        resizeMode="contain"
      />
      <Text
        className={`font-rubik text-sm ${
          focused ? "text-primary-300" : "text-black-100"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const TabsSpecialIcon = ({
  onPress,
  accessibilityState,
  icon,
}: Omit<CustomTabBarButtonProps, "title">) => {
  const focused = accessibilityState?.selected;
  return (
    <View className="flex-1 relative items-center justify-center rounded-full">
      <View className="bg-accent-100 rounded-full shadow-zinc-100 shadow-xl absolute bottom-6">
        <View
          className={`rounded-full p-4 ${
            focused ? "bg-primary-300" : "bg-primary-100"
          }`}
        >
          <TouchableOpacity onPress={onPress}>
            <Image
              tintColor={focused ? "#FBFBFD" : "#0061ff"}
              source={icon}
              className="size-9"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarButton: (props) => (
            <TabsCustomeIcon
              {...props}
              icon={icons.home_outline}
              title="Home"
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "whishlist",
          tabBarButton: (props) => (
            <TabsCustomeIcon {...props} icon={icons.heart} title="Favourite" />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarButton: (props) => (
            <TabsSpecialIcon {...props} icon={icons.map} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "chat",
          tabBarButton: (props) => (
            <TabsCustomeIcon
              {...props}
              icon={icons.chat_outline}
              title="Chat"
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: (props) => (
            <TabsCustomeIcon
              {...props}
              icon={icons.profile_outline}
              title="Profile"
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FBFBFD",
    height: 60,
    position: "absolute",
    elevation: 6,
    paddingHorizontal: 15,
    borderTopEndRadius: 25,
    borderTopStartRadius: 25,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
});

export default TabsLayout;
