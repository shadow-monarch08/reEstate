import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import wishlistReducer from "./slices/wishlistSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    wishlist: wishlistReducer,
    user: userReducer,
  },
});
// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
