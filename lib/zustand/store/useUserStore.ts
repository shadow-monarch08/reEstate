import { create } from "zustand";
import { getCurrentUser, User } from "@/lib/supabase";

interface UserState {
  user: User | null;
  userLoading: boolean;
  isLoggedIn: boolean;
}

interface UserFetchCalls {
  fetchUser: () => Promise<void>;
}

const initialState: UserState = {
  user: null,
  userLoading: false,
  isLoggedIn: false,
};

export const useUserStore = create<UserState & UserFetchCalls>((set) => ({
  ...initialState,
  fetchUser: async () => {
    set({
      userLoading: true,
    });
    try {
      const user = await getCurrentUser();
      set({
        user: user,
        isLoggedIn: !!user,
      });
    } catch (error) {
      console.error("error fetching user: ", error);
    } finally {
      set({
        userLoading: false,
      });
    }
  },
}));
