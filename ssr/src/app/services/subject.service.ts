import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';


@Injectable({
  providedIn: 'root'
})
export class SubjectService extends APIRequest {
  public subjects: any = null;
  private _getSubjects: any;
  async getSubjects(params: any) {
    if (this.subjects) {
      return Promise.resolve(this.subjects);
    }

    if (this._getSubjects && typeof this._getSubjects.then === 'function') {
      return this._getSubjects;
    }

    this._getSubjects = await this.get(this.buildUrl('/subjects', params)).then(resp => {
      this.subjects = resp;
      return this.subjects;
    });
    return this._getSubjects;
  }

  async search(params: any) {
    return this.get(this.buildUrl('/subjects', params));
  }
}
