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
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
      icon: 'assets/images/homepage/icon4.svg'
    },
    {
      title: 'Data Privacy',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
      icon: 'assets/images/homepage/icon5.svg'
    },
    {
      title: 'Secure Payment',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
      icon: 'assets/images/homepage/icon6.svg'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

}
