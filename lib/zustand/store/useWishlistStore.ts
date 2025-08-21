import { getWishlistedPropertyId, updateWishlist } from "@/lib/supabase";
import { create } from "zustand";

interface WishlistState {
  wishlistIds: Set<string>;
  wishlistLoading: boolean;
  updatedPropertyId: string;
  operation: "insert" | "delete" | null;
}

interface WishlistFecthCalls {
  fetchWishlistPropertyIds: (userId: string) => Promise<void>;
  updateWishlistProperty: ({
    propertyId,
    userId,
    operation,
  }: {
    propertyId: string;
    userId: string;
    operation: "insert" | "delete";
  }) => Promise<void>;
}

const initialState: WishlistState = {
  wishlistIds: new Set<string>(),
  wishlistLoading: false,
  updatedPropertyId: "",
  operation: null,
};

export const useWishlistStore = create<WishlistState & WishlistFecthCalls>(
  (set) => ({
    ...initialState,
    fetchWishlistPropertyIds: async (userId: string) => {
      set({
        wishlistLoading: true,
      });
      try {
        const result = await getWishlistedPropertyId({ userId });
        const wishlistIds = new Set<string>(
          result.data?.map((item) => item.property) || []
        );
        set({
          wishlistIds,
        });
      } catch (error) {
        console.error("Error in fetching wishlist data: ", error);
      } finally {
        set({
          wishlistLoading: false,
        });
      }
    },

    updateWishlistProperty: async ({
      propertyId,
      userId,
      operation,
    }: {
      propertyId: string;
      userId: string;
      operation: "insert" | "delete";
    }) => {
      try {
        set((state) => {
          const newWishlistIds = new Set(state.wishlistIds);
          if (operation === "insert") {
            newWishlistIds.add(propertyId);
          } else {
            newWishlistIds.delete(propertyId);
          }
          return {
            ...state,
            wishlistIds: newWishlistIds,
            operation,
            updatedPropertyId: propertyId,
          };
        });
        await updateWishlist({
          propertyId,
          userId,
          operation, // 'add' or 'remove'
        });
      } catch (error) {
        console.error("Error updating wishlist:", error);
      }
    },
  })
);
