import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService extends APIRequest {
  create(credentials: any): Promise<any> {
    return this.post('/appointments/book', credentials);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/appointments', params));
  }

  cancel(id: string, data: any): Promise<any> {
    return this.post(`/appointments/${id}/cancel`, data);
  }

  checkFree(data: any): Promise<any> {
    return this.post('/appointments/check/free', data);
  }

  findOne(id: string): Promise<any> {
    return this.get(`/appointments/${id}`);
  }

  appointmentTutor(tutorId: any, params: any): Promise<any> {
    return this.get(this.buildUrl(`/appointments/tutors/${tutorId}`, params));
  }

  checkOverlap(data: any): Promise<any> {
    return this.post('/appointments/check/overlap', data);
  }

  checkout(data: any): Promise<any> {
    return this.post('/appointments/checkout', data);
  }

  updateDocument(id: string, data: any): Promise<any> {
    return this.put(`/appointments/${id}/update-document`, data);
  }

  tutorCancel(appointmentId: string, data: any) {
    return this.post(`/appointments/tutor/${appointmentId}/cancel`, data);
  }

  studentCancel(appointmentId: string, data: any) {
    return this.post(`/appointments/student/${appointmentId}/cancel`, data);
  }

  canReschedule(appointmentId: string) {
    return this.post(`/appointments/${appointmentId}/canReschedule`);
  }

  reSchedule(appointmentId: string, data: any) {
    return this.put(`/appointments/${appointmentId}/reSchedule`, data);
  }

  startMeeting(appointmentId: string): Promise<any> {
    return this.post(`/meeting/start/${appointmentId}`);
  }

  joinMeeting(appointmentId: string): Promise<any> {
    return this.post(`/meeting/join/${appointmentId}`);
  }

  removeDocument(id: string, documentId: string): Promise<any> {
    return this.del(`/appointments/${id}/remove-document/${documentId}`);
  }

  report(data: any): Promise<any> {
    return this.post('/reports', data);
  }

  searchAppointmentWebinar(params: any): Promise<any> {
    return this.get(this.buildUrl('/appointments/webinar/aggregate', params));
  }
}
