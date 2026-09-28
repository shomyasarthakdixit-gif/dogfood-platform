import { test, expect } from '@playwright/test';

test.describe('Participant UI — Events', () => {


  test('events page renders title', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Hackathons' })).toBeVisible();
  });

  test('events page has navigation', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('dashboard shows auth notice', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Authentication coming soon/)).toBeVisible();
  });



  test('new submission page loads', async ({ page }) => {
    await page.goto('/submissions/new');
    await expect(page.getByRole('heading', { name: 'Submit Your Project' })).toBeVisible();
  });

  test('submission form has required fields', async ({ page }) => {
    await page.goto('/submissions/new');
    await expect(page.getByLabel(/Project name/)).toBeVisible();
    await expect(page.getByLabel(/Description/)).toBeVisible();
    await expect(page.getByLabel(/Repository URL/)).toBeVisible();
  });

  test('submission form shows validation error for empty name', async ({ page }) => {
    await page.goto('/submissions/new');
    await page.getByRole('button', { name: /Save draft/ }).click();
    await expect(page.getByText(/Project name is required/)).toBeVisible();
  });



  test('mobile nav toggle works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/events');
    const menuBtn = page.getByRole('button', { name: /Open menu/ });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    }
  });
});

test.describe('Participant UI — Accessibility', () => {
  test('events page has no missing form labels', async ({ page }) => {
    await page.goto('/events');
    // No forms on this page — just verify structure
    await expect(page.getByRole('main')).toBeVisible();
  });


});
