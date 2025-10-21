import { View, Text, ScrollView, Image, Pressable } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { RangeCalendar } from "@/components/organism/Calender";
import dayjs from "dayjs";
import { CustomInput } from "@/components/molecules/Input";
import icons from "@/constants/icons";
import { CustomButton } from "@/components/atoms/Button";

const Booking = () => {
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");
  const [note, setNote] = useState("");

  const DATE_FORMAT = "YYYY-MM-DD";

  function handleTextChange(type: "start" | "end", value: string) {
    if (type === "start") setStartText(value);
    if (type === "end") setEndText(value);

    const startParsed =
      type === "start"
        ? dayjs(value, DATE_FORMAT, true)
        : dayjs(startText, DATE_FORMAT, true);
    const endParsed =
      type === "end"
        ? dayjs(value, DATE_FORMAT, true)
        : dayjs(endText, DATE_FORMAT, true);

    const today = dayjs().startOf("day");

    // ✅ Validate start
    if (type === "start" && value) {
      if (startParsed.isValid()) {
        // ❌ Check if start date is before today
        if (startParsed.isBefore(today, "day")) {
          setStartError("Start date cannot be before today");
          return;
        }

        // ❌ Check if start > end
        if (endParsed.isValid() && startParsed.isAfter(endParsed, "day")) {
          setStartError("Start date cannot be after end date");
          return;
        }

        // ✅ Valid
        setRange((r) => ({ ...r, start: startParsed.toDate() }));
        setStartError("");
      } else {
        setStartError(`Invalid start date. Use format ${DATE_FORMAT}`);
      }
    }

    // ✅ Validate end
    if (type === "end" && value) {
      if (endParsed.isValid()) {
        // ❌ Check if start > end
        if (startParsed.isValid() && startParsed.isAfter(endParsed, "day")) {
          setEndError("End date cannot be before start date");
          return;
        }

        setRange((r) => ({ ...r, end: endParsed.toDate() }));
        setEndError("");
      } else {
        setEndError(`Invalid end date. Use format ${DATE_FORMAT}`);
      }
    }
  }

  return (
    <SafeAreaView className="bg-accent-100 h-full w-full relative pb-8">
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        <View className="w-full flex-row items-center gap-5 py-6">
          <Pressable>
            <Image source={icons.back_arrow} className="size-7" />
          </Pressable>
          <Text className="text-xl font-rubik-medium text-black-300 mt-1">
            Book Real Estate
          </Text>
        </View>
        <Text className="font-rubik-medium text-lg mb-4 mt-3">Select Date</Text>
        <RangeCalendar
          value={range}
          minDate={dayjs().toDate()}
          onChange={(newRange) => {
            setStartText(
              newRange.start ? dayjs(newRange.start).format(DATE_FORMAT) : ""
            );
            setEndText(
              newRange.end ? dayjs(newRange.end).format(DATE_FORMAT) : ""
            );
            setRange(newRange);
          }}
        />
        <View className="w-full mt-6 flex-row gap-5">
          <CustomInput
            value={startText}
            errorMessage={startError}
            iconPosition="right"
            label="Check in"
            onChangeText={(text) => handleTextChange("start", text)}
            placeholder="YYYY-MM-DD"
            icon={icons.calendar}
          />
          <CustomInput
            value={endText}
            errorMessage={endError}
            iconPosition="right"
            label="Check out"
            onChangeText={(text) => handleTextChange("end", text)}
            placeholder="YYYY-MM-DD"
            icon={icons.calendar}
          />
        </View>
        <CustomInput
          label="Note to Owner (optional)"
          iconPosition="right"
          placeholder="Notes"
          value={note}
          multiline={true}
          numberOfLines={10}
          onChangeText={(e) => setNote(e)}
          containerClassName="items-start h-48 p-6"
        />
      </ScrollView>
      <View className="absolute bottom-0 left-0 w-full px-6 py-3">
        <CustomButton text="Continue" />
      </View>
    </SafeAreaView>
  );
};

export default Booking;
