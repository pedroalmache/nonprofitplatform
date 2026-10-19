import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { ProjectPhoto } from '../project-data';

export const SLIDE_INTERVAL_MS = 3000;

@Component({
  selector: 'app-photo-carousel',
  templateUrl: './photo-carousel.html',
  styleUrl: './photo-carousel.scss',
})
export class PhotoCarousel {
  readonly photos = input.required<readonly ProjectPhoto[]>();
  readonly label = input('Project photographs');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly index = signal(0);
  protected readonly userPaused = signal(false);
  private readonly hoverPaused = signal(false);

  protected readonly current = computed(() => {
    const items = this.photos();
    const safeIndex = items.length === 0 ? 0 : this.index() % items.length;
    return items[safeIndex];
  });

  /** One visible slide. A new index lets the previous photo play its leave fade. */
  protected readonly slides = computed(() => {
    const photo = this.current();
    return photo ? [{ index: this.index(), photo }] : [];
  });

  protected readonly multiple = computed(() => this.photos().length > 1);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
    effect(() => {
      const count = this.photos().length;
      const paused = this.userPaused() || this.hoverPaused();
      this.clearTimer();
      if (count > 1 && !paused && this.canAutoplay()) {
        this.startTimer();
      }
    });
  }

  protected previous(): void {
    const count = this.photos().length;
    if (count < 2) {
      return;
    }
    this.index.update((current) => (current - 1 + count) % count);
  }

  protected next(): void {
    const count = this.photos().length;
    if (count < 2) {
      return;
    }
    this.index.update((current) => (current + 1) % count);
  }

  protected togglePause(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected pauseForPointer(): void {
    this.hoverPaused.set(true);
  }

  protected resumeFromPointer(): void {
    this.hoverPaused.set(false);
  }

  private canAutoplay(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    if (typeof window.matchMedia !== 'function') {
      return true;
    }
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.photos().length < 2 || this.userPaused() || this.hoverPaused()) {
        return;
      }
      this.index.update((current) => (current + 1) % this.photos().length);
    }, SLIDE_INTERVAL_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
