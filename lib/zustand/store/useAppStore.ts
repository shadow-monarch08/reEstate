import { create } from "zustand";

interface AppState {
  internetStatus: "online" | "offline";
}

interface AppStateHandlers {
  setInternetStatus: (status: "online" | "offline") => void;
}

const initialState: AppState = {
  internetStatus: "offline",
};

export const useAppStore = create<AppState & AppStateHandlers>((set) => ({
  ...initialState,
  setInternetStatus: (status: "online" | "offline") =>
    set({
      internetStatus: status,
    }),
}));
