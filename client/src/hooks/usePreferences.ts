import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  DateInput,
  DEFAULT_DATE_FORMAT,
  DEFAULT_NUMBER_FORMAT,
  DEFAULT_TIMEZONE,
  NumericInput,
  formatDate as formatDateUtil,
  formatDateTime as formatDateTimeUtil,
  formatDecimal as formatDecimalUtil,
  formatMonthYear as formatMonthYearUtil,
  formatNumber as formatNumberUtil,
  formatTime as formatTimeUtil,
} from "@/utils/formatters";

export interface PreferenceFormatters {
  dateFormat: string;
  numberFormat: string;
  timezone: string;
  formatDate: (value: DateInput) => string;
  formatDateTime: (value: DateInput) => string;
  formatTime: (value: DateInput) => string;
  formatMonthYear: (value: DateInput) => string;
  formatNumber: (value: NumericInput, options?: Intl.NumberFormatOptions) => string;
  formatDecimal: (value: NumericInput, digits?: number) => string;
}

/**
 * Exposes the signed-in user's saved preferences (date format, number format,
 * timezone) as ready-to-use formatter functions, so every screen renders
 * dates and numbers consistently with what the user configured in Settings.
 */
export const usePreferences = (): PreferenceFormatters => {
  const preferences = useSelector((state: RootState) => state.auth.user?.preferences);

  const dateFormat = preferences?.dateFormat || DEFAULT_DATE_FORMAT;
  const numberFormat = preferences?.numberFormat || DEFAULT_NUMBER_FORMAT;
  const timezone = preferences?.timezone || DEFAULT_TIMEZONE;

  return useMemo(
    () => ({
      dateFormat,
      numberFormat,
      timezone,
      formatDate: (value: DateInput) => formatDateUtil(value, dateFormat, timezone),
      formatDateTime: (value: DateInput) => formatDateTimeUtil(value, dateFormat, timezone),
      formatTime: (value: DateInput) => formatTimeUtil(value, timezone),
      formatMonthYear: (value: DateInput) => formatMonthYearUtil(value, timezone),
      formatNumber: (value: NumericInput, options?: Intl.NumberFormatOptions) =>
        formatNumberUtil(value, numberFormat, options),
      formatDecimal: (value: NumericInput, digits?: number) =>
        formatDecimalUtil(value, numberFormat, digits),
    }),
    [dateFormat, numberFormat, timezone],
  );
};
