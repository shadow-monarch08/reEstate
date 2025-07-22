import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

const PROFILE_IMG_DIR = FileSystem.documentDirectory + "profile_images/";

export const cacheProfileImage = async (imageUri: string, agentId: string) => {
  try {
    // Compress the image
    const downloadRes = await FileSystem.downloadAsync(
      imageUri,
      FileSystem.cacheDirectory + `temp-${agentId}.jpg`
    );

    const context = ImageManipulator.manipulate(downloadRes.uri);

    context.resize({
      width: 192,
      height: 192,
    });
    const compressedImage = await context.renderAsync();
    const result = await compressedImage.saveAsync({
      format: SaveFormat.JPEG,
    });

    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(PROFILE_IMG_DIR, {
      intermediates: true,
    });

    const localPath = PROFILE_IMG_DIR + `${agentId}.jpg`;

    // Save compressed image to local storage
    await FileSystem.copyAsync({
      from: result.uri,
      to: localPath,
    });

    return localPath;
  } catch (err) {
    console.error("Image caching error:", err);
    return null;
  }
};
