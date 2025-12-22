import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class StaticPageService extends APIRequest {
  public pages: any = null;

  private _getPages: any;
  async getPages(params: any) {
    if (this.pages) {
      return this.pages;
    }

    if (this._getPages && typeof this._getPages.then === 'function') {
      return this._getPages;
    }

    this._getPages = await this.get(this.buildUrl('/posts', params)).then(
      (resp) => {
        this.pages = resp;
        return this.pages;
      }
    );
    return this._getPages;
  }

  create(params: any): Promise<any> {
    return this.post('/posts', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/posts', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/posts/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/posts/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/posts/${id}`);
  }
}
