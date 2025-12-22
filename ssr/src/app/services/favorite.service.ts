import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService extends APIRequest {
  search(params: any, type: string): Promise<any> {
    return this.get(this.buildUrl(`/favorites/${type}`, params))
  }

  favorite(params: any, type: string): Promise<any> {
    return this.post(`/favorites/${type}`, params);
  }

  unFavorite(id: string, type: string): Promise<any> {
    return this.del(`/favorites/${type}/${id}`)
  }
}
