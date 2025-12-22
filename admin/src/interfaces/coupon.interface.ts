export interface ICoupon {
  _id: string;
  code: string;
  name?: string;
  value: number;
  type: 'percent' | 'fixed';
  expiryDate: string;
  status: 'active' | 'inactive';
  courseId?: string;
  categoryId?: string;
  tutorId?: string;
  isGlobal: boolean;
  limitNumber?: number;
  usedNumber?: number;
  createdAt: string;
  updatedAt: string;
}
