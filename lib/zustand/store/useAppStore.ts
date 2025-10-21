import icons from "@/constants/icons";
import { FilterDetailReturnType, getFilterDetail } from "@/lib/supabase";
import { ImageSourcePropType } from "react-native";
import { create } from "zustand";

export type AssetMetaData = {
  file_name: string;
  file_size: number;
  mime_type: string;
  uri: string;
  img_height?: number;
  img_width?: number;
};

interface AppState {
  internetStatus: "online" | "offline";
  filterDetail: FilterDetailReturnType | null;
  filterDetailLoading: boolean;
  isMedialModalVisible: boolean;
  isOverviewModalVisible: boolean;
  selectedMessageCount: number;
  selectedMessageSet: Set<string>;
  propertyFilter: {
    proprtyType: {
      data: Array<{
        title: string;
        icon: ImageSourcePropType;
        isSelected: boolean;
        category: string;
      }>;
      isActive: boolean;
    };
    priceRange: {
      data: [number, number];
      isActive: boolean;
    };
    areaRange: {
      data: [number, number];
      isActive: boolean;
    };
    facilities: {
      data: Array<{
        title: string;
        icon: ImageSourcePropType;
        isSelected: boolean;
        category: string;
      }>;
      isActive: boolean;
    };
    homeDetails: {
      data: {
        bathrooms: number;
        bedrooms: number;
      };
      isActive: boolean;
    };
  };
  assetProvider: {
    assets: AssetMetaData[];
    assetType: "doc" | "image";
  } | null;
}

interface AppStateHandlers {
  setInternetStatus: (status: "online" | "offline") => void;
  getFilterDetail: () => Promise<void>;
  setIsMediaModalVisible: (p: boolean) => void;
  setIsOverviewModalVisible: (p: boolean) => void;
  setAssetProvider: (p: {
    assets: AssetMetaData[];
    assetType: "doc" | "image";
  }) => void;
  resetSelectedMessages: () => void;
  addToActiveMessage: (localId: string) => void;
  deleteFromActiveMessage: (localId: string) => void;
  toggleFilterState: (filterName: keyof AppState["propertyFilter"]) => void;
  updatePropertyFilter: (
    filterName: keyof AppState["propertyFilter"],
    data: AppState["propertyFilter"][keyof AppState["propertyFilter"]]["data"]
  ) => void;
}

const initialState: AppState = {
  internetStatus: "offline",
  filterDetail: null,
  filterDetailLoading: false,
  isMedialModalVisible: false,
  isOverviewModalVisible: false,
  assetProvider: null,
  selectedMessageCount: 0,
  selectedMessageSet: new Set(),
  propertyFilter: {
    proprtyType: {
      data: [
        {
          title: "Houses",
          category: "House",
          isSelected: true,
          icon: icons.house,
        },
        {
          title: "Condos",
          category: "Condo",
          isSelected: false,
          icon: icons.condo,
        },
        {
          title: "Duplexes",
          category: "Duplex",
          isSelected: false,
          icon: icons.duplex,
        },
        {
          title: "Studios",
          category: "Studio",
          isSelected: false,
          icon: icons.studio,
        },
        {
          title: "Villas",
          category: "Villa",
          isSelected: false,
          icon: icons.villa,
        },
        {
          title: "Apartments",
          category: "Apartment",
          isSelected: false,
          icon: icons.apartment,
        },
        {
          title: "Townhouses",
          category: "Townhouse",
          isSelected: false,
          icon: icons.townhouse,
        },
        {
          title: "Others",
          category: "Other",
          isSelected: false,
          icon: icons.more,
        },
      ],
      isActive: true,
    },
    priceRange: {
      data: [3100, 6100],
      isActive: true,
    },
    areaRange: {
      data: [900, 2000],
      isActive: true,
    },
    facilities: {
      data: [
        {
          title: "Laundry",
          category: "Laundry",
          isSelected: true,
          icon: icons.laundry,
        },
        {
          title: "Parking",
          category: "Parking",
          isSelected: false,
          icon: icons.car_park,
        },
        {
          title: "Gym",
          category: "Gym",
          isSelected: false,
          icon: icons.dumbell,
        },
        {
          title: "Pet friendly",
          category: "Pet friendly",
          isSelected: false,
          icon: icons.dog,
        },
        {
          title: "Wi-fi",
          category: "Wi-fi",
          isSelected: false,
          icon: icons.wifi,
        },
        {
          title: "Swimming pool",
          category: "Swimming pool",
          isSelected: false,
          icon: icons.swim,
        },
      ],
      isActive: false,
    },
    homeDetails: {
      data: {
        bathrooms: 2,
        bedrooms: 3,
      },
      isActive: false,
    },
  },
};

export const useAppStore = create<AppState & AppStateHandlers>((set, get) => ({
  ...initialState,
  setInternetStatus: (status: "online" | "offline") =>
    set({
      internetStatus: status,
    }),
  getFilterDetail: async () => {
    set({
      filterDetailLoading: true,
    });
    try {
      const filterDetail = await getFilterDetail();
      set({
        filterDetail: filterDetail.data,
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({
        filterDetailLoading: false,
      });
    }
  },
  resetSelectedMessages: () =>
    set({
      selectedMessageCount: 0,
      selectedMessageSet: new Set(),
    }),
  addToActiveMessage: (localId: string) =>
    set((items) => {
      const newSet = new Set(items.selectedMessageSet);
      newSet.add(localId);
      return {
        ...items,
        selectedMessageCount: items.selectedMessageCount + 1,
        selectedMessageSet: newSet,
      };
    }),
  deleteFromActiveMessage: (localId: string) => {
    set((items) => {
      const newSet = new Set(items.selectedMessageSet);
      newSet.delete(localId);
      return {
        ...items,
        selectedMessageCount: items.selectedMessageCount - 1,
        selectedMessageSet: newSet,
      };
    });
  },
  setIsMediaModalVisible: (p: boolean) =>
    set({
      isMedialModalVisible: p,
    }),
  setIsOverviewModalVisible: (p: boolean) =>
    set({
      isOverviewModalVisible: p,
    }),
  setAssetProvider: (p: {
    assets: AssetMetaData[];
    assetType: "doc" | "image";
  }) =>
    set({
      assetProvider: p,
    }),
  toggleFilterState: (filterName) =>
    set((state) => ({
      ...state,
      propertyFilter: {
        ...state.propertyFilter,
        [filterName]: {
          ...state.propertyFilter[filterName],
          isActive: !state.propertyFilter[filterName].isActive,
        },
      },
    })),
  updatePropertyFilter: (filterName, data) =>
    set((state) => ({
      ...state,
      propertyFilter: {
        ...state.propertyFilter,
        [filterName]: {
          ...state.propertyFilter[filterName],
          data: data,
        },
      },
    })),
}));
