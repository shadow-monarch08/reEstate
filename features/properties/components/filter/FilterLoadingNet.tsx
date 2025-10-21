import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const FilterLoadingNet = () => {
  return (
    <View className="flex h-full justify-center items-center px-6">
      <ActivityIndicator size={40} color={"#0061FF"} />
    </View>
  );
};

export default FilterLoadingNet;
