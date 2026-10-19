import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECTS, statusLabel } from '../projects/project-data';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SiteHeader, SiteFooter],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly projects = PROJECTS;
  protected readonly statusLabel = statusLabel;
}
