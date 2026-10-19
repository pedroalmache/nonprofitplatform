import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { calendarFile, downloadCalendarFile } from '../calendar-file';
import { focusFirstField, trapDialogKeydown } from '../dialog';
import { EventApi, EventPreview, EventVisibility, WebsiteEvent } from '../event-api';

@Component({
  selector: 'app-manage-events',
  templateUrl: './manage-events.html',
  styleUrl: './manage-events.scss',
})
export class ManageEvents {
  private readonly events = inject(EventApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly dialogOpen = output<boolean>();

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly rows = signal<WebsiteEvent[]>([]);
  protected readonly addOpen = signal(false);
  protected readonly link = signal('');
  protected readonly visibility = signal<EventVisibility | null>(null);
  protected readonly finding = signal(false);
  protected readonly adding = signal(false);
  protected readonly addErrors = signal<string[]>([]);
  protected readonly preview = signal<EventPreview | null>(null);
  protected readonly editing = signal<WebsiteEvent | null>(null);
  protected readonly editVisibility = signal<EventVisibility>('public');
  protected readonly savingVisibility = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly removing = signal<WebsiteEvent | null>(null);
  protected readonly removeError = signal<string | null>(null);
  protected readonly deleting = signal(false);
  private readonly addButton = viewChild<ElementRef<HTMLButtonElement>>('addButton');
  private readonly addDialog = viewChild<ElementRef<HTMLElement>>('addDialog');
  private readonly editDialog = viewChild<ElementRef<HTMLElement>>('editDialog');
  private readonly removeDialog = viewChild<ElementRef<HTMLElement>>('removeDialog');

  constructor() {
    this.destroyRef.onDestroy(() => this.dialogOpen.emit(false));
    this.events
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.loading.set(false);
        },
        error: (error: unknown) => this.failLoad(error),
      });
  }

  protected canAdd(event: WebsiteEvent): boolean {
    return calendarFile(event) !== null;
  }

  protected addToCalendar(event: WebsiteEvent): void {
    downloadCalendarFile(event);
  }

  protected openAdd(): void {
    this.link.set('');
    this.visibility.set(null);
    this.addErrors.set([]);
    this.preview.set(null);
    this.finding.set(false);
    this.adding.set(false);
    this.addOpen.set(true);
    this.dialogOpen.emit(true);
    setTimeout(() => focusFirstField(this.addDialog()?.nativeElement));
  }

  protected closeAdd(): void {
    if (this.finding() || this.adding()) {
      return;
    }
    this.addOpen.set(false);
    this.dialogOpen.emit(false);
    queueMicrotask(() => this.addButton()?.nativeElement.focus());
  }

  protected onAddKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.closeAdd());
  }

  protected onLink(event: Event): void {
    this.link.set(inputValue(event));
    this.preview.set(null);
  }

  protected chooseVisibility(visibility: EventVisibility): void {
    this.visibility.set(visibility);
  }

  protected find(event: Event): void {
    event.preventDefault();
    if (this.finding() || this.adding()) {
      return;
    }
    const visibility = this.visibility();
    if (!this.link().trim() || !visibility) {
      this.addErrors.set([
        ...(!this.link().trim() ? ['Paste a Google Calendar event link.'] : []),
        ...(!visibility ? ['Choose public or private.'] : []),
      ]);
      return;
    }

    this.finding.set(true);
    this.addErrors.set([]);
    this.preview.set(null);
    this.events
      .preview({ link: this.link().trim(), visibility })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.preview.set(preview);
          this.finding.set(false);
        },
        error: (error: unknown) => {
          this.finding.set(false);
          this.addErrors.set(readErrors(error, 'That event could not be found.'));
        },
      });
  }

  protected add(): void {
    const visibility = this.visibility();
    const preview = this.preview();
    if (!visibility || !preview?.upcoming || this.adding()) {
      return;
    }

    this.adding.set(true);
    this.addErrors.set([]);
    this.events
      .add({ link: this.link().trim(), visibility })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.adding.set(false);
          this.addOpen.set(false);
          this.dialogOpen.emit(false);
          this.reload();
        },
        error: (error: unknown) => {
          this.adding.set(false);
          this.addErrors.set(readErrors(error, 'The event could not be added.'));
        },
      });
  }

  private reload(): void {
    this.events
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error: unknown) => this.failLoad(error),
      });
  }

  private failLoad(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 403) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.loadError.set('The events could not be loaded.');
    this.loading.set(false);
  }

  protected openEdit(row: WebsiteEvent): void {
    this.editing.set(row);
    this.editVisibility.set(row.visibility);
    this.editError.set(null);
    this.dialogOpen.emit(true);
    setTimeout(() => focusFirstField(this.editDialog()?.nativeElement));
  }

  protected closeEdit(): void {
    if (this.savingVisibility()) {
      return;
    }
    this.editing.set(null);
    this.dialogOpen.emit(false);
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.closeEdit());
  }

  protected saveVisibility(event: Event): void {
    event.preventDefault();
    const row = this.editing();
    if (!row || this.savingVisibility()) {
      return;
    }

    this.savingVisibility.set(true);
    this.editError.set(null);
    this.events
      .changeVisibility(row.id, this.editVisibility())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.rows.set(this.rows().map((item) => (item.id === updated.id ? updated : item)));
          this.savingVisibility.set(false);
          this.editing.set(null);
          this.dialogOpen.emit(false);
        },
        error: (error: unknown) => {
          this.savingVisibility.set(false);
          this.editError.set(readErrors(error, 'The visibility could not be saved.')[0]);
        },
      });
  }

  protected openRemove(row: WebsiteEvent): void {
    this.removing.set(row);
    this.removeError.set(null);
    this.dialogOpen.emit(true);
    setTimeout(() => focusFirstField(this.removeDialog()?.nativeElement));
  }

  protected closeRemove(): void {
    if (this.deleting()) {
      return;
    }
    this.removing.set(null);
    this.dialogOpen.emit(false);
  }

  protected onRemoveKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.closeRemove());
  }

  protected confirmRemove(): void {
    const row = this.removing();
    if (!row || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.removeError.set(null);
    this.events
      .remove(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.rows.set(this.rows().filter((item) => item.id !== row.id));
          this.deleting.set(false);
          this.removing.set(null);
          this.dialogOpen.emit(false);
        },
        error: (error: unknown) => {
          this.deleting.set(false);
          this.removeError.set(readErrors(error, 'The event could not be removed.')[0]);
        },
      });
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function readErrors(error: unknown, fallback: string): string[] {
  if (error instanceof HttpErrorResponse && isRecord(error.error)) {
    const errors = error.error['errors'];
    if (Array.isArray(errors)) {
      const messages = errors.filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) {
        return messages;
      }
    }
  }

  return [fallback];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
