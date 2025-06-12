import React from 'react';
import { Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MyMap = ({geolocation, image}: {geolocation: string, image: string}) => {
  const region = {
    latitude: Number(geolocation.split(',')[0]),
    longitude: Number(geolocation.split(',')[1]),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={region}
    >
      <Marker
        coordinate={{ latitude: Number(geolocation.split(',')[0]), longitude: Number(geolocation.split(',')[1]) }}
      >
        {/* Custom Pointer */}
        <Image
          source={{ uri: image }}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
      </Marker>
    </MapView>
  );
};

export default MyMap;
