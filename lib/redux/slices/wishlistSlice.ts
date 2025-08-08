import { getWishlistedPropertyId, updateWishlist } from "@/lib/supabase";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface WishlistState {
  wishlistIds: Set<string>;
  wishlistLoading: boolean;
}

const initialState: WishlistState = {
  wishlistIds: new Set<string>(),
  wishlistLoading: false,
};

export const fetchWishlistPropertyIdsThunk = createAsyncThunk(
  "wishlist/fetchWishlistPropertyIds",
  async (userId: string) => {
    const result = await getWishlistedPropertyId({ userId });
    const wishlistIds = new Set<string>(
      result.data?.map((item) => item.property) || []
    );
    return wishlistIds;
  }
);

export const updateWishlistPropertyIdThunk = createAsyncThunk(
  "wishlist/addWishlistPropertyId", // action type
  async ({
    propertyId,
    operation,
  }: {
    propertyId: string;
    operation: string;
  }) => {
    // This thunk can be used to add or remove a property ID from the wishlist
    await updateWishlist({
      propertyId,
      operation, // 'add' or 'remove'
    });

    return { propertyId, operation }; // Return the property ID for further processing
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistPropertyIdsThunk.pending, (state) => {
        state.wishlistLoading = true;
      })
      .addCase(fetchWishlistPropertyIdsThunk.fulfilled, (state, action) => {
        state.wishlistLoading = false;
        state.wishlistIds = action.payload;
      })
      .addCase(fetchWishlistPropertyIdsThunk.rejected, (state) => {
        state.wishlistLoading = false;
      })
      .addCase(updateWishlistPropertyIdThunk.fulfilled, (state, action) => {
        const { propertyId, operation } = action.payload;
        if (operation === "add") {
          state.wishlistIds.add(propertyId);
        } else if (operation === "remove") {
          state.wishlistIds.delete(propertyId);
        }
      });
  },
});

export default wishlistSlice.reducer;
