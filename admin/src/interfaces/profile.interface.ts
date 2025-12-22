export interface IProfile {
  _id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email: string;
  subjectIds: string[];
  bio: string;
  password: string;
  emailVerified: boolean;
  avatar: string;
  avatarUrl: string;
  address: string;
  type: string;
  role: string;
  isActive: boolean;
}