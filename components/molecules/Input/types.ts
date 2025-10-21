import { ImageSourcePropType } from "react-native";

export type CustomInputProps = {
  icon?: ImageSourcePropType;
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  iconPosition?: "left" | "right";
  errorMessage?: string | null;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
  disable?: boolean;
  containerClassName?: string;
  inputClassName?: string;
};
