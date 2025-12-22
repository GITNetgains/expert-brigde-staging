import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable(
  { providedIn: 'root' }
)
export class GradeService extends APIRequest {
  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/grades', params))
  }
}
