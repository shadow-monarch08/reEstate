import { Text } from "react-native";
import AgentMessageWrapper from "./AgentMessageWrapper";
import { AgentTextMessageType } from "./types";
import React from "react";

const AgentTextTypeMessage = ({ msg }: { msg: AgentTextMessageType }) => {
  return (
    <AgentMessageWrapper
      onPress={() => {}}
      msg={msg}
      innerContainerClass="px-3 py-4"
    >
      <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
        {msg.body} {"\t\t\t\t\t\t\t\t\t\t"}
      </Text>
    </AgentMessageWrapper>
  );
};

export default React.memo(AgentTextTypeMessage);
