import { View } from "react-native";
import { AgentLoadingMessage } from "./agent";
import { UserLoadingMessage } from "./user";

// Main loader: show 5–6 skeleton messages in random order
export const LoadingMessageRenderer = () => {
  // array of 6 messages, randomly "agent" or "user"
  const placeholders = [
    "agent",
    "user",
    "agent",
    "agent",
    "user",
    "agent",
    "user",
    "agent",
    "user",
    "user",
    "agent",
    "user",
    "agent",
    "user",
  ];

  return (
    <View className="px-4">
      {placeholders.map((type, idx) =>
        type === "agent" ? (
          <AgentLoadingMessage key={idx} />
        ) : (
          <UserLoadingMessage key={idx} />
        )
      )}
    </View>
  );
};
