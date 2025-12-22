import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-process-section',
  templateUrl: './process-section.component.html',
  styleUrls: ['./process-section.component.scss']
})
export class ProcessSectionComponent implements OnInit {

  activeStep = 0;
  intervalRef: any;

  steps = [
    {
      title: "Define",
      points: [
        "Share a one-line brief about your area of interest.",
        "Our AI tool instantly drafts your engagement brief.",
        "Edit or submit your expert request.",
        "Validate your email to post the query"
      ],
      image: "assets/images/homepage/process1.png"
    },
    {
      title: "Select",
      points: [
        "Get a curated list of experts, ready to consult on your project.",
        "Review profiles, ask questions, and engage.",
        "Receive vetted experts within 72 hours of submitting your brief."
      ],
      image: "assets/images/homepage/process1.png"
    },
    {
      title: "Engage",
      points: [
        "Consult directly with your chosen expert.",
        "Engagement can last from 30 minutes to over a year.",
        "Connect with multiple experts or switch anytime.",
        "No minimum commitment – enjoy the pay-as-you-go model."
      ],
      image: "assets/images/homepage/process1.png"
    }
  ];

  ngOnInit() {
    this.startAutoRotation();
  }

  /** Auto Rotate Every 4 Seconds */
  startAutoRotation() {
    this.intervalRef = setInterval(() => {
      this.activeStep = (this.activeStep + 1) % this.steps.length;
    }, 4000);
  }

  /** On Click – Set Step Manually */
  setActiveStep(index: number) {
    this.activeStep = index;

    // Optional: restart auto-rotation so it doesn't feel stuck
    clearInterval(this.intervalRef);
    this.startAutoRotation();
  }

  /** Scroll-Based Activation */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const section = document.querySelector('.process-wrapper');
    if (!section) return;

    const rect = section.getBoundingClientRect();

    if (rect.top < window.innerHeight * 0.4) {
      const scrollPercent =
        ((window.innerHeight * 0.4 - rect.top) / rect.height) *
        this.steps.length;

      this.activeStep = Math.min(
        this.steps.length - 1,
        Math.max(0, Math.floor(scrollPercent))
      );
    }
  }
}
