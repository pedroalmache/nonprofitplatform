import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProjectPage } from './project-page';

async function setup(slug: string): Promise<ComponentFixture<ProjectPage>> {
  await TestBed.configureTestingModule({
    imports: [ProjectPage],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: convertToParamMap({ slug }) },
          paramMap: of(convertToParamMap({ slug })),
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ProjectPage);
  fixture.detectChanges();
  return fixture;
}

describe('ProjectPage', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('marks Ecuador completed and keeps the source update', async () => {
    const compiled = (await setup('ecuador-el-muyuyo')).nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('El Muyuyo, Ecuador');
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('.status-mark')?.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('July 2023');
    expect(compiled.textContent).toContain('currently vetting multiple alternatives');
  });

  it('marks Guatemala and Erangau in progress and keeps source spellings', async () => {
    const guatemala = (await setup('guatemala-rio-chixoy')).nativeElement as HTMLElement;
    expect(guatemala.querySelector('.status-mark')?.textContent).toContain('Currently in progress');
    expect(guatemala.textContent).toContain('November 2025');
    expect(guatemala.textContent).toContain('EWB-SVB');

    TestBed.resetTestingModule();
    const erangau = (await setup('tanzania-erangau')).nativeElement as HTMLElement;
    expect(erangau.querySelector('.status-mark')?.textContent).toContain('Currently in progress');
    expect(erangau.textContent).toContain('February - May 2025');
    expect(erangau.textContent).toContain('Erengau');
    expect(erangau.textContent).toContain('Rangau');
    expect(erangau.textContent).toContain('Olmolti');
  });

  it('leaves the Olmoti update date empty and marks the project completed', async () => {
    const compiled = (await setup('tanzania-olmoti')).nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-mark')?.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('initiated in 2013');
    const dateValue = compiled.querySelector('.update-date-value');
    expect(dateValue?.textContent?.trim()).toBe('');
  });

  it('shows a carousel control only when a project has more than one photograph', async () => {
    const compiled = (await setup('guatemala-rio-chixoy')).nativeElement as HTMLElement;
    expect(compiled.querySelector('.carousel-controls')).toBeTruthy();
    expect(compiled.textContent).toContain('of 3');
    expect(compiled.querySelector('.photo-carousel img')?.getAttribute('src')).toContain(
      'chixoy-hillside-gathering.webp',
    );
    expect(compiled.querySelector('.project-map img')?.getAttribute('src')).toContain(
      'chixoy-guatemala-map.webp',
    );
  });

  it('keeps each location map on the page and out of the first slideshow photograph', async () => {
    const cases = [
      ['guatemala-rio-chixoy', 'chixoy-guatemala-map.webp', 'chixoy-hillside-gathering.webp'],
      ['tanzania-erangau', 'erangau-vicinity-map.webp', 'erangau-roadside-trench.webp'],
      ['ecuador-el-muyuyo', 'el-muyuyo-ecuador-map.webp', 'el-muyuyo-water-containers.webp'],
      ['tanzania-olmoti', 'olmoti-vicinity-map.webp', 'olmoti-community-portrait.webp'],
    ] as const;

    for (const [slug, mapFile, firstSlide] of cases) {
      const compiled = (await setup(slug)).nativeElement as HTMLElement;
      const slideshow = compiled.querySelector('.photo-carousel img')?.getAttribute('src');
      expect(slideshow).toContain(firstSlide);
      expect(slideshow).not.toContain(mapFile);
      expect(compiled.querySelector('.project-map img')?.getAttribute('src')).toContain(mapFile);
      TestBed.resetTestingModule();
    }
  });
});
