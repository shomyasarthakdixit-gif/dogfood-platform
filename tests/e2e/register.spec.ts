import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {

  test('User can register and login successfully', async ({ page }) => {
    // 1. Landing
    await page.goto('/');

    // 2. Click Register
    await page.getByRole('link', { name: 'Register' }).click();

    // 3. /register loads successfully
    await page.waitForURL('**/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // Generate unique email to avoid duplicate test failure
    const randomStr = Math.random().toString(36).substring(7);
    const testEmail = `newuser_${randomStr}@dogfood.local`;
    
    // 4. Fill registration form
    await page.fill('input[type="text"]', 'New User');
    await page.fill('input[type="email"]', testEmail);
    // password and confirm password are both type password but order matters. Let's use labels.
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password123');

    // 5. Submit
    await page.click('button[type="submit"]');

    // 6. Login page / expected success state
    await page.waitForURL('**/login?registered=1');
    await expect(page.getByText('Account created successfully. Please sign in.')).toBeVisible();

    // 7. Login
    await page.fill('input[type="email"]', testEmail);
    // There are 2 inputs matching 'password' if we use the same type. Let's use getByLabel.
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');

    // 8. Dashboard
    await page.waitForURL('**/dashboard');
    // Ensure the new user sees their name
    await expect(page.getByText(/Welcome back, New User/)).toBeVisible();
    
    // Ensure they do NOT see organizer controls
    await expect(page.getByRole('link', { name: 'Manage Events' })).not.toBeVisible();
  });

  test('Password mismatch prevents registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[type="text"]', 'Mismatch User');
    await page.fill('input[type="email"]', 'mismatch@dogfood.local');
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password456');

    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    
    // URL should not change
    expect(page.url()).toContain('/register');
  });
  
  test('Authenticated user is redirected to dashboard when visiting /register', async ({ page }) => {
    // Login as a participant
    await page.goto('/login');
    await page.fill('input[type="email"]', 'participant1@dogfood.local');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Now try to visit register
    await page.goto('/register');
    
    // Should immediately redirect back to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

});
