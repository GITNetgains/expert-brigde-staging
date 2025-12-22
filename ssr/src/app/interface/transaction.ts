import { ICoupon } from './coupon';
import { ICourse } from './course';
import { IMySubject, ISubject, IUser } from './user';
import { IWebinar } from './webinar';

export interface ITransaction {
  _id?: string;
  tutor?: IUser;
  user?: IUser;
  webinar?: IWebinar;
  targetType?: string;
  subject?: ISubject;
  course?: ICourse;
  type?: string;
  code?: string;
  price?: number;
  transaction?: any;
  createdAt?: string;
  status?: string;
  couponCode?: string;
  discountPrice?: number;
  couponInfo?: ICoupon;
  discountAmount?: number;
  balance?: number;
  usedCoupon?: boolean;
  tutorSubject?: IMySubject;
  userId?: string;
  originalPrice?: number;
}
