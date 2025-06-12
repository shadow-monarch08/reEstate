import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React from "react";
import icons from "@/constants/icons";
import { Tabs } from "expo-router";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

type CustomTabBarButtonProps = BottomTabBarButtonProps & {
  icon: ImageSourcePropType;
};

const TabsCustomeIcon = ({
  onPress,
  accessibilityState,
  icon,
}: CustomTabBarButtonProps) => {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center"
      onPress={onPress}
    >
      <View
        className={`flex items-center justify-center size-14 rounded-full p-3 ${
          focused ? "bg-primary-200" : "bg-accent-100"
        }`}
      >
        <Image
          tintColor={focused ? "#0061FF" : "#8C8E98"}
          source={icon}
          className="size-full"
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

const TabsSpecialIcon = ({
  onPress,
  accessibilityState,
  icon,
}: CustomTabBarButtonProps) => {
  const focused = accessibilityState?.selected;
  return (
    <View className="flex-1 relative items-center justify-center ">
      <View className="bg-accent-100 rounded-full shadow-zinc-100 shadow-xl p-4 absolute bottom-4">
        <TouchableOpacity onPress={onPress}>
          <Image
            tintColor={focused ? "#0061FF" : "#8C8E98"}
            source={icon}
            className="size-8"
            resizeMode="contain"
          />
        </TouchableOpacity>
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
            <TabsCustomeIcon {...props} icon={icons.home_outline} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "whishlist",
          tabBarButton: (props) => (
            <TabsCustomeIcon {...props} icon={icons.heart} />
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
            <TabsCustomeIcon {...props} icon={icons.chat_outline} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: (props) => (
            <TabsCustomeIcon {...props} icon={icons.profile_outline} />
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
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderTopColor: "#0061FF1A",
    borderColor: "#0061FF1A",
    height: 60,
    position: "absolute",
    bottom: 15,
    marginLeft: 40,
    marginRight: 40,
    elevation: 6,
    borderRadius: 40,
    shadowColor: "#8C8E98",
  },
});

export default TabsLayout;
