import { IMedia } from 'src/interfaces/media.interface';
import { IUser } from 'src/interfaces/user.interface';

export interface ICategory {
  _id: string;
  name: string;
  alias: string;
  description?: string;
  parentId?: string;
  ordering: number;
  iconId?: string;
  icon?: IMedia;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  originalCategoryId?: string;
  tutorId?: string;
  tutor?: IUser;
}
