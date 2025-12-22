import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class SkillService extends APIRequest {
  public skills: any = null;
  private _getSkills: any;

  async getSkills(params: any) {
    if (this.skills) {
      return Promise.resolve(this.skills);
    }

    if (this._getSkills && typeof this._getSkills.then === 'function') {
      return this._getSkills;
    }

    this._getSkills = await this.get(this.buildUrl('/skills', params)).then((resp) => {
      this.skills = resp;
      return this.skills;
    });
    return this._getSkills;
  }

  async search(params: any) {
    return this.get(this.buildUrl('/skills', params));
  }

  async create(data: any) {
    return this.post('/skills', data);
  }
}
