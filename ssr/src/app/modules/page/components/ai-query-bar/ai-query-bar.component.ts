// ai-query-bar.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services';
import { AppService } from 'src/app/services/app-service';

@Component({
  selector: 'app-ai-query-bar',
  templateUrl: './ai-query-bar.component.html',
  styleUrls: ['./ai-query-bar.component.scss'],
})
export class AiQueryBarComponent {
  query = '';
  isRecording = false;
  recognition: any;

  constructor(private router: Router, private auth: AuthService, private app: AppService) {}

  ngOnInit() {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isRecording = true;
      };

      this.recognition.onresult = (event: any) => {
        this.query = event.results[0][0].transcript;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    this.isRecording
      ? this.recognition.stop()
      : this.recognition.start();
  }

  async onSearch(event: Event) {
    event.preventDefault();
    if (!this.query.trim()) return;
    if (this.auth.isLoggedin()) {
      const current = await this.auth.getCurrentUser();
      const isTutor = current && current.type === 'tutor';
      if (isTutor) {
        this.app.toastError('Experts cannot post queries.');
        return;
      }
    }
    this.router.navigate(['/pages/ai-result'], { queryParams: { q: this.query } });
  }
}
