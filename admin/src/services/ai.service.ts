import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ai`;

  getPrompt(): Observable<{ data: { systemPrompt: string } }> {
    return this.http.get(`${this.apiUrl}/prompt`) as Observable<{ data: { systemPrompt: string } }>;
  }

  updatePrompt(systemPrompt: string): Observable<{ data: { systemPrompt: string } }> {
    return this.http.put(`${this.apiUrl}/prompt`, { systemPrompt }) as Observable<{ data: { systemPrompt: string } }>;
  }
}
