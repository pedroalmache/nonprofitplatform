import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentAccount } from '../account/current-account';
import { SiteFooter } from '../site-footer/site-footer';
import { SiteHeader } from '../site-header/site-header';
import { internationalPhone } from '../account/profile/profile-contact';
import { DirectoryApi, DirectoryProfile, linkedInHref } from './directory-api';
import { PictureAlbum } from './picture-album/picture-album';

@Component({
  selector: 'app-directory',
  imports: [SiteHeader, SiteFooter, PictureAlbum],
  templateUrl: './directory.html',
  styleUrl: './directory.scss',
})
export class Directory {
  private readonly directory = inject(DirectoryApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly viewer = inject(CurrentAccount);
  private requestId = 0;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly profiles = signal<DirectoryProfile[]>([]);
  protected readonly query = signal('');
  protected readonly visibleProfiles = computed(() => {
    const sorted = [...this.profiles()].sort(compareDirectoryNames);
    const term = this.query().trim().toLocaleLowerCase();
    if (term.length === 0) {
      return sorted;
    }
    return sorted.filter((profile) => directorySearchText(profile).includes(term));
  });
  protected readonly album = signal<DirectoryProfile | null>(null);
  protected readonly linkedInHref = linkedInHref;
  protected readonly internationalPhone = internationalPhone;

  constructor() {
    effect(() => {
      if (!this.viewer.ready()) {
        return;
      }
      this.viewer.signedIn();
      this.load();
    });
  }

  protected onQuery(event: Event): void {
    const target = event.target;
    this.query.set(target instanceof HTMLInputElement ? target.value : '');
  }

  protected openAlbum(profile: DirectoryProfile): void {
    this.album.set(profile);
  }

  protected closeAlbum(): void {
    this.album.set(null);
  }

  private load(): void {
    const request = ++this.requestId;
    this.loading.set(true);
    this.loadError.set(null);
    this.directory
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profiles) => {
          if (request !== this.requestId) {
            return;
          }
          this.profiles.set(profiles);
          this.loading.set(false);
        },
        error: () => {
          if (request !== this.requestId) {
            return;
          }
          this.profiles.set([]);
          this.loading.set(false);
          this.loadError.set('The directory could not be loaded.');
        },
      });
  }
}

function compareDirectoryNames(left: DirectoryProfile, right: DirectoryProfile): number {
  const byLastName = directoryLastName(left.fullName).localeCompare(
    directoryLastName(right.fullName),
    undefined,
    { sensitivity: 'base' },
  );
  if (byLastName !== 0) {
    return byLastName;
  }
  return left.fullName.localeCompare(right.fullName, undefined, { sensitivity: 'base' });
}

function directoryLastName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

function directorySearchText(profile: DirectoryProfile): string {
  return [profile.fullName, profile.title, profile.engineeringType]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLocaleLowerCase();
}
