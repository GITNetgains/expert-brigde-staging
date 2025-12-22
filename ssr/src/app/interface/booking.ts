export interface IBooking {
  _id?: string;
  startTime?: string;
  toTime?: string;
  tutorId?: string;
  subjectId?: string;
  redirectSuccessUrl?: string;
  cancelUrl?: string;
  isFree?: boolean;
  couponCode?: string;
  targetId?: string;
  displayStartTime?: string;
  displayToTime?: string;
}
