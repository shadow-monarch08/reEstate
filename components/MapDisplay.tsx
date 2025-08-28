import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { useIsFocused } from "@react-navigation/native";
import icons from "@/constants/icons";
import Modal from "react-native-modal";

const CustomMarker = () => {
  return (
    <View className="items-center">
      {/* Circle */}
      <View className="w-8 h-8 bg-primary-300 rounded-full relative">
        <View className="size-2 rounded-full bg-accent-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </View>
      {/* Pointed Tail */}
      <View
        className="w-0 h-0"
        style={{
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 6,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#2563eb", // blue-600
          marginTop: -2.3,
        }}
      />
    </View>
  );
};

export const MapDisplay = ({
  location,
  onPress,
}: {
  location?: string;
  onPress: () => void;
}) => {
  if (!location) return null;
  const isFocused = useIsFocused();
  const [latStr, lngStr] = location.split(",").map((val) => val.trim());
  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid location string:", location);
    return null;
  }

  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  return (
    <View className="w-full h-52 rounded-2xl overflow-hidden mt-7 relative">
      {isFocused && (
        <MapView
          style={styles.map}
          initialRegion={region}
          zoomEnabled={false}
          zoomTapEnabled={false}
          scrollEnabled={false}
          toolbarEnabled={false}
          pointerEvents="none" // makes map static, remove if you want interaction
        >
          <Marker coordinate={{ latitude, longitude }}>
            <CustomMarker />
          </Marker>
        </MapView>
      )}
      <TouchableOpacity
        onPress={onPress}
        className="rounded-lg bg-accent-100 p-1 absolute z-50 bottom-5 left-5"
      >
        <Image source={icons.expand} tintColor="#0061FF" className="size-7" />
      </TouchableOpacity>
    </View>
  );
};

export const MapModal = ({
  location,
  isModalVisible,
  onPress,
}: {
  location?: string;
  isModalVisible: boolean;
  onPress: () => void;
}) => {
  if (!location) return null;
  const [latStr, lngStr] = location.split(",").map((val) => val.trim());
  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid location string:", location);
    return null;
  }

  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  return (
    <Modal
      isVisible={isModalVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      useNativeDriver
      onBackdropPress={onPress}
      onBackButtonPress={onPress}
      // className="bg-primary-300"
    >
      {/* Center modal content */}
      <View className="flex-1 justify-center items-center py-10">
        {/* Modal card */}
        <View className="h-full w-full rounded-2xl overflow-hidden relative">
          <MapView
            style={styles.map}
            initialRegion={region}
            toolbarEnabled={true}
          >
            <Marker coordinate={{ latitude, longitude }}>
              <CustomMarker />
            </Marker>
          </MapView>
          <TouchableOpacity
            onPress={onPress}
            className="rounded-lg bg-accent-100 p-1 absolute z-50 bottom-5 left-5"
          >
            <Image
              source={icons.shrink}
              tintColor="#0061FF"
              className="size-9"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
