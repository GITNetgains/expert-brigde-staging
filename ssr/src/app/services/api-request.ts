import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { isUrl } from 'src/lib/string';
import { lastValueFrom } from 'rxjs';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { environment } from 'src/environments/environment';
export interface IResponse<T> {
  code: number;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class APIRequest {
  static token = '';
  static API_ENDPOINT = '';
  cookieService = inject(SsrCookieService);
  constructor(
    private httpClient: HttpClient
  ) { }

  getBaseApiEndpoint() {
    const { API_ENDPOINT } = APIRequest;
    if (API_ENDPOINT) return API_ENDPOINT;

    const { apiBaseUrl } = environment as any;
    return apiBaseUrl;
  }

  /**
   * Checks if a network request came back fine, and throws an error if not
   *
   * @param  {object} response   A response from a network request
   *
   * @return {object|undefined} Returns either the response, or throws an error
   */
  private async checkStatus(response: HttpErrorResponse) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    if (response.status === 401) {
      await this.cookieService.delete('accessToken');
      await this.cookieService.delete('isLoggedin');
      window.location.href = '/auth/login'
      throw new Error('Please login!');
    }

    if (response.status === 404) {
      window.location.href = 'pages/404-not-found';
      throw new Error('Not found!');
    }
    throw response.error;
  }

  buildUrl(baseUrl: string, params?: { [key: string]: any }) {
    if (!params) {
      return baseUrl;
    }

    const queryString = Object.keys(params)
      .map((k) => {
        if (Array.isArray(params[k])) {
          return params[k]
            .map(
              (param: any) =>
                `${encodeURIComponent(k)}=${param}`
            )
            .join('&');
        }
        return `${encodeURIComponent(k)}=${params[k]}`;
      })
      .join('&');
    return `${baseUrl}?${encodeURI(queryString)}`;
  }

  async request(
    url: string,
    method?: string,
    body?: any,
    headers?: { [key: string]: string }
  ): Promise<any> {
    const verb = (method || 'get').toUpperCase();
    const token = this.cookieService.get('accessToken');
    const updatedHeader = {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const baseApiEndpoint = this.getBaseApiEndpoint();
    const updatedUrl = isUrl(url) ? url : `${baseApiEndpoint}${url}`;
    return lastValueFrom(
      this.httpClient.request(verb, updatedUrl, {
        headers: updatedHeader,
        body: body ? JSON.stringify(body) : null
      })
    )
      .then((resp) => resp)
      .catch((err) => {
        throw err?.error;
      });
  }

  get(url: string, headers?: { [key: string]: string }) {
    return this.request(url, 'get', null, headers);
  }

  post(url: string, data?: any, headers?: { [key: string]: string }) {
    return this.request(url, 'post', data, headers);
  }

  put(url: string, data?: any, headers?: { [key: string]: string }) {
    return this.request(url, 'put', data, headers);
  }

  del(url: string, data?: any, headers?: { [key: string]: string }) {
    return this.request(url, 'delete', data, headers);
  }
}
