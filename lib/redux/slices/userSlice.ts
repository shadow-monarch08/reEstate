import { getCurrentUser } from "@/lib/supabase";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { User } from "@/lib/supabase";

interface UserState {
  user: User | null;
  userLoading: boolean;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  user: null,
  userLoading: false,
  isLoggedIn: false,
};

export const fetchUserThunk = createAsyncThunk(
  "user/fetchUserThunk",
  async () => {
    const user = await getCurrentUser();
    return user;
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserThunk.pending, (state) => {
        state.userLoading = true;
      })
      .addCase(fetchUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.userLoading = false;
        state.isLoggedIn = !!action.payload;
      })
      .addCase(fetchUserThunk.rejected, (state) => {
        state.userLoading = false;
      });
  },
});

export default userSlice.reducer;
