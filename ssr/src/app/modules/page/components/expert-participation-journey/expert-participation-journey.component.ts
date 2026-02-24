import { Component } from '@angular/core';
import { SeoService } from 'src/app/services';

@Component({
  selector: 'app-expert-participation-journey',
  templateUrl: './expert-participation-journey.component.html',
  styleUrls: ['./expert-participation-journey.component.scss']
})
export class ExpertParticipationJourneyComponent {
  steps: { num: number; title: string; desc: string; icon: string }[] = [
    { num: 1, title: 'Inquiry Received', desc: 'We receive high-level requests from global clients.', icon: 'fi-rr-bullhorn' },
    { num: 2, title: 'Strategic Matching', desc: 'We identify experts via our network or custom recruiting.', icon: 'fi-rr-chart-network' },
    { num: 3, title: 'Screening', desc: 'We screen experts to ascertain their suitability to consult on that topic.', icon: 'fi-rr-hexagon-check' },
    { num: 4, title: 'Client Selection', desc: 'Clients review and shortlist profiles of the experts proposed by us.', icon: 'fi-rr-clipboard-user' },
    { num: 5, title: 'Seamless Interaction', desc: 'We manage scheduling and logistics for the call or project.', icon: 'fi-rr-calendar-days' },
    { num: 6, title: 'Recognition & Reward', desc: 'Experts get paid and rated for their professional contributions.', icon: 'fi-rr-hand-holding-usd' }
  ];

  constructor(private seoService: SeoService) {
    this.seoService.setMetaTitle("Expert's Participation Journey");
    this.seoService.setMetaDescription(
      "Share your knowledge. Shape the future. Grow with us. Learn how experts join and participate in the ExpertBridge network."
    );
  }
}
