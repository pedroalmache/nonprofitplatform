import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WhereWeStand } from './where-we-stand';

describe('WhereWeStand', () => {
  let fixture: ComponentFixture<WhereWeStand>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhereWeStand],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
    fixture = TestBed.createComponent(WhereWeStand);
    fixture.detectChanges();
  });

  it('groups projects into the three statuses and leaves planned empty', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Where We Stand');
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    const text = compiled.textContent ?? '';
    expect(text).toContain('Currently in progress');
    expect(text).toContain('Planned');
    expect(text).toContain('Completed');
    expect(text).toContain('No projects are currently in this category.');
    expect(text).toContain('Guatemala - Río Chixoy');
    expect(text).toContain('Tanzania - Erangau');
    expect(text).toContain('El Muyuyo, Ecuador');
    expect(text).toContain('Tanzania - Olmoti');

    const progress = compiled.querySelector('#status-in-progress')?.parentElement;
    expect(progress?.textContent).toContain('Guatemala - Río Chixoy');
    expect(progress?.textContent).toContain('Tanzania - Erangau');
    expect(progress?.textContent).not.toContain('El Muyuyo');

    const completed = compiled.querySelector('#status-completed')?.parentElement;
    expect(completed?.textContent).toContain('El Muyuyo, Ecuador');
    expect(completed?.textContent).toContain('Tanzania - Olmoti');
    expect(completed?.textContent).not.toContain('Erangau');
  });

  it('uses the chosen slideshow photograph for each project card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const sources = [...compiled.querySelectorAll('.project-row img')].map((img) =>
      img.getAttribute('src'),
    );
    expect(sources).toEqual([
      'images/projects/guatemala-chixoy/chixoy-hillside-gathering.webp',
      'images/projects/tanzania-erangau/erangau-trench-inspection.webp',
      'images/projects/ecuador-el-muyuyo/el-muyuyo-water-containers.webp',
      'images/projects/tanzania-olmoti/olmoti-community-portrait.webp',
    ]);
  });
});
