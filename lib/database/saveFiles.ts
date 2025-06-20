import RNFS from "react-native-fs";

const ROOT_DIR = `${RNFS.DocumentDirectoryPath}/ReEstate`;

const PROFILE_IMAGE_DIR = `${ROOT_DIR}/profile_images`;

export const saveProfileImage = async (
  url: string,
  agentId: string
): Promise<string> => {
  try {
    const filePath = `${PROFILE_IMAGE_DIR}/${agentId}.jpg`;

    // Make sure directory exists
    const exists = await RNFS.exists(PROFILE_IMAGE_DIR);
    if (!exists) await RNFS.mkdir(PROFILE_IMAGE_DIR);

    // Download the image
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
    }).promise;

    if (result.statusCode === 200) {
      return filePath;
    } else {
      throw new Error("Image download failed");
    }
  } catch (error) {
    console.error("Failed to save image:", error);
    throw error;
  }
};

const PROPERTY_IMAGE_DIR = `${ROOT_DIR}/property_images`;

export const savePropertyImage = async<T>(
  url: string,
  property_id: T
): Promise<string> => {
  try {
    const filePath = `${PROPERTY_IMAGE_DIR}/${property_id}.jpg`;

    // Make sure directory exists
    const dirExists = await RNFS.exists(PROPERTY_IMAGE_DIR);
    if (!dirExists) await RNFS.mkdir(PROPERTY_IMAGE_DIR);

    // Check if the image already exists
    const imageExists = await RNFS.exists(filePath);
    if (imageExists) {
      return filePath; // Already downloaded
    }

    // Download the image
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
    }).promise;

    if (result.statusCode === 200) {
      return filePath;
    } else {
      throw new Error("Image download failed with status " + result.statusCode);
    }
  } catch (error) {
    console.error("Failed to save image:", error);
    throw error;
  }
};

const FILE_DIR = `${ROOT_DIR}/file`;


export const saveFile = async (
  url: string,
  message_id: string | undefined
): Promise<string> => {
  try {
    const filePath = `${FILE_DIR}/${message_id}.jpg`;

    // Make sure directory exists
    const dirExists = await RNFS.exists(FILE_DIR);
    if (!dirExists) await RNFS.mkdir(FILE_DIR);

    // Check if the image already exists
    const imageExists = await RNFS.exists(filePath);
    if (imageExists) {
      return filePath; // Already downloaded
    }

    // Download the image
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
    }).promise;

    if (result.statusCode === 200) {
      return filePath;
    } else {
      throw new Error("Image download failed with status " + result.statusCode);
    }
  } catch (error) {
    console.error("Failed to save image:", error);
    throw error;
  }
};
