import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Image,
  FlatList,
  LayoutChangeEvent,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import MapView, { MapType, Marker, Region } from "react-native-maps"; // remove PROVIDER_GOOGLE import if not using Google Maps
import { SafeAreaView } from "react-native-safe-area-context";
import Geolocation from "@react-native-community/geolocation";
import { useIsFocused } from "@react-navigation/native";
import { SearchButton } from "@/components/Button";
import { Filter_area } from "@/components/Filters";
import { router, useLocalSearchParams } from "expo-router";
import { getMapRegionWithRadius } from "@/utils";
import icons from "@/constants/icons";
import { useSupabase } from "@/lib/useSupabase";
import {
  getPorpertyWithinRadius,
  PropertyWithinRadiusReturnType,
} from "@/lib/supabase";
import { EmptyRowCard, LoadingRowCard, RowCard } from "@/components/Card";
import { useGlobalContext } from "@/lib/global-provider";

const CustomPropertyMarker = React.memo(
  ({
    propertyDetail,
    onPress,
  }: {
    propertyDetail: PropertyWithinRadiusReturnType;
    onPress: (param: string) => void;
  }) => {
    return (
      <Marker
        title={propertyDetail.name}
        description={propertyDetail.address}
        icon={icons.apartment}
        coordinate={{
          latitude: Number(propertyDetail.geolocation.split(",")[0]),
          longitude: Number(propertyDetail.geolocation.split(",")[1]),
        }}
        onPress={() => onPress(propertyDetail.id)}
      />
    );
  }
);

const MapPageHeader = React.memo(
  ({
    touchableOpacityProps = {},
  }: {
    touchableOpacityProps?: Record<string, any>;
  }) => {
    return (
      <View className="w-full bg-accent-100 py-5">
        <View className="px-5 flex flex-row gap-3 items-center">
          <SearchButton query="map" />
          <TouchableOpacity
            {...touchableOpacityProps}
            className="overflow-hidden rounded-2xl"
          >
            <View className="bg-primary-100 p-4">
              <Image
                source={icons.target}
                className="size-7"
                tintColor="#8C8E98"
              />
            </View>
          </TouchableOpacity>
        </View>
        <Filter_area />
      </View>
    );
  }
);

const LoadingMapPageHeader = React.memo(() => {
  return (
    <View className="w-full bg-accent-100 py-5">
      <View className="px-5 flex flex-row gap-3 items-center">
        <View className="flex-1 rounded-2xl h-14 overflow-hidden bg-primary-200" />
        <View className="overflow-hidden rounded-2xl bg-primary-200 size-14" />
      </View>
      <View className="px-5 mt-5 flex flex-row gap-5">
        {[...Array(3)].map((_, i) => (
          <View key={i} className="bg-primary-200 h-10 w-[6rem] rounded-full" />
        ))}
      </View>
    </View>
  );
});

const CustomUserMarker = React.memo(
  ({ userRegion }: { userRegion: Region }) => {
    return (
      <Marker coordinate={userRegion}>
        <View className="size-7 rounded-full bg-[rgba(30,136,229,0.3)] items-center justify-center">
          <View className="size-3 rounded-full bg-blue-400 border-2 border-white" />
        </View>
      </Marker>
    );
  }
);

const Map = () => {
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const isFocused = useIsFocused();
  const [hasMapLoaded, setHasMapLoaded] = useState<boolean>(false);
  const mapRef = useRef<MapView | null>(null);
  const params = useLocalSearchParams<{ area: string }>();
  const paramRef = useRef(Number(params.area) || 0.5); // default to 500 meters if no area is specified
  const flatListRef = useRef<FlatList>(null);

  const {
    data: property,
    refetch: fetchProperty,
    loading,
  } = useSupabase({
    fn: getPorpertyWithinRadius,
    params: {
      latitude: userRegion?.latitude || 0,
      longitude: userRegion?.longitude || 0,
      radius: Number(params.area) || 0.5, // default to 500 meters if no area is specified
    },
    skip: true, // skip initial fetch
  });

  useEffect(() => {
    if (userRegion) {
      const { latitudeDelta, longitudeDelta } = getMapRegionWithRadius(
        userRegion?.latitude,
        Number(params.area)
      );
      if (paramRef.current < Number(params.area)) {
        fetchProperty({
          latitude: userRegion.latitude,
          longitude: userRegion.longitude,
          radius: Number(params.area) || 0.5, // default to 500 meters if no area is specified
        });
        paramRef.current = Number(params.area);
      }
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
  const [width, setWidth] = useState<number>(0);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }, []);

  const changeCameraToUserLocation = useCallback(() => {
    if (mapRef && userRegion) {
      mapRef.current?.animateToRegion(userRegion, 2000);
    }
  }, []);

  const handelCardPress = (id: string) => router.push(`/properties/${id}`);

  const getLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.warn("Location permission denied");
      return 0;
    }

    Geolocation.getCurrentPosition((info) => {
      setUserRegion({
        latitude: info.coords.latitude,
        longitude: info.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });

      fetchProperty({
        latitude: info.coords.latitude,
        longitude: info.coords.longitude,
        radius: Number(params.area) || 0.5, // default to 500 meters if no area is specified
      });
    });
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidth(Math.floor(width));
  };

  const handleMarkerPress = (propertyId: string) => {
    if (property) {
      const index = property.data?.findIndex((p) => p.id === propertyId);
      if (index !== -1 && flatListRef.current && index) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 flex w-full" onLayout={handleLayout}>
      {hasMapLoaded ? (
        <MapPageHeader
          touchableOpacityProps={{
            onPress: changeCameraToUserLocation,
          }}
        />
      ) : (
        <LoadingMapPageHeader />
      )}
      <View className="flex-1 relative">
        {isFocused && userRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={userRegion}
            toolbarEnabled={true}
            onMapLoaded={() => setHasMapLoaded(true)}
          >
            <CustomUserMarker userRegion={userRegion} />
            {property?.data?.map((propertyDetail) => (
              <CustomPropertyMarker
                onPress={handleMarkerPress}
                key={propertyDetail.id}
                propertyDetail={propertyDetail}
              />
            ))}
          </MapView>
        )}
        <FlatList
          ref={flatListRef}
          data={loading ? [] : property?.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width: width }}>
              <RowCard item={item} onPress={() => handelCardPress(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <View className="flex flex-row gap-5">
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={{ width: width }} className="px-5">
                    <LoadingRowCard />
                  </View>
                ))}
              </View>
            ) : (
              <View className="px-5" style={{ width: width }}>
                <EmptyRowCard />
              </View>
            )
          }
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToAlignment="center"
          snapToInterval={width}
          className="absolute bottom-24 left-0 right-0 py-4"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    zIndex: 0,
  },
});

export default Map;
