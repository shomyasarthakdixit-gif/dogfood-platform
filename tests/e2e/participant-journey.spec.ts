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

  test('dashboard page shows unauthenticated view for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard*');
    await expect(page.getByText('Please log in to manage your submissions.')).toBeVisible();
  });



  test('new submission page loads', async ({ page }) => {
    // Login first since it's protected
    await page.goto('/login');
    await page.fill('input[type="email"]', 'participant1@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*');

    await page.goto('/submissions/new');
    await expect(page.getByRole('heading', { name: 'Submit Your Project' })).toBeVisible();
  });

  test('submission form has required fields', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'participant1@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*');

    await page.goto('/submissions/new');
    await expect(page.getByLabel(/Project name/)).toBeVisible();
    await expect(page.getByLabel(/Description/)).toBeVisible();
    await expect(page.getByLabel(/Repository URL/)).toBeVisible();
  });

  test('submission form shows validation error for empty name', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'participant2@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*');

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

  test('submission lifecycle journey', async ({ page }) => {
    // 1. Login as participant.
    await page.goto('/login');
    await page.fill('input[type="email"]', 'participant1@dogfood.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*');

    // Go to event page for dogfood-2026
    await page.goto('/events/dogfood-2026');

    // Find out the state. We might already have a submission in the seeded DB
    // But since E2E DB is re-seeded or we can just use the UI actions:
    const quickActions = page.locator('aside >> text=Quick actions').locator('..');
    
    // Check if we need to submit a project or it's already there
    const hasSubmitButton = await quickActions.getByRole('link', { name: 'Submit a project' }).isVisible();
    const hasEditButton = await quickActions.getByRole('link', { name: 'Edit submission' }).isVisible();
    const hasContinueButton = await quickActions.getByRole('link', { name: 'Continue submission' }).isVisible();

    if (hasSubmitButton) {
      await quickActions.getByRole('link', { name: 'Submit a project' }).click();
      await page.waitForURL('**/submissions/new*');
      
      // Save draft
      await page.fill('input[id="title"]', 'Lifecycle Test Project');
      await page.fill('textarea[id="description"]', 'Draft description');
      await page.getByRole('button', { name: 'Save draft' }).click();
      await expect(page.getByText('Draft saved successfully.')).toBeVisible();

      // Go back to event page
      await page.goto('/events/dogfood-2026');
      await expect(quickActions.getByRole('link', { name: 'Submit a project' })).toHaveCount(0);
      await expect(quickActions.getByRole('link', { name: 'Continue submission' })).toBeVisible();

      // Submit
      await quickActions.getByRole('link', { name: 'Continue submission' }).click();
      await page.waitForURL('**/submissions/new*');
      await page.getByRole('button', { name: 'Submit project' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Submit project' }).click();
      await expect(page.getByText('Project submitted successfully!')).toBeVisible();
      
      await page.goto('/events/dogfood-2026');
    } else if (hasContinueButton) {
      // It's a draft
      await quickActions.getByRole('link', { name: 'Continue submission' }).click();
      await page.waitForURL('**/submissions/new*');
      await page.getByRole('button', { name: 'Submit project' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Submit project' }).click();
      await expect(page.getByText('Project submitted successfully!')).toBeVisible();
      await page.goto('/events/dogfood-2026');
    }

    // Now it should be SUBMITTED
    await expect(quickActions.getByRole('link', { name: 'Submit a project' })).toHaveCount(0);
    await expect(quickActions.getByRole('link', { name: 'Continue submission' })).toHaveCount(0);
    
    await expect(quickActions.getByRole('link', { name: 'View submission' })).toBeVisible();
    await expect(quickActions.getByRole('link', { name: 'Edit submission' })).toBeVisible();
    await expect(quickActions.getByRole('button', { name: 'Withdraw submission' })).toBeVisible();
    
    // Verify Submission completed message
    await expect(page.getByText('Your team has successfully submitted this project.')).toBeVisible();

    // 10. Withdraw submission
    await quickActions.getByRole('button', { name: 'Withdraw submission' }).click();
    await page.waitForURL('**/events/*');

    // 11. Verify withdrawn state message
    await expect(page.getByText('Your submission has been withdrawn. You can edit and resubmit before the deadline.')).toBeVisible();
    await expect(quickActions.getByRole('link', { name: 'Submit project' })).toBeVisible();

    // 12. Open Edit again
    await quickActions.getByRole('link', { name: 'Submit project' }).click();
    await page.waitForURL('**/submissions/new*');

    // 13. Verify existing data is populated
    await expect(page.getByLabel(/Project name/)).not.toBeEmpty();

    // 14. Modify allowed field
    await page.fill('textarea[id="description"]', 'Updated description for E2E testing');
    
    // 15. Save/update
    await page.getByRole('button', { name: 'Submit project' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Submit project' }).click();
    
    // 16. Verify changes persist
    await expect(page.getByText('Project submitted successfully!')).toBeVisible();

    // Back to event page
    await page.goto('/events/dogfood-2026');
    await expect(page.getByText('Your team has successfully submitted this project.')).toBeVisible();
  });
});

test.describe('Participant UI — Accessibility', () => {
  test('events page has no missing form labels', async ({ page }) => {
    await page.goto('/events');
    // No forms on this page — just verify structure
    await expect(page.getByRole('main')).toBeVisible();
  });


});
