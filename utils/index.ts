import { Platform, Linking, Alert } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system";

export function timeSince(dateString: string): string {
  // Step 1: Replace space with 'T' to form ISO date
  let isoString = dateString.replace(" ", "T");

  // Step 2: Trim microseconds to 3 digits (JavaScript supports only milliseconds)
  isoString = isoString.replace(/(\.\d{3})\d*/, "$1");

  // Step 3: Ensure timezone is correctly formatted
  isoString = isoString.replace("+00:00", "Z");

  const inputDate = new Date(isoString);
  const now = new Date();
  // console.log(now.toString())

  if (isNaN(inputDate.getTime())) {
    return "Invalid date";
  }

  const diffInMs = now.getTime() - inputDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30); // Approximate
  const diffInYears = Math.floor(diffInDays / 365); // Approximate

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "just now";
  }
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return isSameDay(d, yesterday);
  };

  if (isSameDay(date, now)) {
    // 24-hour format (e.g., 14:45)
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  // Format date (e.g., 09 Jun 2025)
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function simpleFormatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const getMapRegionWithRadius = (latitude: number, radius: number) => {
  const oneDegreeOfLatitudeInKm = 111.32;
  const latitudeDelta = radius / oneDegreeOfLatitudeInKm;
  const longitudeDelta =
    radius / (oneDegreeOfLatitudeInKm * Math.cos(latitude * (Math.PI / 180)));

  return {
    latitudeDelta: latitudeDelta * 2,
    longitudeDelta: longitudeDelta * 2,
  };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Opens a local file using the appropriate system UI.
 * On Android, uses an ACTION_VIEW Intent.
 * On iOS, uses the Linking API.
 * @param localUri The local file URI to open.
 * @param mimeType The MIME type of the file.
 */
export const openFileWithApp = async (localUri: string, mimeType: string) => {
  try {
    const contentUri = await FileSystem.getContentUriAsync(localUri);
    if (Platform.OS === "android") {
      // For Android, we use an Intent to view the file
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: mimeType,
      });
    } else if (Platform.OS === "ios") {
      // For iOS, the Linking API handles opening the "Open in..." dialog
      await Linking.openURL(contentUri);
    }
  } catch (error: any) {
    Alert.alert("Error", `Could not open the file: ${error}`);
    console.error("Error opening file:", error);
  }
};
