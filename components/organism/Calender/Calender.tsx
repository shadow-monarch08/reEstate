/*
RangeCalendar.tsx
React Native calendar component (TypeScript) using NativeWind (Tailwind for RN).
Features:
- Month view
- Select start and end dates (range selection)
- Fresh modern UI using Tailwind utility classes
- Props: value, onChange, minDate, maxDate, initialMonth, locale
/>
*/

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  GestureResponderEvent,
  PanResponder,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Props, Range } from "./types";

import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(weekday);
dayjs.extend(isoWeek);

// enable plugins
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return dayjs(a).isSame(dayjs(b), "day");
}

function isBetween(day: Date, start?: Date | null, end?: Date | null) {
  if (!start || !end) return false;
  const d = dayjs(day).startOf("day");
  return (
    d.isAfter(dayjs(start).startOf("day")) &&
    d.isBefore(dayjs(end).startOf("day"))
  );
}

export default function RangeCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  initialMonth,
  locale,
}: Props) {
  const translateX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const [visibleMonth, setVisibleMonth] = useState(() =>
    dayjs(initialMonth ?? value?.start ?? new Date()).startOf("month")
  );
  const [internalRange, setInternalRange] = useState<Range>({
    start: value?.start ?? null,
    end: value?.end ?? null,
  });

  // Sync external value changes (basic)
  useEffect(() => {
    if (value)
      setInternalRange({ start: value.start ?? null, end: value.end ?? null });
  }, [value?.start?.toString(), value?.end?.toString()]);

  // Generate matrix of days for current visible month (6 rows x 7 cols)
  const weeks = useMemo(() => {
    const startOfMonth = visibleMonth.startOf("month");
    // Start from the Sunday of the week containing the 1st
    const startGrid = startOfMonth.startOf("week");
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(startGrid.add(i, "day").toDate());
    }
    return days;
  }, [visibleMonth]);

  function clampToLimits(date: Date) {
    if (minDate && dayjs(date).isBefore(dayjs(minDate), "day")) return false;
    if (maxDate && dayjs(date).isAfter(dayjs(maxDate), "day")) return false;
    return true;
  }

  function handleDayPress(day: Date) {
    if (!clampToLimits(day)) return;

    const { start, end } = internalRange;

    // If neither selected OR both selected, start a new range
    if (!start || (start && end)) {
      const next = { start: day, end: null };
      setInternalRange(next);
      onChange?.(next);
      return;
    }

    // If only start exists
    if (start && !end) {
      // If tapped before start, make it the new start
      if (dayjs(day).isBefore(dayjs(start), "day")) {
        const next = { start: day, end: start };
        setInternalRange(next);
        onChange?.(next);
      } else if (isSameDay(day, start)) {
        // tapping same start selects single-day range
        const next = { start, end: start };
        setInternalRange(next);
        onChange?.(next);
      } else {
        const next = { start, end: day };
        setInternalRange(next);
        onChange?.(next);
      }
      return;
    }
  }

  function goMonth(delta: number) {
    setVisibleMonth((m) => m.add(delta, "month"));
  }

  function clearRange() {
    const next = { start: null, end: null };
    setInternalRange(next);
    onChange?.(next);
  }

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -50) {
            // swipe left → animate to -width then update month
            translateX.value = withTiming(-300, { duration: 200 }, () => {
              runOnJS(goMonth)(1);
              translateX.value = 300; // jump from right
              translateX.value = withTiming(0, { duration: 200 });
            });
          } else if (gestureState.dx > 50) {
            // swipe right → animate to +width then update month
            translateX.value = withTiming(300, { duration: 200 }, () => {
              runOnJS(goMonth)(-1);
              translateX.value = -300; // jump from left
              translateX.value = withTiming(0, { duration: 200 });
            });
          }
        },
      }),
    []
  );

  const headerTitle = visibleMonth.format("MMMM YYYY");

  return (
    <View className="bg-accent-100 rounded-[2rem] overflow-hidden">
      <View
        {...panResponder.panHandlers}
        className="w-full max-w-md mx-auto bg-primary-100 p-4"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3 px-3">
          <View className="items-center">
            <Text className="text-lg font-rubik-medium mt-0.5">
              {headerTitle}
            </Text>
            {/* <Text className="text-xs text-gray-500">
              {internalRange.start
                ? `${dayjs(internalRange.start).format("MMM D")}`
                : "Start"}{" "}
              —{" "}
              {internalRange.end
                ? `${dayjs(internalRange.end).format("MMM D")}`
                : "End"}
            </Text> */}
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={() => goMonth(-1)} className="p-2 rounded-full">
              <Text className="text-lg">◀</Text>
            </Pressable>
            <Pressable onPress={() => goMonth(1)} className="p-2 rounded-full">
              <Text className="text-lg">▶</Text>
            </Pressable>
          </View>
        </View>

        {/* Weekday labels */}
        <View className="flex flex-row mb-2">
          {WEEK_DAYS.map((d) => (
            <View key={d} className="items-center py-1 w-[14.28%]">
              <Text className="text-xs font-rubik mt-0.5 text-gray-500">
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Days grid */}
        <Animated.View
          style={[animatedStyle]}
          className="flex flex-row flex-wrap"
        >
          {weeks.map((day, idx) => {
            const isOtherMonth = !dayjs(day).isSame(visibleMonth, "month");
            const disabled = !clampToLimits(day);
            const isStart = isSameDay(day, internalRange.start);
            const isEnd = isSameDay(day, internalRange.end);
            const inRange = isBetween(
              day,
              internalRange.start,
              internalRange.end
            );

            // styling decisions:
            // - start/end: pill with primary background and white text
            // - in-range: soft tinted background
            // - otherMonth: muted text color

            let containerClass =
              "rounded-lg my-1 p-2 items-center justify-center";
            let textClass = "text-sm font-rubik mt-0.5";

            if (disabled && !isOtherMonth) {
              textClass += " text-black-100";
            } else if (isStart || isEnd) {
              containerClass += " bg-primary-300";
              textClass += " text-accent-100 font-rubik-medium";
            } else if (inRange) {
              containerClass += " bg-primary-200 rounded-none";
              textClass += " text-primary-300";
            } else if (isOtherMonth) {
              textClass += " text-gray-300";
            } else {
              textClass += " text-black-300";
            }

            // For start/end, round corners on left/right depending on whether
            // there is a contiguous range extending.
            if (
              isStart &&
              internalRange.end &&
              !isSameDay(internalRange.start, internalRange.end)
            ) {
              containerClass += " rounded-l-full";
            }
            if (
              isEnd &&
              internalRange.start &&
              !isSameDay(internalRange.start, internalRange.end)
            ) {
              containerClass += " rounded-r-full";
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleDayPress(day)}
                disabled={disabled}
                className={`flex items-center justify-center h-11 w-[14.28%] ${containerClass}`}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text className={`${textClass}`}>{dayjs(day).date()}</Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Footer / quick actions */}
        {/* <View className="flex-row items-center justify-between mt-4">
          <Pressable
            onPress={() => {
              // Quick-select: this week
              const start = dayjs().startOf("week").toDate();
              const end = dayjs().endOf("week").toDate();
              const next = { start, end };
              setInternalRange(next);
              onChange?.(next);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200"
          >
            <Text className="text-sm">This week</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              // Quick-select: next 7 days
              const start = dayjs().toDate();
              const end = dayjs().add(6, "day").toDate();
              const next = { start, end };
              setInternalRange(next);
              onChange?.(next);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200"
          >
            <Text className="text-sm">Next 7 days</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              // Confirm: just call onChange with current internalRange (useful if parent stores it)
              onChange?.(internalRange);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600"
          >
            <Text className="text-sm text-white">Apply</Text>
          </Pressable>
        </View> */}
      </View>
    </View>
  );
}
