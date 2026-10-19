import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('EWB-SBV Homepage & Infrastructure Suite', () => {
  test('renders application root without uncaught console or page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    await page.goto('/');

    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();

    expect(consoleErrors, `Uncaught console errors: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.map((e) => e.message).join(', ')}`).toEqual([]);
  });

  test('renders exactly one h1 with the approved headline', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Engineering Clean Water Alongside Communities Worldwide.');
  });

  test('renders primary semantic landmarks and navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeVisible();

    // Skip link should exist and point to main-content
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('renders without horizontal overflow at current viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(
      hasHorizontalOverflow,
      'Page has horizontal overflow (scrollWidth > innerWidth)'
    ).toBe(false);
  });

  test('passes automated accessibility audit with zero WCAG 2.1 AA violations', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();

    // Full unconstrained audit for WCAG 2.1 AA standards
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      accessibilityScanResults.violations,
      `Found accessibility violations: ${JSON.stringify(accessibilityScanResults.violations, null, 2)}`
    ).toEqual([]);
  });

  test('renders both current expeditions with authentic documentary imagery', async ({ page }) => {
    await page.goto('/');

    const expeditionsSection = page.locator('#expeditions');
    await expect(expeditionsSection).toBeVisible();

    await expect(expeditionsSection.getByRole('heading', { name: /Erangau.*Water Supply/i })).toBeVisible();
    await expect(expeditionsSection.getByRole('heading', { name: /Río Chixoy.*Water Supply/i })).toBeVisible();

    // Check images are loaded
    const tanzaniaImg = expeditionsSection.locator('img[src*="erangau-tap-stand-community.jpg"]');
    await expect(tanzaniaImg).toBeVisible();

    const guatemalaImg = expeditionsSection.locator('img[src*="chixoy-river-valley.jpg"]');
    await expect(guatemalaImg).toBeVisible();
  });

  test('renders corrected hero caption and official donation links', async ({ page }) => {
    await page.goto('/');

    const heroCaption = page.locator('.hero-figure figcaption');
    await expect(heroCaption).toBeVisible();
    await expect(heroCaption).toContainText(
      'Erangau, Tanzania'
    );
    await expect(heroCaption).toContainText(
      'EWB-SBV volunteers with members of the Erangau community during the water supply project.'
    );

    // Verify official donation campaign URL on donation CTAs
    const donationUrl =
      'https://support.ewb-usa.org/campaign/santa-barbara-ventura-professional-chapter/c83736';
    const donationLinks = page.locator(`a[href="${donationUrl}"]`);
    const count = await donationLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const link = donationLinks.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toContainText('Donate');
    }
  });

  test('renders verified official social media links in the footer', async ({ page }) => {
    await page.goto('/');

    const expectedSocials = [
      {
        label: 'Follow EWB-SBV on Instagram',
        href: 'https://www.instagram.com/ewbsbv/',
      },
      {
        label: 'Follow EWB-SBV on Facebook',
        href: 'https://www.facebook.com/ewbsbvchapter/',
      },
      {
        label: 'Follow EWB-SBV on X (formerly Twitter)',
        href: 'https://x.com/EWBSBV',
      },
    ];

    for (const social of expectedSocials) {
      const link = page.locator(`a[aria-label="${social.label}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', social.href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        link.click(),
      ]);
      expect(popup).toBeTruthy();
      // Check popup URL matches or begins with target destination
      const popupUrl = popup.url();
      const targetHost = new URL(social.href).host;
      expect(popupUrl.includes(targetHost) || popupUrl === social.href || popupUrl === 'about:blank').toBe(true);
      await popup.close();
    }
  });
});

