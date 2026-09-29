import { test, expect } from '@playwright/test';

test.describe('Logout and BFCache Security', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Logged-out user cannot use browser Back button to access protected page', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('#email', 'organizer@dogfood.local');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Dashboard').first()).toBeVisible();

    // 2. Go to Organizer Events (another protected page)
    await page.click('text=Manage Events');
    await page.waitForURL('/organizer/events');
    await expect(page.locator('h1', { hasText: 'Manage Events' })).toBeVisible();

    // 3. Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login*');
    await expect(page.locator('text=Sign In').first()).toBeVisible();

    // Verify API returns 401
    const apiRes = await page.request.get('/api/auth/me');
    expect(apiRes.status()).toBe(401);

    // 4. Press browser Back button
    // 4. Press browser Back button
    // Because we used window.location.replace('/login'), /organizer/events is replaced.
    // The previous page in history is /dashboard, which is now public but unauthenticated.
    await page.goBack();
    await expect(page.locator('text=Welcome back')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('text=Please log in')).toBeVisible();

    // 5. Press browser Forward button (would go to /login again)
    await page.goForward();
    await page.waitForURL('**/login*');

    // 6. Direct URL navigation to protected page
    try {
      await page.goto('/organizer/events');
    } catch (e) {
      // Ignored: Next.js redirects to /login which can interrupt the initial goto
    }
    await page.waitForURL('**/login*');
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('Logout uses replace navigation', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('#email', 'organizer@dogfood.local');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 2. Go to a public page
    await page.goto('/events');
    await expect(page.locator('text=Sign In')).toHaveCount(0);

    // 3. Click Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login*');

    // 4. Go back. It should skip the page where we clicked logout if replace was used.
    // window.location.replace('/login') replaces /events with /login.
    // If we go back, we should end up on /dashboard.
    await page.goBack();
    
    // /dashboard is now public but unauthenticated, so it should not show user data
    await expect(page.locator('text=Welcome back')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('text=Please log in')).toBeVisible();
  });

  test('Protected pages use no-store Cache-Control', async ({ request }) => {
    // Login to get a cookie
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'organizer@dogfood.local', password: 'password123' },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Fetch protected page
    const res = await request.get('/organizer/events');
    const cacheControl = res.headers()['cache-control'];
    
    // Next.js dynamic routes use no-store or no-cache, must-revalidate
    expect(cacheControl).toMatch(/(no-store|no-cache)/);
  });
});
