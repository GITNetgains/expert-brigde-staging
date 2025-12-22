import { Dayjs } from "dayjs";

export interface ISortOption {
  sortBy: string;
  sortType: string;
}

export interface IDatePickerOptions {
  name?: string;
  locale?: string;
  singleDatePicker?: boolean;
  onSelectedDate?: (event: {
    startDate: Dayjs;
    endDate: Dayjs;
  }) => void;
  autoApply?: boolean;
  closeOnApply?: boolean;
}