import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MapView, {
  MapType,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps"; // remove PROVIDER_GOOGLE import if not using Google Maps
import { SafeAreaView } from "react-native-safe-area-context";
import Geolocation from "@react-native-community/geolocation";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { SearchButton } from "@/components/Button";
import { Filter_area } from "@/components/Filters";
import { useLocalSearchParams } from "expo-router";
import { getMapRegionWithRadius } from "@/utils";

const CustomUserMarker = React.memo(
  ({ userRegion }: { userRegion: Region }) => {
    return (
      <Marker coordinate={userRegion}>
        <View className="size-7 rounded-full bg-[rgba(30,136,229,0.3)] items-center justify-center">
          <View className="w-3 h-3 rounded-full bg-blue-400 border-1 border-white" />
        </View>
      </Marker>
    );
  }
);

const Map = () => {
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const isFocused = useIsFocused();
  const [mapType, setMapType] = useState<MapType>("standard");
  const mapRef = useRef<MapView | null>(null);
  const params = useLocalSearchParams<{ area: string }>();

  useEffect(() => {
    if (userRegion) {
      const { latitudeDelta, longitudeDelta } = getMapRegionWithRadius(
        userRegion?.latitude,
        Number(params.area)
      );
      if (mapRef) {
        mapRef.current?.animateToRegion(
          {
            ...userRegion,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
          },
          1000
        );
      }
    }
  }, [params.area]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }, []);

  const getLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.warn("Location permission denied");
      return 0;
    }

    Geolocation.getCurrentPosition((info) =>
      setUserRegion({
        latitude: info.coords.latitude,
        longitude: info.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      {isFocused && userRegion && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userRegion}
          toolbarEnabled={true}
          mapType={mapType}
        >
          <CustomUserMarker userRegion={userRegion} />
        </MapView>
      )}
      <View className="w-full absolute top-5 left-0">
        <View className="px-5">
          <SearchButton query="map" />
          <TouchableOpacity>
            <Image />
          </TouchableOpacity>
        </View>
        <Filter_area />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default Map;
