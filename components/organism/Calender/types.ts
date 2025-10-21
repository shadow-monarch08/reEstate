export type Range = { start: Date | null; end: Date | null };

export type Props = {
  value?: Range;
  onChange?: (range: Range) => void;
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date; // month to show initially
  locale?: string; // optional locale code for day names
};
