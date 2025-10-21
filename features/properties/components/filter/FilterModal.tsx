import { useGlobalContext } from "@/lib/global-provider";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text } from "react-native";
import { Image, TouchableOpacity, View } from "react-native";
import FilterLoadingNet from "./FilterLoadingNet";
import PropertySelector from "./PropertySelector";
import PriceSelector from "./PriceSelector";
import HomeDetail from "./HomeDetail";
import FacilitySelector from "./FacilitySelector";
import AreaSelector from "./AreaSelector";
import { CustomButton } from "@/components/atoms/Button";
import icons from "@/constants/icons";

const FilterModal = () => {
  const { bottomSheetModalRef } = useGlobalContext();
  const [isVisible, setIsVisible] = useState(false);
  const snapPoints = useMemo(() => ["90%"], []);
  const modalRef = useRef<BottomSheetModal>(null);

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  const handleModalOpen = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleFilter = () => {
    // Add your filter logic here
  };

  const handleModalClose = useCallback(() => {
    setIsVisible(false);
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef?.current[0]?.dismiss();
    }
  }, []);

  useEffect(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current[0] = modalRef.current;
    }
  }, []);

  return (
    <BottomSheetModal
      onChange={(index) => {
        if (index >= 0) handleModalOpen();
        else handleModalClose();
      }}
      index={0}
      backdropComponent={backDrop}
      style={styles.shadowBox}
      snapPoints={snapPoints}
      ref={modalRef}
      enableDynamicSizing={false}
      handleIndicatorStyle={{ display: "none" }}
    >
      <BottomSheetView className="py-3 px-6">
        <View className="flex flex-row justify-between items-center w-full">
          <TouchableOpacity
            className="p-2 bg-primary-200 rounded-full"
            activeOpacity={0.6}
            onPress={handleModalClose}
          >
            <Image source={icons.back_arrow} className="size-6" />
          </TouchableOpacity>
          <Text className="font-rubik-medium text-lg text-black-300">
            Filter
          </Text>
          <TouchableOpacity>
            <Text className="font-rubik-medium text-base mt-1 text-primary-300">
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
      {!isVisible ? (
        <FilterLoadingNet />
      ) : (
        <BottomSheetScrollView
          className="py-2 flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <PropertySelector />
          <PriceSelector />
          <HomeDetail />
          <FacilitySelector />
          <AreaSelector />
          <CustomButton
            text="Set Filter"
            handlePress={handleFilter}
            buttonStyle="my-9"
          />
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  shadowBox: {
    backgroundColor: "white",
    borderRadius: 20,
    zIndex: 999,
  },
});

export default React.memo(FilterModal);
