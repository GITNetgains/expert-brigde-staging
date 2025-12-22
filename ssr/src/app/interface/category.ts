export interface ICategory {
  _id: string;
  name: string;
  isActive: boolean;
  alias: string;
}


export interface ICreateCategory {
  name?: string;
  isActive?: boolean;
  originalCategoryId?: string;
}
