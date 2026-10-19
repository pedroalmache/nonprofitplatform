import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { calendarFile, downloadCalendarFile } from '../account/calendar-file';
import { CurrentAccount } from '../account/current-account';
import { trapDialogKeydown } from '../account/dialog';
import { EventApi, WebsiteEvent } from '../account/event-api';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';
import { buildMonth, initialView, localIso } from './events-calendar';

@Component({
  selector: 'app-events',
  imports: [SiteHeader, SiteFooter],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  private readonly eventApi = inject(EventApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly viewer = inject(CurrentAccount);
  private requestId = 0;
  private viewChosen = false;
  protected readonly todayIso = localIso(new Date());

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly rows = signal<WebsiteEvent[]>([]);
  protected readonly year = signal(new Date().getFullYear());
  protected readonly monthIndex = signal(new Date().getMonth());
  protected readonly selectedId = signal<string | null>(null);
  private opener: HTMLElement | null = null;
  private readonly overlay = viewChild<ElementRef<HTMLElement>>('overlay');
  protected readonly month = computed(() =>
    buildMonth(this.year(), this.monthIndex(), this.rows(), this.todayIso),
  );
  protected readonly selected = computed(
    () => this.rows().find((row) => row.id === this.selectedId()) ?? null,
  );
  protected readonly monthEvents = computed(() => {
    const seen = new Set<string>();
    const events: WebsiteEvent[] = [];
    for (const week of this.month().weeks) {
      for (const day of week.days) {
        if (!day.inMonth) {
          continue;
        }
        for (const event of day.events) {
          if (seen.has(event.id)) {
            continue;
          }
          seen.add(event.id);
          events.push(event);
        }
      }
    }
    return events;
  });

  constructor() {
    effect(() => {
      if (!this.viewer.ready()) {
        return;
      }
      this.viewer.signedIn();
      this.load();
    });
  }

  protected previousMonth(): void {
    this.shiftMonth(-1);
  }

  protected nextMonth(): void {
    this.shiftMonth(1);
  }

  protected goToToday(): void {
    this.viewChosen = true;
    const view = initialView([], this.todayIso);
    this.year.set(view.year);
    this.monthIndex.set(view.monthIndex);
  }

  protected select(event: WebsiteEvent, trigger?: Event): void {
    if (this.selectedId() === event.id) {
      this.close();
      return;
    }
    const current = trigger?.currentTarget;
    this.opener = current instanceof HTMLElement ? current : null;
    this.selectedId.set(event.id);
    setTimeout(() => this.overlay()?.nativeElement.focus());
  }

  protected close(): void {
    const opener = this.opener;
    this.selectedId.set(null);
    this.opener = null;
    setTimeout(() => opener?.focus());
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.close());
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected canAdd(event: WebsiteEvent): boolean {
    return calendarFile(event) !== null;
  }

  protected addToCalendar(event: WebsiteEvent): void {
    downloadCalendarFile(event);
  }

  private shiftMonth(delta: number): void {
    this.viewChosen = true;
    const shifted = new Date(Date.UTC(this.year(), this.monthIndex() + delta, 1));
    this.year.set(shifted.getUTCFullYear());
    this.monthIndex.set(shifted.getUTCMonth());
  }

  private load(): void {
    const request = ++this.requestId;
    this.loading.set(true);
    this.loadError.set(null);
    this.eventApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          if (request !== this.requestId) {
            return;
          }
          this.rows.set(rows);
          if (!this.viewChosen) {
            const view = initialView(rows, this.todayIso);
            this.year.set(view.year);
            this.monthIndex.set(view.monthIndex);
          }
          if (!rows.some((row) => row.id === this.selectedId())) {
            this.selectedId.set(null);
          }
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (request !== this.requestId) {
            return;
          }
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }
          this.rows.set([]);
          this.loading.set(false);
          this.loadError.set('The events could not be loaded.');
        },
      });
  }
}
