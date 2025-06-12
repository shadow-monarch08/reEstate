import { View, TextInput, Image, TouchableOpacity } from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import icons from "@/constants/icons";
import { useDebouncedCallback } from "use-debounce";
import { useGlobalContext } from "@/lib/global-provider";
import { useFocusEffect } from "@react-navigation/native";

const Search = ({
  enableFocus = true,
  enableFilter = true,
  placeholder = "Search Something",
}: {
  enableFocus?: boolean;
  enableFilter?: boolean;
  placeholder?: string;
}) => {
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query);
  const { bottomSheetModalRef } = useGlobalContext();

  const debounceSearch = useDebouncedCallback(
    (text: string) => router.setParams({ query: text }),
    600
  );

  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (enableFocus) {
        const timeout = setTimeout(() => {
          inputRef.current?.focus();
        }, 300);

        return () => clearTimeout(timeout);
      }
    }, [enableFocus])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    debounceSearch(text);
  };
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current[0]?.present();
  }, []);
  return (
    <View className="w-full mt-6">
      <View className="flex flex-row bg-primary-100 px-3 py-4 rounded-2xl">
        <View className="flex flex-row flex-1 gap-5">
          <Image
            source={icons.search_outline}
            className="size-5"
            tintColor="#8C8E98"
            resizeMode="contain"
          />
          <TextInput
            ref={inputRef}
            value={search}
            onChangeText={handleSearch}
            placeholder={placeholder}
            className="font-rubik text-sm flex-1 text-black-300"
          />
        </View>
        {enableFilter && (
          <TouchableOpacity onPress={handlePresentModalPress}>
            <Image
              source={icons.filter}
              className="size-5"
              tintColor="#8C8E98"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Search;
