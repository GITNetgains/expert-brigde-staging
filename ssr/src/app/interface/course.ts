import { IMedia } from './media';
import { IMainImage } from './webinar';
import { ICategory } from './category';
import { IUser } from './user';
import { ICoupon } from './coupon';
export interface ICourse {
  _id: string;
  tutor: IUser;
  tutorId: string;
  name: string;
  price: number;
  categories: ICategory[];
  categoryIds: string[];
  description: string;
  mainImageId: string;
  mainImage: IMainImage;
  introductionVideoId: string;
  alias: string;
  createdAt: string;
  updatedAt: string;
  isFree: boolean;
  goalCourse: string[];
  whyJoinCourse: string[];
  needToJoinCourse: string[];
  ratingAvg: number;
  totalRating: number;
  ratingScore: number;
  coupon: ICoupon;
  totalSection: number;
  totalLecture: number;
  totalLength: number;
  approved: boolean;
  sections: ISection;
  isFavorite: boolean;
  videoIntroduction: any;
  featured: boolean;
  gradeIds: any[];
  booked: boolean;
  subjectIds: string[];
  topicIds: string[];
  totalMedia: number;
  age: any;
  isDraff: boolean;
  enrolledCount: number;
}

export interface ISection {
  _id: string;
  title: string;
  description: string;
  ordering: number;
  totalLength: number;
  totalLecture: number;
  courseId: string;
  course: ICourse;
  lectureIds: string[];
  lectures: ILecture[];
  duration: number;
  totalMedia: number;
  trialVideoId: string;
  trialVideo: IMedia;
}

export interface ILecture {
  _id: string;
  title: string;
  description: string;
  ordering: number;
  totalLength: number;
  sectionId: string;
  section: ICourse;
  media: any;
  mediaType: string;
  preview: boolean;
  mediaId: string;
  courseId: string;
  mediaIds: string[];
  medias: ILectureMeida[];
  duration: number;
}

export interface ILectureMeida {
  _id: string;
  ordering: number;
  totalLength: number;
  media: IMedia;
  mediaType: string;
  mediaId: string;
  lectureId: string;
}
