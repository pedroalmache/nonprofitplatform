import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the home component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the primary h1 headline', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Engineering Clean Water Alongside Communities Worldwide.');
  });

  it('should have exactly one h1 element on the page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1Elements = compiled.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should toggle mobile menu state', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuToggle = compiled.querySelector('.mobile-menu-toggle') as HTMLButtonElement | null;
    expect(menuToggle).toBeTruthy();

    // Initially closed
    expect(menuToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(compiled.querySelector('.mobile-drawer')).toBeNull();

    // Click to open
    menuToggle?.click();
    fixture.detectChanges();

    expect(menuToggle?.getAttribute('aria-expanded')).toBe('true');
    expect(compiled.querySelector('.mobile-drawer')).toBeTruthy();

    // Click to close
    menuToggle?.click();
    fixture.detectChanges();

    expect(menuToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(compiled.querySelector('.mobile-drawer')).toBeNull();
  });

  it('should include all required semantic landmarks', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header.site-header')).toBeTruthy();
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('footer.site-footer')).toBeTruthy();
    expect(compiled.querySelector('nav.desktop-nav')).toBeTruthy();
  });

  it('links Sign in to the client login page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuToggle = compiled.querySelector('.mobile-menu-toggle') as HTMLButtonElement;
    menuToggle.click();
    fixture.detectChanges();

    const signInLinks = [...compiled.querySelectorAll('a')].filter(
      (link) => link.textContent?.trim() === 'Sign in',
    );
    expect(signInLinks.length).toBe(2);
    expect(signInLinks.every((link) => link.getAttribute('href') === '/login')).toBe(true);
  });

  it('links Where We Stand and shows project statuses', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const standLink = [...compiled.querySelectorAll('a')].find(
      (link) => link.textContent?.trim() === 'Where We Stand',
    );
    expect(standLink?.getAttribute('href')).toBe('/where-we-stand');
    expect(compiled.textContent).toContain('Currently in progress');
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('Planned');
    expect(compiled.textContent).toContain('El Muyuyo, Ecuador');
  });

  it('should include current expeditions for Tanzania and Guatemala', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const expeditionSection = compiled.querySelector('#expeditions');
    expect(expeditionSection).toBeTruthy();
    expect(expeditionSection?.textContent).toContain('Tanzania');
    expect(expeditionSection?.textContent).toContain('Guatemala');
  });

  it('should render correct official social media links in the footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const instagramLink = compiled.querySelector('a[aria-label="Follow EWB-SBV on Instagram"]');
    const facebookLink = compiled.querySelector('a[aria-label="Follow EWB-SBV on Facebook"]');
    const twitterLink = compiled.querySelector(
      'a[aria-label="Follow EWB-SBV on X (formerly Twitter)"]',
    );

    expect(instagramLink?.getAttribute('href')).toBe('https://www.instagram.com/ewbsbv/');
    expect(instagramLink?.getAttribute('target')).toBe('_blank');
    expect(instagramLink?.getAttribute('rel')).toBe('noopener noreferrer');

    expect(facebookLink?.getAttribute('href')).toBe('https://www.facebook.com/ewbsbvchapter/');
    expect(facebookLink?.getAttribute('target')).toBe('_blank');
    expect(facebookLink?.getAttribute('rel')).toBe('noopener noreferrer');

    expect(twitterLink?.getAttribute('href')).toBe('https://x.com/EWBSBV');
    expect(twitterLink?.getAttribute('target')).toBe('_blank');
    expect(twitterLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
