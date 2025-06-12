import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSupabase } from "./useSupabase";
import {
  ChatOverviewReturnType,
  ChatReturnType,
  FilterDetailReturnType,
  getChatOverview,
  getConverationIds,
  getCurrentUser,
  getFilterDetail,
  getWishlistedPropertyId,
  Supabase,
  updateWishlist,
} from "./supabase";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RealtimeChannel } from "@supabase/supabase-js";

interface User {
  id: string | undefined;
  avatar_url: string | undefined;
  email: string | undefined;
  full_name: string | undefined;
}

interface wishlistManagerType {
  propertyIds: Array<string | null> | [] | null;
  operation: "insert" | "delete" | null;
  changeId: string;
}

interface GlobalContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  refetch: (newParams?: Record<string, string | number>) => Promise<void>;
  bottomSheetModalRef: React.RefObject<(BottomSheetModal | null)[]>;
  filterDetail: FilterDetailReturnType | null;
  wishlistManager: wishlistManagerType;
  setWishlistManager: React.Dispatch<React.SetStateAction<wishlistManagerType>>;
  chatOverviewManager: Array<ChatOverviewReturnType>;
  setChatOverviewManager: React.Dispatch<
    React.SetStateAction<Array<ChatOverviewReturnType>>
  >;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistManager, setWishlistManager] = useState<wishlistManagerType>({
    propertyIds: [],
    operation: null,
    changeId: "",
  });
  const [conversationIdArr, setConversationIdArr] = useState<Array<string>>([]);
  const [chatOverviewManager, setChatOverviewManager] = useState<
    Array<ChatOverviewReturnType>
  >([]);
  const [channels, setChannels] = useState({});

  const {
    data: user,
    loading,
    refetch,
  } = useSupabase({
    fn: getCurrentUser,
  });

  const {
    data: chatOverView,
    loading: loadingChatOverview,
    refetch: fetchChatOverview,
  } = useSupabase({
    fn: getChatOverview,
    params: {
      user_id: user?.id,
      range: [0, 5],
    },
    skip: true,
  });

  const { data: wishlists, refetch: refetchWishlist } = useSupabase({
    fn: getWishlistedPropertyId,
    params: {
      userId: user?.id,
    },
    skip: true,
  });

  const { refetch: UpdateWishlist } = useSupabase({
    fn: updateWishlist,
    params: {
      propertyId: wishlistManager.changeId,
      userId: user?.id,
      operation: wishlistManager?.operation,
    },
    skip: true,
  });

  const { data: converationIds, refetch: fetchConverstionIds } = useSupabase({
    fn: getConverationIds,
    params: {
      userId: user?.id,
    },
    skip: true,
  });

  const { data: filterDetail } = useSupabase({
    fn: getFilterDetail,
  });

  useEffect(() => {
    refetchWishlist({
      userId: user?.id,
    });
    fetchConverstionIds({
      userId: user?.id,
    });
    fetchChatOverview({
      user_id: user?.id,
      range: [0, 5],
    });
  }, [user]);

  useEffect(() => {
    if (wishlistManager.operation === "insert") {
      UpdateWishlist({
        propertyId: wishlistManager.changeId,
        userId: user?.id,
        operation: wishlistManager.operation,
      });
    } else if (wishlistManager.operation === "delete") {
      UpdateWishlist({
        propertyId: wishlistManager.changeId,
        userId: user?.id,
        operation: wishlistManager.operation,
      });
    }
  }, [wishlistManager.propertyIds]);

  useEffect(() => {
    if (wishlists) {
      setWishlistManager((prev) => ({
        ...prev,
        propertyIds: wishlists.map((obj) => obj.property),
      }));
    }
  }, [wishlists]);

  useEffect(() => {
    if (chatOverView) {
      setChatOverviewManager(chatOverView);
    }
  }, [chatOverView]);

  useEffect(() => {
    if (converationIds) {
      const channels: Record<string, RealtimeChannel> = {};
      setConversationIdArr(converationIds.map((obj) => obj.id));
      converationIds.forEach((obj) => {
        const channel = Supabase.channel(`conversation=${obj.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${obj.id}`,
            },
            (payload) =>
              payload.new.sender_id === user?.id
                ? null
                : setChatOverviewManager((prev) =>
                    prev.map((item) =>
                      item.conversation_id === obj.id
                        ? {
                            ...item,
                            unread_count: item.unread_count + 1,
                            last_message: payload.new.message,
                            last_message_time: payload.new.created_at,
                          }
                        : item
                    )
                  )
          )
          .subscribe();
        channels[obj.id] = channel;
      });
      setChannels(channels);
    }
  }, [converationIds]);

  const bottomSheetModalRef = useRef<Array<BottomSheetModal | null>>([]);

  const isLoggedIn = !!user;
  return (
    <GlobalContext.Provider
      value={{
        refetch,
        user,
        loading,
        isLoggedIn,
        bottomSheetModalRef,
        filterDetail,
        wishlistManager,
        setWishlistManager,
        chatOverviewManager,
        setChatOverviewManager,
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
