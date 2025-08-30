import { FilterDetailReturnType, getFilterDetail } from "@/lib/supabase";
import { create } from "zustand";

interface AppState {
  internetStatus: "online" | "offline";
  filterDetail: FilterDetailReturnType | null;
  filterDetailLoading: boolean;
}

interface AppStateHandlers {
  setInternetStatus: (status: "online" | "offline") => void;
  getFilterDetail: () => Promise<void>;
}

const initialState: AppState = {
  internetStatus: "offline",
  filterDetail: null,
  filterDetailLoading: false,
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
}));
