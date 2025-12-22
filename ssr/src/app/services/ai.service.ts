import { Injectable, inject } from '@angular/core';
import { APIRequest, IResponse } from './api-request';

export interface AiSearchResponse {
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(APIRequest);

  async search(query: string, captchaToken: string): Promise<IResponse<AiSearchResponse>> {
    return this.api.post('/ai/search', { query, captchaToken });
  }
}

