import { ICourse } from './course';
import { ISubject, IUser } from './user';
import { IWebinar } from './webinar';

export interface IRefund {
  _id?: string;
  tutor?: IUser;
  webinar?: IWebinar;
  subject?: ISubject;
  course?: ICourse;
  amount?: number;
  reason?: string;
  createdAt?: string;
  status?: string;
}
