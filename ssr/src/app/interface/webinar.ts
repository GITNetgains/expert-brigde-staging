import { IUser } from './user';
import { ICategory } from './category';
import { IMylesson } from './user';
import { ICoupon } from './coupon';

export interface IWebinar {
  _id: string;
  name: string;
  tutor: IUser;
  tutorId: string;
  price: number;
  maximumStrength: number;
  categoryIds: any;
  isOpen: boolean;
  mediaIds: string[];
  mainImageId: string;
  description: string;
  category: ICategory[];
  lastDate: string;
  createdAt: string;
  mainImage: IMainImage;
  lastSlot: IMylesson;
  coupon: ICoupon;
  numberParticipants: number;
  isFavorite: boolean;
  ratingAvg: number;
  totalRating: number;
  ratingScore: number;
  alias: string;
  featured: boolean;
  media: any[];
  isFree: boolean;
  gradeIds: any[];
  booked: boolean;
  subjectIds: string[];
  topicIds: string[];
  latestSlot: any;
  age: any;
  canUpdate: boolean;
  categories: ICategory[];
  disabled: boolean;
}

export interface IMainImage {
  fileUrl: string;
  thumbUrl: string;
}


