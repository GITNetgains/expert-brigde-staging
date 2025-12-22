import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class TransactionService extends APIRequest {
  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/payment/transactions', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/payment/transactions/${id}`);
  }

  findOneTransactionCourse(tutorId: string, transactionId: string): Promise<any> {
    return this.get(`/courses/${tutorId}/transaction/${transactionId}`);
  }

  getTransactionsOfTutor(params: any): Promise<any> {
    return this.get(this.buildUrl('/payment/transactions-of-tutor', params));
  }
}
