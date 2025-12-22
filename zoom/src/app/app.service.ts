import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { IEnvironment } from './app.module';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  constructor(private http: HttpClient) {}

  configUrl = `${environment.production ? 'assets/configs/prod.config.json' : 'assets/configs/dev.config.json'}`;
  private configSettings: IEnvironment = null;

  get settings() {
    return this.configSettings;
  }

  public load(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.configUrl).subscribe((response: any) => {
        this.configSettings = response;
        resolve(true);
      });
    });
  }
}
