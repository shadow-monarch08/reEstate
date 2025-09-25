// MediaManager.ts
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto"; // Import the crypto library

// Define the paths for our media directories inside the app's private storage
const BASE_DIR = FileSystem.documentDirectory + "media/";
const IMAGES_DIR = BASE_DIR + "images/";
const SENT_DIR = IMAGES_DIR + "sent/";

/**
 * Ensures that the necessary media directories exist.
 * Should be called once when the app starts.
 */
const initialize = async () => {
  try {
    // 1. Create the main 'images' directory
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });

    // 2. Create the 'sent' subdirectory
    await FileSystem.makeDirectoryAsync(SENT_DIR, { intermediates: true });

    // 3. Create the .nomedia file to hide the 'sent' folder from the gallery
    const nomediaPath = SENT_DIR + ".nomedia";
    // Check if the file exists to avoid rewriting it unnecessarily
    const nomediaExists = await FileSystem.getInfoAsync(nomediaPath);
    if (!nomediaExists.exists) {
      await FileSystem.writeAsStringAsync(nomediaPath, "");
    }
    console.log("Media directories initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize media directories:", error);
  }
};

/**
 * Saves a copy of a sent image to the hidden 'sent' folder,
 * using a content hash to prevent duplicates.
 * @param temporaryUri The temporary URI from the image picker.
 * @returns The new permanent URI of the saved file.
 */
const saveSentImage = async (temporaryUri: string): Promise<string> => {
  try {
    // 1. Calculate the hash of the file to use as a unique ID
    const fileString = await FileSystem.readAsStringAsync(temporaryUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileString
    );

    // 2. Create a new, permanent filename using the hash
    const originalFileName = temporaryUri.split("/").pop() || "tmp";
    const fileExtension = originalFileName.split(".").pop() || "jpg";
    const permanentFileName = `${hash}.${fileExtension}`;
    const permanentUri = SENT_DIR + permanentFileName;

    // 3. Check if a file with this hash already exists
    const fileInfo = await FileSystem.getInfoAsync(permanentUri);

    // 4. Only copy the file if it doesn't already exist
    if (!fileInfo.exists) {
      console.log("New file detected. Copying to permanent storage...");
      await FileSystem.copyAsync({
        from: temporaryUri,
        to: permanentUri,
      });
    } else {
      console.log("Duplicate file detected. Using existing copy.");
    }

    // 5. Return the permanent URI (either the new or existing one)
    return permanentUri;
  } catch (error) {
    console.error("Error saving sent image:", error);
    // Fallback to returning the original temporary URI on error
    return temporaryUri;
  }
};

/**
 * Downloads a received image and saves it to the public 'images' folder.
 * @param remoteUrl The URL of the image to download.
 * @param fileName A unique name for the file.
 * @returns The new local URI of the downloaded file.
 */
const saveReceivedImage = async (
  remoteUrl: string,
  fileName: string
): Promise<string> => {
  const localUri = IMAGES_DIR + fileName;

  const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri);
  return uri;
};

/**
 * Deletes all media directories and their contents.
 * This is a destructive operation and cannot be undone.
 */
const deleteAllMedia = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BASE_DIR);

    if (dirInfo.exists) {
      console.log(`Deleting base media directory at ${BASE_DIR}...`);
      await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
      console.log("All media directories have been deleted successfully.");
    } else {
      console.log("Media directory does not exist, nothing to delete.");
    }
  } catch (error) {
    console.error("Failed to delete media directories:", error);
  }
};

// Export all functions as a single object
export const MediaManager = {
  initialize,
  saveSentImage,
  saveReceivedImage,
  deleteAllMedia,
};
