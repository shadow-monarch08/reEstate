import { FilterDetailReturnType, getFilterDetail } from "@/lib/supabase";
import { DocumentPickerAsset } from "expo-document-picker";
import { ImagePickerAsset } from "expo-image-picker";
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
}));
