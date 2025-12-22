import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private transactionUrl = `${environment.apiUrl}/payment/transactions`;

  constructor(private http: HttpClient) {}

  search(params: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get(this.transactionUrl, { params: httpParams });
  }

  findOne(id: any): Observable<any> {
    return this.http.get(`${this.transactionUrl}/${id}`);
  }
}
