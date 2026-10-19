import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { focusFirstField, trapDialogKeydown } from '../../account/dialog';
import { DirectoryApi, SharedAlbumPicture } from '../directory-api';

@Component({
  selector: 'app-picture-album',
  templateUrl: './picture-album.html',
  styleUrl: './picture-album.scss',
})
export class PictureAlbum {
  readonly personId = input.required<string>();
  readonly fullName = input.required<string>();
  readonly closed = output<void>();

  private readonly directory = inject(DirectoryApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly pictures = signal<SharedAlbumPicture[]>([]);
  protected readonly featured = signal<SharedAlbumPicture | null>(null);

  constructor() {
    effect(() => {
      const personId = this.personId();
      this.loading.set(true);
      this.loadError.set(null);
      this.featured.set(null);
      this.directory
        .pictures(personId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (album) => {
            this.pictures.set(album.pictures);
            this.loading.set(false);
            setTimeout(() => focusFirstField(this.dialog()?.nativeElement));
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.loadError.set(
              error instanceof HttpErrorResponse && error.status === 404
                ? 'These pictures are no longer available.'
                : 'The pictures could not be loaded.',
            );
            setTimeout(() => focusFirstField(this.dialog()?.nativeElement));
          },
        });
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.close());
  }

  protected feature(picture: SharedAlbumPicture): void {
    this.featured.set(picture);
    setTimeout(() => focusFirstField(this.dialog()?.nativeElement));
  }

  protected showWall(): void {
    this.featured.set(null);
    setTimeout(() => focusFirstField(this.dialog()?.nativeElement));
  }
}
