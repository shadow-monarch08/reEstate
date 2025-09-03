import { FilterDetailReturnType, getFilterDetail } from "@/lib/supabase";
import { DocumentPickerAsset } from "expo-document-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { create } from "zustand";

interface AppState {
  internetStatus: "online" | "offline";
  filterDetail: FilterDetailReturnType | null;
  filterDetailLoading: boolean;
  isMedialModalVisible: boolean;
  isOverviewModalVisible: boolean;
  assetProvider: {
    asset: DocumentPickerAsset[] | ImagePickerAsset[];
    assetType: "Doc" | "Img";
  } | null;
}

interface AppStateHandlers {
  setInternetStatus: (status: "online" | "offline") => void;
  getFilterDetail: () => Promise<void>;
  setIsMediaModalVisible: (p: boolean) => void;
  setIsOverviewModalVisible: (p: boolean) => void;
  setAssetProvider: (p: {
    asset: DocumentPickerAsset[] | ImagePickerAsset[];
    assetType: "Doc" | "Img";
  }) => void;
}

const initialState: AppState = {
  internetStatus: "offline",
  filterDetail: null,
  filterDetailLoading: false,
  isMedialModalVisible: false,
  isOverviewModalVisible: false,
  assetProvider: null,
};

export const useAppStore = create<AppState & AppStateHandlers>((set) => ({
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
  setIsMediaModalVisible: (p: boolean) =>
    set({
      isMedialModalVisible: p,
    }),
  setIsOverviewModalVisible: (p: boolean) =>
    set({
      isOverviewModalVisible: p,
    }),
  setAssetProvider: (p: {
    asset: DocumentPickerAsset[] | ImagePickerAsset[];
    assetType: "Doc" | "Img";
  }) =>
    set({
      assetProvider: p,
    }),
}));
