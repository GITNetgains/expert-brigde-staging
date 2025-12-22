import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable(
  { providedIn: 'root' }
)
export class TopicService extends APIRequest {
  public topics: any = null;

  private _getTopics: any;

  async getTopics(params: any): Promise<any> {
    if (this.topics) {
      return Promise.resolve(this.topics);
    }

    if (this._getTopics && typeof this._getTopics.then === 'function') {
      return this._getTopics;
    }

    this._getTopics = await this.get(this.buildUrl('/topics', params))
      .then(resp => {
        this.topics = resp;
        return this.topics;
      });
    return this._getTopics;
  }
  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/topics', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/topics/${id}`);
  }
}
