import React, { createContext, ReactNode, useContext, useRef } from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface GlobalContextType {
  bottomSheetModalRef: React.RefObject<(BottomSheetModal | null)[]>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const bottomSheetModalRef = useRef<Array<BottomSheetModal | null>>([]);

  return (
    <GlobalContext.Provider
      value={{
        bottomSheetModalRef,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
};

export default GlobalProvider;
