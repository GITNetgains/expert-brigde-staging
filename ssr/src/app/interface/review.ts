import { IUser } from './user';

export interface IReview {
  comment: string;
  appointmentId: string;
  webinarId: string;
  type: string;
  rating: number;
  rateBy: string;
  rater: IUser;
  createdAt: string;
  courseId: string;
  updated: boolean;
}

export interface IFilterReview {
  appointmentId: string;
  tutorId: string;
  userId: string;
  webinarId: string;
  courseId: string;
  type: string;
  rateTo: string;
  rateBy: string;
}

export interface IStatsReview {
  totalRating: number;
  ratingScore: number;
  ratingAvg: number;
}

export interface ICreateReview {
  comment: string;
  appointmentId: string;
  webinarId: string;
  type: string;
  rating: number;
  courseId: string;
}
