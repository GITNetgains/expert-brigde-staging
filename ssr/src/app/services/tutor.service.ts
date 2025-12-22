import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class TutorService extends APIRequest {

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/tutors', params));
  }

  async findOne(id: string) {
    return this.get(`/tutors/${id}`);
  }

  update(data: any): Promise<any> {
    return this.put('/tutors', data);
  }

  createCertificate(data: any): Promise<any> {
    return this.post('/certificates', data);
  }

  updateCertificate(id: string, data: any): Promise<any> {
    return this.put(`/certificates/${id}`, data);
  }

  deleteCertificate(id: string): Promise<any> {
    return this.del(`/certificates/${id}`);
  }
}
