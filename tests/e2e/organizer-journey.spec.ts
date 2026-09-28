import { test, expect } from '@playwright/test';

test.describe('Organizer Journey', () => {
  test('Organizer can manage events', async ({ page }) => {
    // Login as organizer
    await page.goto('/login');
    await page.fill('input[id="email"]', 'organizer@dogfood.local');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Dashboard should have Manage Events button instead of Submit Project
    await expect(page.locator('a:has-text("Manage Events →")')).toBeVisible();
    await page.click('a:has-text("Manage Events →")');

    // Should redirect to /organizer/events
    await expect(page).toHaveURL('/organizer/events');
    await expect(page.locator('h1')).toHaveText('Manage Events');

    // Should see at least one event managed by organizer
    // Click on the first "Manage →" button
    await page.click('a:has-text("Manage →")');

    // Now inside event management page
    await expect(page.locator('h2:has-text("Lifecycle & Dates")')).toBeVisible();
    await expect(page.locator('h2:has-text("Tracks")')).toBeVisible();
    await expect(page.locator('h2:has-text("Prizes")')).toBeVisible();

    // Check that we can add a track
    await page.fill('input[placeholder="Track Name"]', 'E2E Track');
    await page.fill('input[placeholder="Description"]', 'E2E Description');
    await page.click('button:has-text("Add Track")');

    // Alert appears, accept it
    page.once('dialog', dialog => dialog.accept());

    // Check track appears in list
    await expect(page.locator('li:has-text("E2E Track")')).toBeVisible();

    // Check that we can update event status
    await page.selectOption('select[name="status"]', 'REGISTRATION');
    
    // We mock dialogs to automatically accept them
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Updates")');
  });
});
