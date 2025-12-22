import { IMedia } from 'src/interfaces/media.interface';
import { ICategory } from 'src/interfaces/category.interface';
import { IUser } from 'src/interfaces/user.interface';
import { ICoupon } from 'src/interfaces/coupon.interface';

export interface IMainImage {
  _id: string;
  fileUrl: string;
  thumbUrl: string;
  name: string;
  mimeType: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

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
  sections: ISection[];
  isFavorite: boolean;
  videoIntroduction: IMedia;
  featured: boolean;
  gradeIds: string[];
  booked: boolean;
  subjectIds: string[];
  topicIds: string[];
  totalMedia: number;
  age: {
    from: number;
    to: number;
  };
  isDraff: boolean;
  enrolledCount: number;
  disabled?: boolean;
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
  section: ISection;
  media: IMedia;
  mediaType: string;
  preview: boolean;
  mediaId: string;
  courseId: string;
  mediaIds: string[];
  medias: ILectureMedia[];
  duration: number;
}

export interface ILectureMedia {
  _id: string;
  ordering: number;
  totalLength: number;
  media: IMedia;
  mediaType: string;
  mediaId: string;
  lectureId: string;
}

export interface ICourseCreateRequest {
  tutorId: string;
  name: string;
  price: number;
  categoryIds: string[];
  description: string;
  mainImageId: string;
  introductionVideoId: string;
  alias: string;
  isFree: boolean;
  subjectIds: string[];
  topicIds: string[];
  gradeIds: string[];
  age: {
    from: number;
    to: number;
  };
}

export interface ICourseUpdateRequest extends Partial<ICourseCreateRequest> {
  _id?: string;
  featured?: boolean;
  approved?: boolean;
  disabled?: boolean;
}
