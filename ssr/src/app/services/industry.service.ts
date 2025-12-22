import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class IndustryService extends APIRequest {
  public industries: any = null;
  private _getIndustries: any;

  async getIndustries(params: any) {
    if (this.industries) {
      return Promise.resolve(this.industries);
    }
    if (this._getIndustries && typeof this._getIndustries.then === 'function') {
      return this._getIndustries;
    }
    this._getIndustries = await this.get(this.buildUrl('/industries', params)).then((resp) => {
      this.industries = resp;
      return this.industries;
    });
    return this._getIndustries;
  }

  async search(params: any) {
    return this.get(this.buildUrl('/industries', params));
  }

  async create(data: any) {
    return this.post('/industries', data);
  }
}
