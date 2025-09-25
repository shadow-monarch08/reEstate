import { Text } from "react-native";
import UserMessageWrapper from "./UserMessageWrapper";
import { UserTextMessageType } from "./types";
import React from "react";

const UserTextMessage = ({ msg }: { msg: UserTextMessageType }) => {
  return (
    <UserMessageWrapper
      innerContainerClass="px-4 py-3"
      onPress={() => {}}
      msg={msg}
    >
      <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
        {msg.body} {"\t\t\t\t\t\t\t\t\t\t"}
      </Text>
    </UserMessageWrapper>
  );
};

export default React.memo(UserTextMessage);
