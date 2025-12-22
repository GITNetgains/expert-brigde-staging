import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends APIRequest {
  public categories: any = null;

  private _getCategories: any;
  async getCategories(params: any) {
    if (this.categories) {
      return this.categories;
    }

    if (this._getCategories && typeof this._getCategories.then === 'function') {
      return this._getCategories;
    }

    this._getCategories = await this.get(this.buildUrl('/categories', params)).then(resp => {
      this.categories = resp;
      return this.categories;
    });
    return this._getCategories;
  }

  create(params: any): Promise<any> {
    return this.post('/categories', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/categories', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/categories/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.post(`/categories/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/categories/${id}`);
  }
}
