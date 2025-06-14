import * as Keychain from "react-native-keychain";
import { randomBytes } from "crypto";

const REALM_KEY_SERVICE = "chat-app-realm-key";

export const getRealmEncryptionKey = async (): Promise<Uint8Array> => {
  const keyData = await Keychain.getGenericPassword({
    service: REALM_KEY_SERVICE,
  });

  if (keyData) {
    // Key already exists — decode from base64
    return Uint8Array.from(atob(keyData.password), (c) => c.charCodeAt(0));
  }

  // Generate a new 64-byte key
  const key = randomBytes(64);

  // Save it securely (as base64 string)
  await Keychain.setGenericPassword(
    "realm",
    btoa(String.fromCharCode(...key)),
    {
      service: REALM_KEY_SERVICE,
    }
  );

  return key;
};
