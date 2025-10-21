import { ImageSourcePropType } from "react-native";

export type ButtonProps = {
  text: string;
  handlePress?: () => void;
  image?: ImageSourcePropType;
  buttonStyle?: string;
};

export type CounterButttonProps = {
  value: number;
  handelValue: (param: number) => void;
};
