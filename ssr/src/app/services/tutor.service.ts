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

  /**
   * Parse CV/Resume (PDF) and extract structured profile data.
   * @param mediaId ID of uploaded PDF (e.g. resume document)
   * @returns Promise with extracted data: name, email, phoneNumber, address, city, state, zipCode, countryCode, countryName, languages, bio, highlights, yearsExperience, skillNames, industryNames, education[], experience[]
   */
  parseCv(mediaId: string): Promise<any> {
    return this.post('/tutors/parse-cv', { mediaId }).then((res: any) => res?.data ?? res);
  }

  /**
   * Send name + CV URL to expert-registration webhook (from profile dashboard).
   * Backend sends mongo_user_id, email, name, cv_file_url to the webhook.
   */
  sendCvWebhook(body: { name?: string; cv_file_url: string }): Promise<any> {
    return this.post('/tutors/send-cv-webhook', body).then((res: any) => res?.data ?? res);
  }
}
