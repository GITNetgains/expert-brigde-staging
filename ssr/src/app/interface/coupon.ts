import { ICourse } from './course';
import { IWebinar } from './webinar';

export interface ICoupon {
  _id?: string;
  type: string;
  value: number;
  discountAmount: number;
  startTime: string | Date;
  expiredDate: string | Date;
  targetType: string;
  code: string;
  couponCode: string;
  name: string;
  webinarId: string;
  courseId: string;
  tutorId: string;
  active: boolean;
  limitNumberOfUse: number;
  webinar?: IWebinar;
  course?: ICourse;
  createdAt?: string;
}

export interface ICreateCoupon {
  type: string;
  value: number;
  discountAmount: number;
  startTime: string | Date;
  expiredDate: string | Date;
  targetType: string;
  code: string;
  couponCode: string;
  name: string;
  webinarId: string;
  courseId: string;
  tutorId: string;
  active: boolean;
  limitNumberOfUse: number;
}