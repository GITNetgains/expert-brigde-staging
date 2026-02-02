import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, credentials);
  }

  
  search(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/search`, { params });
  }

  me(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  updateMe(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users`, data);
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  findGroups(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/groups/search`, { params });
  }

  createGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/groups`, data);
  }

  findGroup(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/groups/${id}`);
  }

  updateGroup(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/groups/${id}`, data);
  }

  removeGroup(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/groups/${id}`);
  }
  getAiQueries(userId: string) {
  return this.http.get(`${this.apiUrl}/users/${userId}/ai-queries`);
}

assignTutorToAiQuery(
  userId: string,
  queryId: string,
  tutorIds: string[]
) {
  return this.http.put(
    `${this.apiUrl}/users/${userId}/ai-queries/${queryId}/assign-tutors`,
    { tutorIds }
  );
}
deleteAiQuery(userId: string, queryId: string) {
  return this.http.delete(
    `${this.apiUrl}/users/${userId}/ai-queries/${queryId}`
  );
}

notifyUserAboutAiQuery(userId: string, queryId: string) {
  return this.http.post(
    `${this.apiUrl}/users/${userId}/ai-queries/${queryId}/notify`,
    {}
  );
}


}
