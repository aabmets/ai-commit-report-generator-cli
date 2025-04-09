export type TimeUnit = "days" | "weeks";

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface UserOptions {
    dateRange: DateRange;
    username?: string;
}
