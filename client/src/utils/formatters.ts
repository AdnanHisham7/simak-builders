export type DateInput = string | number | Date | null | undefined;
export type NumericInput = number | string | null | undefined;

export const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";
export const DEFAULT_NUMBER_FORMAT = "en-IN";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

const toValidDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateParts = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    lookup[part.type] = part.value;
  });

  return { year: lookup.year, month: lookup.month, day: lookup.day };
};

/**
 * Formats a date according to the user's preferred date format and timezone.
 * Supported formats: "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD".
 */
export const formatDate = (
  value: DateInput,
  dateFormat: string = DEFAULT_DATE_FORMAT,
  timezone: string = DEFAULT_TIMEZONE,
): string => {
  const date = toValidDate(value);
  if (!date) return "-";

  const { year, month, day } = getDateParts(date, timezone);

  switch (dateFormat) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
};

/** Formats the time portion of a date in the user's preferred timezone. */
export const formatTime = (
  value: DateInput,
  timezone: string = DEFAULT_TIMEZONE,
): string => {
  const date = toValidDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/** Formats a date and time together using the user's preferred date format and timezone. */
export const formatDateTime = (
  value: DateInput,
  dateFormat: string = DEFAULT_DATE_FORMAT,
  timezone: string = DEFAULT_TIMEZONE,
): string => {
  const date = toValidDate(value);
  if (!date) return "-";

  return `${formatDate(date, dateFormat, timezone)}, ${formatTime(date, timezone)}`;
};

/** Formats a date as a long month + year label (e.g. "January 2026") in the user's timezone. */
export const formatMonthYear = (
  value: DateInput,
  timezone: string = DEFAULT_TIMEZONE,
): string => {
  const date = toValidDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Formats a number according to the user's preferred number format locale
 * ("en-IN", "en-US", or "en-GB"). Accepts the same options as Intl.NumberFormat.
 */
export const formatNumber = (
  value: NumericInput,
  numberFormat: string = DEFAULT_NUMBER_FORMAT,
  options?: Intl.NumberFormatOptions,
): string => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const safeValue =
    numericValue === null || numericValue === undefined || Number.isNaN(numericValue)
      ? 0
      : numericValue;

  return new Intl.NumberFormat(numberFormat, options).format(safeValue);
};

/** Formats a number with a fixed number of decimal places, honoring the number format locale. */
export const formatDecimal = (
  value: NumericInput,
  numberFormat: string = DEFAULT_NUMBER_FORMAT,
  digits = 2,
): string =>
  formatNumber(value, numberFormat, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
