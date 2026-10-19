import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteFooter } from '../../site-footer/site-footer';
import { SiteHeader } from '../../site-header/site-header';
import { CurrentAccount } from '../current-account';
import { focusFirstField, trapDialogKeydown } from '../dialog';
import { claimAccountUrl } from '../claim-link';
import { MemberApi } from '../member-api';
import { PersonApi, PersonProfile, SharedPicture } from '../person-api';
import { emailError, formatPhone, phoneError } from './profile-contact';

@Component({
  selector: 'app-profile',
  imports: [SiteHeader, SiteFooter],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly people = inject(PersonApi);
  private readonly members = inject(MemberApi);
  private readonly viewer = inject(CurrentAccount);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest = 0;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly notice = signal<string | null>(null);
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly phone = signal('');
  protected readonly phoneError = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly emailError = signal<string | null>(null);
  protected readonly linkedIn = signal('');
  protected readonly title = signal('');
  protected readonly engineeringType = signal('');
  protected readonly hasProfile = signal(false);
  protected readonly profilePictureUrl = signal('');
  protected readonly sharedPictures = signal<SharedPicture[]>([]);
  protected readonly sharedPictureError = signal<string | null>(null);
  protected readonly sharedSaving = signal(false);
  protected readonly selectedShared = signal<File[]>([]);
  protected readonly pictureErrors = signal<string[]>([]);
  protected readonly pictureSaving = signal(false);
  protected readonly selectedPicture = signal<File | null>(null);
  protected readonly subjectUserId = signal<string | null>(null);
  protected readonly claimed = signal<boolean | null>(null);
  protected readonly claimUrl = signal<string | null>(null);
  protected readonly claimCopied = signal(false);
  protected readonly claimCopyError = signal<string | null>(null);
  protected readonly claimLinkError = signal<string | null>(null);
  protected readonly generatingClaimLink = signal(false);
  private pendingClaimToken: string | null = null;
  protected readonly deleteOpen = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly adminMode = computed(() => this.subjectUserId() !== null);
  protected readonly heading = computed(() => {
    if (!this.adminMode()) {
      return 'Your profile';
    }
    const name = this.firstName().trim();
    return name ? `${name} Profile (admin mode)` : 'Profile (admin mode)';
  });
  protected readonly canDelete = computed(() => {
    const subject = this.subjectUserId();
    if (!subject) {
      return false;
    }
    const self = this.viewer.userId();
    return self === null || subject !== self;
  });
  private readonly pictureInput = viewChild<ElementRef<HTMLInputElement>>('pictureInput');
  private readonly deleteDialog = viewChild<ElementRef<HTMLElement>>('deleteDialog');
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.noticeTimer !== null) {
        clearTimeout(this.noticeTimer);
      }
    });
    if (this.route.snapshot.paramMap.get('userId')) {
      this.pendingClaimToken = readClaimToken(this.router);
    }
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.load(params.get('userId'));
    });
  }

  protected onFirstName(event: Event): void {
    this.firstName.set(inputValue(event));
  }

  protected onLastName(event: Event): void {
    this.lastName.set(inputValue(event));
  }

  protected onPhone(event: Event): void {
    const formatted = formatPhone(inputValue(event));
    this.phone.set(formatted);
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      target.value = formatted;
      const end = formatted.length;
      target.setSelectionRange(end, end);
    }
    if (this.phoneError()) {
      this.phoneError.set(phoneError(formatted));
    }
  }

  protected onPhoneBlur(): void {
    this.phoneError.set(phoneError(this.phone()));
  }

  protected onEmail(event: Event): void {
    const value = inputValue(event);
    this.email.set(value);
    if (this.emailError()) {
      this.emailError.set(emailError(value));
    }
  }

  protected onEmailBlur(): void {
    this.emailError.set(emailError(this.email()));
  }

  protected onLinkedIn(event: Event): void {
    this.linkedIn.set(inputValue(event));
  }

  protected onTitle(event: Event): void {
    this.title.set(inputValue(event));
  }

  protected onEngineeringType(event: Event): void {
    this.engineeringType.set(inputValue(event));
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.saving()) {
      return;
    }

    const nextPhoneError = phoneError(this.phone());
    const nextEmailError = emailError(this.email());
    this.phoneError.set(nextPhoneError);
    this.emailError.set(nextEmailError);
    this.errors.set([]);
    if (nextPhoneError || nextEmailError) {
      return;
    }

    this.saving.set(true);
    const subject = this.subjectUserId();
    const input = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phone: this.phone().trim(),
      email: this.email().trim(),
      linkedIn: this.linkedIn().trim(),
      title: this.title().trim(),
      engineeringType: this.engineeringType().trim(),
    };
    const request = subject ? this.people.saveForUser(subject, input) : this.people.save(input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (person) => {
        if (this.editingSelf()) {
          this.viewer.notePerson(person);
        }
        this.apply(person);
        this.saving.set(false);
        this.showNotice(this.adminMode() ? 'The profile is saved.' : 'Your profile is saved.');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errors.set(readErrors(error));
      },
    });
  }

  protected onPicture(event: Event): void {
    const target = event.target;
    const files = target instanceof HTMLInputElement ? target.files : null;
    const file = files && files.length > 0 ? files[0] : null;
    this.selectedPicture.set(file);
    this.pictureErrors.set([]);
  }

  protected uploadPicture(): void {
    const file = this.selectedPicture();
    if (!file || this.pictureSaving() || !this.hasProfile()) {
      return;
    }

    this.pictureSaving.set(true);
    this.pictureErrors.set([]);
    const subject = this.subjectUserId();
    const request = subject
      ? this.people.savePictureForUser(subject, file)
      : this.people.savePicture(file);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (person) => {
        this.profilePictureUrl.set(person.profilePictureUrl ?? '');
        if (this.editingSelf()) {
          this.viewer.notePerson(person);
        }
        this.selectedPicture.set(null);
        const input = this.pictureInput()?.nativeElement;
        if (input) {
          input.value = '';
        }
        this.pictureSaving.set(false);
        this.showNotice(
          this.adminMode() ? 'The profile picture is saved.' : 'Your profile picture is saved.',
        );
      },
      error: (error: unknown) => {
        this.pictureSaving.set(false);
        this.pictureErrors.set(
          readErrors(error, 'Your profile picture could not be saved. Try again.'),
        );
      },
    });
  }

  protected onSharedPicture(event: Event): void {
    const target = event.target;
    const files = target instanceof HTMLInputElement ? target.files : null;
    this.selectedShared.set(files ? Array.from(files) : []);
    this.sharedPictureError.set(null);
  }

  protected uploadSharedPicture(): void {
    const files = this.selectedShared();
    if (files.length === 0 || this.sharedSaving() || !this.hasProfile()) {
      return;
    }

    this.sharedSaving.set(true);
    this.sharedPictureError.set(null);
    this.shareNext(files, 0, 0, null);
  }

  private shareNext(
    files: readonly File[],
    index: number,
    sharedCount: number,
    failure: string | null,
  ): void {
    if (index >= files.length) {
      this.finishSharing(sharedCount, failure);
      return;
    }

    const subject = this.subjectUserId();
    const request = subject
      ? this.people.addSharedPictureForUser(subject, files[index])
      : this.people.addSharedPicture(files[index]);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (picture) => {
        this.sharedPictures.update((pictures) => [...pictures, picture]);
        this.shareNext(files, index + 1, sharedCount + 1, failure);
      },
      error: (error: unknown) => {
        const message = readErrors(error, 'That picture could not be shared. Try again.')[0];
        this.shareNext(files, index + 1, sharedCount, failure ?? message);
      },
    });
  }

  private finishSharing(sharedCount: number, failure: string | null): void {
    this.sharedSaving.set(false);
    this.selectedShared.set([]);
    const input = document.getElementById('shared-picture');
    if (input instanceof HTMLInputElement) {
      input.value = '';
    }
    if (failure) {
      this.sharedPictureError.set(failure);
    }
    if (sharedCount === 1) {
      this.showNotice(this.adminMode() ? 'The picture is shared.' : 'Your picture is shared.');
    } else if (sharedCount > 1) {
      this.showNotice(this.adminMode() ? 'The pictures are shared.' : 'Your pictures are shared.');
    }
  }

  protected removeSharedPicture(pictureId: string): void {
    if (this.sharedSaving()) {
      return;
    }

    this.sharedSaving.set(true);
    this.sharedPictureError.set(null);
    const subject = this.subjectUserId();
    const request = subject
      ? this.people.removeSharedPictureForUser(subject, pictureId)
      : this.people.removeSharedPicture(pictureId);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.sharedPictures.update((pictures) =>
          pictures.filter((picture) => picture.id !== pictureId),
        );
        this.sharedSaving.set(false);
      },
      error: (error: unknown) => {
        this.sharedSaving.set(false);
        this.sharedPictureError.set(
          readErrors(error, 'That picture could not be removed. Try again.')[0],
        );
      },
    });
  }

  protected removePicture(): void {
    if (this.pictureSaving() || !this.profilePictureUrl()) {
      return;
    }

    this.pictureSaving.set(true);
    this.pictureErrors.set([]);
    const subject = this.subjectUserId();
    const request = subject
      ? this.people.removePictureForUser(subject)
      : this.people.removePicture();
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (person) => {
        this.profilePictureUrl.set(person.profilePictureUrl ?? '');
        if (this.editingSelf()) {
          this.viewer.notePerson(person);
        }
        this.pictureSaving.set(false);
      },
      error: (error: unknown) => {
        this.pictureSaving.set(false);
        this.pictureErrors.set(
          readErrors(error, 'Your profile picture could not be removed. Try again.'),
        );
      },
    });
  }

  protected openDelete(): void {
    this.deleteError.set(null);
    this.deleteOpen.set(true);
    setTimeout(() => focusFirstField(this.deleteDialog()?.nativeElement));
  }

  protected closeDelete(): void {
    if (this.deleting()) {
      return;
    }
    this.deleteOpen.set(false);
  }

  protected onDeleteKeydown(event: KeyboardEvent): void {
    trapDialogKeydown(event, () => this.closeDelete());
  }

  protected confirmDelete(): void {
    const userId = this.subjectUserId();
    if (!userId || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);
    this.members
      .delete(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.deleteOpen.set(false);
          void this.router.navigateByUrl('/manage');
        },
        error: (error: unknown) => {
          this.deleting.set(false);
          this.deleteError.set(
            readErrors(error, 'This member could not be deleted. Try again.')[0],
          );
        },
      });
  }

  private load(userId: string | null): void {
    this.subjectUserId.set(userId);
    this.loading.set(true);
    this.errors.set([]);
    this.pictureErrors.set([]);
    this.deleteOpen.set(false);
    this.claimLinkError.set(null);
    this.claimCopied.set(false);
    this.claimCopyError.set(null);
    if (!userId) {
      this.claimed.set(null);
      this.claimUrl.set(null);
    }
    const request = ++this.loadRequest;
    let pending = userId ? 2 : 1;
    const finish = (): void => {
      pending -= 1;
      if (pending === 0 && request === this.loadRequest) {
        this.loading.set(false);
      }
    };
    const profile = userId ? this.people.forUser(userId) : this.people.mine();
    profile.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (person) => {
        if (request !== this.loadRequest) {
          return;
        }
        this.apply(person);
        finish();
      },
      error: (error: unknown) => {
        if (request !== this.loadRequest) {
          return;
        }
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return;
        }
        if (error instanceof HttpErrorResponse && error.status === 403) {
          void this.router.navigateByUrl('/');
          return;
        }
        this.applyEmpty();
        finish();
      },
    });
    if (!userId) {
      return;
    }

    this.members
      .status(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          if (request !== this.loadRequest) {
            return;
          }
          this.noteClaimStatus(userId, status.claimed);
          finish();
        },
        error: (error: unknown) => {
          if (request !== this.loadRequest) {
            return;
          }
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }
          this.claimed.set(null);
          finish();
        },
      });
  }

  private noteClaimStatus(userId: string, claimed: boolean): void {
    this.claimed.set(claimed);
    if (claimed) {
      this.claimUrl.set(null);
      this.pendingClaimToken = null;
      return;
    }

    const token = this.pendingClaimToken;
    this.pendingClaimToken = null;
    if (token) {
      this.claimUrl.set(claimAccountUrl(userId, token));
    }
  }

  private apply(person: PersonProfile): void {
    this.firstName.set(person.firstName);
    this.lastName.set(person.lastName);
    this.phone.set(formatPhone(person.phone ?? ''));
    this.email.set(person.email ?? '');
    this.linkedIn.set(person.linkedIn ?? '');
    this.title.set(person.title ?? '');
    this.engineeringType.set(person.engineeringType ?? '');
    this.profilePictureUrl.set(person.profilePictureUrl ?? '');
    this.hasProfile.set(true);
    this.loadSharedPictures();
  }

  private loadSharedPictures(): void {
    const subject = this.subjectUserId();
    const request = subject
      ? this.people.sharedPicturesForUser(subject)
      : this.people.sharedPictures();
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pictures) => {
        this.sharedPictures.set(pictures);
        this.sharedPictureError.set(null);
      },
      error: () => {
        this.sharedPictures.set([]);
        this.sharedPictureError.set('Shared pictures could not be loaded.');
      },
    });
  }

  private applyEmpty(): void {
    this.firstName.set('');
    this.lastName.set('');
    this.phone.set('');
    this.email.set('');
    this.linkedIn.set('');
    this.title.set('');
    this.engineeringType.set('');
    this.profilePictureUrl.set('');
    this.sharedPictures.set([]);
    this.sharedPictureError.set(null);
    this.selectedShared.set([]);
    this.hasProfile.set(false);
  }

  private editingSelf(): boolean {
    const subject = this.subjectUserId();
    if (!subject) {
      return true;
    }
    const self = this.viewer.userId();
    return self !== null && subject === self;
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    if (this.noticeTimer !== null) {
      clearTimeout(this.noticeTimer);
    }
    this.noticeTimer = setTimeout(() => {
      this.notice.set(null);
      this.noticeTimer = null;
    }, 4000);
  }

  protected generateClaimLink(): void {
    const userId = this.subjectUserId();
    if (!userId || this.generatingClaimLink() || this.claimed() === true) {
      return;
    }

    this.generatingClaimLink.set(true);
    this.claimLinkError.set(null);
    this.claimCopied.set(false);
    this.claimCopyError.set(null);
    this.members
      .claimLink(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.claimUrl.set(claimAccountUrl(userId, result.token));
          this.claimed.set(false);
          this.generatingClaimLink.set(false);
        },
        error: (error: unknown) => {
          this.generatingClaimLink.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.claimed.set(true);
            this.claimUrl.set(null);
            this.claimLinkError.set(null);
            return;
          }
          this.claimLinkError.set('The claim link could not be created. Try again.');
        },
      });
  }

  protected copyClaimLink(): void {
    const url = this.claimUrl();
    if (!url) {
      return;
    }

    const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (!writeText) {
      this.copyClaimLinkWithSelection(url);
      return;
    }

    void writeText(url).then(
      () => this.noteClaimCopied(),
      () => this.copyClaimLinkWithSelection(url),
    );
  }

  private noteClaimCopied(): void {
    this.claimCopyError.set(null);
    this.claimCopied.set(true);
  }

  private copyClaimLinkWithSelection(url: string): void {
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (copied) {
      this.noteClaimCopied();
      return;
    }

    this.claimCopied.set(false);
    this.claimCopyError.set('The claim link could not be copied.');
  }

  protected signOut(): void {
    this.viewer.signOut();
    void this.router.navigateByUrl('/');
  }
}

function inputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.value : '';
}

function readErrors(
  error: unknown,
  fallback = 'Your profile could not be saved. Try again.',
): string[] {
  if (error instanceof HttpErrorResponse && error.status === 413) {
    return ['Choose an image that is 5 MB or smaller.'];
  }

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

function readClaimToken(router: Router): string | null {
  const navigation: unknown = router.getCurrentNavigation()?.extras.state;
  const stored: unknown = history.state;
  const token = tokenFrom(navigation) ?? tokenFrom(stored);
  if (token && isRecord(stored)) {
    const next: Record<string, unknown> = { ...stored };
    delete next['claimToken'];
    history.replaceState(next, '');
  }
  return token;
}

function tokenFrom(state: unknown): string | null {
  if (!isRecord(state)) {
    return null;
  }
  const value = state['claimToken'];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
