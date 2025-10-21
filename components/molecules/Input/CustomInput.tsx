import { View, Text, TextInput, Image } from "react-native";
import React from "react";
import type { CustomInputProps } from "./types";
import icons from "@/constants/icons";

const CustomInput: React.FC<CustomInputProps> = ({
  icon,
  placeholder = "Enter Something",
  value,
  label,
  containerClassName,
  inputClassName,
  onChangeText,
  iconPosition = "left",
  errorMessage,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  disable = false,
}) => {
  return (
    <View className="w-full flex-1 bg-accent-100">
      {label && (
        <Text className="font-rubik-medium text-lg text-black-300 mb-5">
          {label}
        </Text>
      )}
      <View
        className={
          containerClassName
            ? `max-h-fit bg-primary-100 rounded-2xl p-4 overflow-hidden border ${
                errorMessage ? "border-danger" : "border-primary-100"
              } ` + containerClassName
            : `max-h-fit bg-primary-100 rounded-2xl p-4 overflow-hidden border ${
                errorMessage ? "border-danger" : "border-primary-100"
              } flex-row items-center justify-center gap-3 flex-1`
        }
        style={
          iconPosition === "left"
            ? { flexDirection: "row" }
            : { flexDirection: "row-reverse" }
        }
      >
        {icon && (
          <Image source={icon} className="size-6" tintColor={"#191D31"} />
        )}
        <TextInput
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          editable={!disable}
          className={
            inputClassName
              ? "font-rubik text-sm text-black-300 mt-0.5 flex-1 " +
                inputClassName
              : "font-rubik text-sm text-black-300 mt-0.5 flex-1"
          }
        />
      </View>
      <View className="h-10 mt-1 flex flex-row gap-1 items-center flex-1">
        {errorMessage && (
          <>
            <Image source={icons.error} className="size-3" />
            <Text
              className="font-rubik text-xs text-danger mt-0.5"
              numberOfLines={2}
            >
              {errorMessage}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export default React.memo(CustomInput);
