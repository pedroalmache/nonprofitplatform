import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import {
  PROJECT_STATUS_ORDER,
  projectsByStatus,
  statusLabel,
  type ProjectStatus,
} from '../project-data';

@Component({
  selector: 'app-where-we-stand',
  imports: [RouterLink, SiteHeader, SiteFooter],
  templateUrl: './where-we-stand.html',
  styleUrl: './where-we-stand.scss',
})
export class WhereWeStand {
  protected readonly groups = PROJECT_STATUS_ORDER.map((status) => ({
    status,
    label: statusLabel(status),
    projects: projectsByStatus(status),
  }));

  protected statusLabel(status: ProjectStatus): string {
    return statusLabel(status);
  }
}
