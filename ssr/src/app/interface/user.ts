import { ICourse } from './course';
import { ICategory } from './category';
import { IWebinar } from './webinar';

export interface IUser {
  _id: string;
  name: string;
  userId?: number;
  showPublicIdOnly?: boolean;
  username: string;
  phoneNumber: string;
  email: string;
  subjects: IMySubject[];
  subjectIds: string[];
  skills?: ISkill[];
  skillIds?: string[];
  bio: string;
  languages: string[];
  grades: string[];
  type: string;
  timezone: string;
  notificationSettings: boolean;
  avatarUrl: string;
  gender: string;
  address: string;
  paypalEmailId: string;
  education: ITutorCertificate[];
  experience: ITutorCertificate[];
  certification: ITutorCertificate[];
  ratingAvg: number;
  totalRating: number;
  ratingScore: number;
  country: ICountry;
  idYoutube: string;
  gradeItems: IGrade[];
  isFavorite: boolean;
  featured: boolean;
  zipCode: string;
  price1On1Class: number;
  completedByLearner: number;
  categories: ICategory[];
  industries?: any[];
  // Tutor-specific commission rate (0–1, e.g. 0.2 = 20%)
  commissionRate?: number;
  city: string;
  state: string;
  countryCode: string;
  isActive: boolean;
  yearsExperience?: number;
  consultationFee?: number;
  introVideoId: string | null;
  introYoutubeId: string;
  introVideo: any;
  defaultSlotDuration: number;
  password: string;
  highlights?: string[];
  industryIds?: string[];
}

export interface ITutorCertificate {
  _id?: string;
  title: string;
  organization?: string;
  description: string;
  fromYear: number;
  toYear: number;
  verified: boolean;
  documentId: string;
  ordering: number;
  tutorId: string;
  document: any;
  type: string;
}

export interface IMylesson {
  _id: string;
  user: IUser;
  tutor: IUser;
  webinar: IWebinar;
  subject: ISubject;
  targetType: string;
  paid: boolean;
  startTime: string;
  toTime: string;
  createdAt: string;
  status: string;
  transaction: any;
  couponCode: string;
  recordings: any;
  meetingEnd: boolean;
  disable: boolean;
  price: number;
  webinarId: string;
  isFree: boolean;
  zoomUrl: string;
  documentIds: string[];
  cancelReason: string;
  meetingId: string;
  userId: string;
  tutorId: string;
  documents: any[];
  displayStartTime: string;
  displayToTime: string;
  topic: ITopic;
  category: ICategory;
  report: any;
  zoomData: any;
  zoomLinkActive?: boolean;
}

export interface IMyCourse {
  _id: string;
  course: ICourse;
  name: string;
  category: ICategory[];
  categoryIds: string[];
  tutor: IUser;
  paid: boolean;
  courseId: string;
  userId: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  lectureMediaIdsCompleted: string[];
  isCompleted: boolean;
  completedAt: Date;
  completedPercent: number;
}

export interface IGrade {
  _id: string;
  nameGrade: string;
  key: string;
  name: string;
}

export interface ICountry {
  name: string;
  flag: string;
}

export interface ISubject {
  _id: string;
  name: string;
  price: number;
  alias: string;
  description: string;
  iconId: string;
  imageId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITopic {
  _id: string;
  name: string;
  alias: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface IMySubject {
  _id: string;
  originalSubjectId: string;
  tutorId: string;
  name: string;
  price: number;
  description: string;
  alias: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  myCategoryId: string;
}

export interface IMyCategory {
  _id: string;
  originalCategoryId: string;
  tutorId: string;
  name: string;
  alias: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMyTopic {
  _id: string;
  originalTopicId: string;
  tutorId: string;
  name: string;
  alias: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  myCategoryId: string;
  mySubjectId: string;
  price: number;
}

export interface ISkill {
  _id: string;
  name: string;
  alias: string;
  description?: string;
}

export interface IStaticPage {
  _id: string;
  title: string;
  content: string;
  alias: string;
  type: string;
}
