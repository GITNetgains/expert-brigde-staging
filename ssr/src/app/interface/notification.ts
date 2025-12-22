export interface INotification {
  _id: string;
  title: string;
  description: string;
  unreadNotification: number;
  itemId: string;
  type: string;
  item: any;
  updatedAt: string;
}