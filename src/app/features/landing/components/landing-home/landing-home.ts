import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NexturaLogoComponent } from '@/shared/components/nextura-logo/nextura-logo.component';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [RouterModule, NexturaLogoComponent],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.css',
})
export class LandingHomeComponent {

}
