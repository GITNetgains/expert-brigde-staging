export interface IMedia {
  _id: string;
  name: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  thumbUrl?: string;
  type: string;
  duration?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
}
