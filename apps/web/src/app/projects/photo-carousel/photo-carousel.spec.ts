import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoCarousel, SLIDE_INTERVAL_MS } from './photo-carousel';
import type { ProjectPhoto } from '../project-data';

const onePhoto: ProjectPhoto = {
  src: 'images/one.webp',
  alt: 'Only photograph',
  width: 800,
  height: 600,
};

const twoPhotos: readonly ProjectPhoto[] = [
  onePhoto,
  { src: 'images/two.webp', alt: 'Second photograph', width: 800, height: 600 },
];

describe('PhotoCarousel', () => {
  let fixture: ComponentFixture<PhotoCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoCarousel],
    }).compileComponents();
    fixture = TestBed.createComponent(PhotoCarousel);
  });

  it('shows a single photograph without slideshow controls', () => {
    fixture.componentRef.setInput('photos', [onePhoto]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('img')?.getAttribute('alt')).toBe('Only photograph');
    expect(compiled.querySelector('.carousel-controls')).toBeNull();
  });

  it('moves to the next photograph when Next is activated', () => {
    fixture.componentRef.setInput('photos', twoPhotos);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const next = [...compiled.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Next'),
    );
    next?.click();
    fixture.detectChanges();
    expect(currentAlt(compiled)).toBe('Second photograph');
    expect(compiled.textContent).toContain('2 of 2');
  });

  it('advances automatically until paused', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('photos', twoPhotos);
    fixture.detectChanges();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(currentAlt(compiled)).toBe('Second photograph');

    const pause = [...compiled.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Pause'),
    );
    pause?.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    fixture.detectChanges();
    expect(currentAlt(compiled)).toBe('Second photograph');
    vi.useRealTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });
});

/** The incoming photograph stays in the frame; a leaving slide can still be fading out. */
function currentAlt(root: HTMLElement): string | null {
  const images = [...root.querySelectorAll('img')];
  const incoming = images.find((img) => !img.classList.contains('slide-leave'));
  return (incoming ?? images.at(-1))?.getAttribute('alt') ?? null;
}
