import { test, expect } from '@playwright/test';

test.describe('Authentication Dashboard Flows', () => {

  test('CASE 1: Unauthenticated user opens /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Expected: Stays on /dashboard
    await page.waitForURL('**/dashboard*');
    // Navbar = Sign In/Register
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    // No authenticated user identity displayed
    await expect(page.getByText('Welcome back,')).not.toBeVisible();
    // Should show the unauthenticated prompt
    await expect(page.getByText('Please log in to manage your submissions.')).toBeVisible();
  });

  test('CASE 2: Authenticated ADMIN opens /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    // Navbar reflects authenticated state
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    // Dashboard displays actual authenticated user identity
    await expect(page.getByText(/Welcome back, .* \(ADMIN\)/)).toBeVisible();
  });

  test('CASE 3: Authenticated ORGANIZER opens /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'organizer@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    // Actual organizer identity/role
    await expect(page.getByText('Welcome back, Demo Organizer! (Organizer)')).toBeVisible();
  });

  test('CASE 4: Authenticated user logs out', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'organizer@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login*');

    // Expected: Navbar becomes unauthenticated. 
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    // Dashboard cannot retain old user identity
    await expect(page.getByText('Welcome back,')).not.toBeVisible();
  });

  test('CASE 5: Logout → browser Back', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'organizer@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login*');

    // Logout -> Browser Back
    await page.goBack();
    
    // Expected: No authenticated user information is exposed
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Welcome back,')).not.toBeVisible();
  });

  test('CASE 6: Login → dashboard → refresh', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'organizer@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Refresh
    await page.reload();
    
    // Expected: Authentication state remains correct
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Welcome back, Demo Organizer! (Organizer)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('CASE 7: Open /dashboard directly in a fresh browser context', async ({ browser }) => {
    const context = await browser.newContext();
    const freshPage = await context.newPage();
    
    await freshPage.goto('/dashboard');
    
    // Expected: Stays on /dashboard
    await freshPage.waitForURL('**/dashboard*');
    await expect(freshPage.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(freshPage.getByText('Welcome back,')).not.toBeVisible();
    await expect(freshPage.getByText('Please log in to manage your submissions.')).toBeVisible();
    
    await context.close();
  });
});
