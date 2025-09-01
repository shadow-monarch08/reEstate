// storage/mmkvStorage.ts
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV({ id: "supabase-auth" });

export const mmkvStorage = {
  getItem: (key: string) => {
    try {
      const value = mmkv.getString(key);
      return Promise.resolve(value ?? null);
    } catch (e) {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string) => {
    try {
      mmkv.set(key, value);
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
  removeItem: (key: string) => {
    try {
      mmkv.delete(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  },
};
