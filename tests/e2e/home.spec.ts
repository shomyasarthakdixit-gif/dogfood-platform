import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Dogfood Platform/);
});

test('health endpoint works', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  
  const body = await response.json();
  expect(body.status).toBe('ok');
});
