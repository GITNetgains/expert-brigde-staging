export interface ICalendarPayload {
  tutorId: string;
  type?: string;
  webinarId?: string;
  hashWebinar?: string;
  slotDuration?: number;
  isFree?: boolean;
}

export interface ISchedule {
  _id: string;
  startTime: Date;
  toTime: Date;
  tutorId: any;
  disabled: boolean;
  type: string;
  booked: boolean;
  webinarName?: string;
  isFree?: boolean;
  webinarId?: string;
  hashWebinar?: string;
}