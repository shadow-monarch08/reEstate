import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { categories } from "@/constants/data";
import icons from "@/constants/icons";

export const Filters = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    params.filter || "All"
  );
  const handleFilterPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("All");
      router.setParams({ filter: "All" });
      return;
    }
    setSelectedCategory(category);
    router.setParams({ filter: category });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pt-5"
    >
      <View className="flex flex-row gap-2 px-5">
        {categories.map((item, index) => (
          <TouchableOpacity
            className={`py-3 px-5 h-32 w-36 rounded-3xl border-primary-200 border flex flex-col justify-between ${
              selectedCategory === item.category
                ? "bg-primary-300"
                : "bg-primary-100"
            }`}
            key={index}
            onPress={() => handleFilterPress(item.category)}
          >
            <View className="flex flex-row">
              <View
                className={`p-3 rounded-full ${
                  selectedCategory === item.category
                    ? "bg-blue-700"
                    : "bg-primary-200"
                }`}
              >
                <Image
                  source={item.icon}
                  className="size-6"
                  tintColor={
                    selectedCategory === item.category ? "white" : "#666876"
                  }
                />
              </View>
            </View>
            <Text
              className={`text-sm mt-0.5 font-rubik ${
                selectedCategory === item.category
                  ? "text-white"
                  : "text-black-300"
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export const Filters_small = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    params.filter || "All"
  );
  const handleFilterPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("All");
      router.setParams({ filter: "All" });
      return;
    }
    setSelectedCategory(category);
    router.setParams({ filter: category });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pt-5"
    >
      <View className="flex flex-row gap-2 px-5">
        {categories.map((item, index) => (
          <TouchableOpacity
            className={`py-2 px-3 rounded-full border-primary-200 border flex flex-row gap-2 items-center ${
              selectedCategory === item.category
                ? "bg-primary-300"
                : "bg-primary-100"
            }`}
            key={index}
            onPress={() => handleFilterPress(item.category)}
          >
            <Image
              source={item.icon}
              className="size-6"
              tintColor={
                selectedCategory === item.category ? "white" : "#666876"
              }
            />
            <Text
              className={`text-sm mt-0.5 font-rubik ${
                selectedCategory === item.category
                  ? "text-white"
                  : "text-black-300"
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
