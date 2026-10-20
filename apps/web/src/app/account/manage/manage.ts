import { Component, signal } from '@angular/core';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import { ManageEvents } from './manage-events';

@Component({
  selector: 'app-manage',
  imports: [SiteHeader, SiteFooter, ManageEvents],
  templateUrl: './manage.html',
  styleUrl: './manage.scss',
})
export class Manage {
  protected readonly eventsDialog = signal(false);

  protected onEventsDialog(open: boolean): void {
    this.eventsDialog.set(open);
  }
}
