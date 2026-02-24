import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-policies-section',
  templateUrl: './policies-section.component.html',
  styleUrls: ['./policies-section.component.scss']
})
export class PoliciesSectionComponent implements OnInit {

  // Static items EXACTLY like your screenshot
  policyItems = [
    {
      title: 'Verified Experts',
      text: 'Every expert is vetted for credentials, experience, and professional standing before joining our network',
      icon: 'assets/images/homepage/icon4.svg'
    },
    {
      title: 'Data Privacy',
      text: 'Your information is protected with enterprise-grade encryption and strict confidentiality protocols',
      icon: 'assets/images/homepage/icon5.svg'
    },
    {
      title: 'Secure Payment',
      text: 'All transactions are processed through PCI-compliant payment gateways with full fraud protection',
      icon: 'assets/images/homepage/icon6.svg'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

}
