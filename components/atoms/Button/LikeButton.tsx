import icons from "@/constants/icons";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";
import React, { useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const LikeButton = ({
  isWishListed,
  id,
}: {
  isWishListed: boolean;
  id: string;
}) => {
  const { updateWishlistProperty } = useWishlistStore();
  const { user } = useUserStore();
  const [disabled, setDisabled] = useState(false);
  const animatedHeartFilled = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isWishListed ? 1 : 0, { duration: 200 }) }],
  }));
  const animatedHeartOutline = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(!isWishListed ? 1 : 0, { duration: 200 }) },
    ],
  }));
  const handlePress = async () => {
    setDisabled(true);
    if (user) {
      await updateWishlistProperty({
        propertyId: id,
        userId: user.id,
        operation: wishlisted ? "delete" : "insert",
      });
    }
    setWishlisted(!wishlisted);
    setDisabled(false);
  };
  const [wishlisted, setWishlisted] = useState(isWishListed);
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={handlePress}
      className="relative size-6"
    >
      <Animated.View
        style={animatedHeartOutline}
        className="size-full absolute left-0 top-0 "
      >
        <Image tintColor="#8C8E98" className="size-full" source={icons.heart} />
      </Animated.View>
      <Animated.View
        style={animatedHeartFilled}
        className="size-full absolute left-0 top-0 "
      >
        <Image
          tintColor="#F75555"
          className="size-full"
          source={icons.heart_filled}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default React.memo(LikeButton);
