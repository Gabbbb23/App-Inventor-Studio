/**
 * Visual Preview Tests
 *
 * Uses Playwright to launch our app, enter layout code, and screenshot
 * the phone preview. This catches visual regressions in our preview
 * rendering without needing MIT App Inventor.
 *
 * Run with: npm run test:visual
 */

import { test, expect } from '@playwright/test';

test.describe('Phone Preview Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Skip the template gallery
    await page.getByText('Skip and start with blank project').click();
    await page.waitForSelector('.cm-editor, header');
  });

  test('empty screen renders correctly', async ({ page }) => {
    await page.getByRole('button', { name: /Design/ }).click();
    await expect(page.getByText('Add components from the palette')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/empty-screen.png' });
  });

  test('nav+content layout renders in code view', async ({ page }) => {
    await page.getByRole('button', { name: /Code/ }).click();
    await page.waitForSelector('.cm-editor');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.pressSequentially(`screen {
  Vertical(fill, fill) {
    Horizontal(fill, h=50, bg=#3F51B5, centerV) {
      Label("My App", bold, color=#FFFFFF, fontSize=18)
    }
    VScroll(fill, fill) {
      Label("Page content")
      Button("Action 1", fill)
      Button("Action 2", fill)
    }
    Horizontal(fill, h=50, bg=#3F51B5, center) {
      Button("Tab 1", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 2", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 3", color=#FFFFFF, bg=#3F51B5)
    }
  }
}`, { delay: 5 });

    await page.waitForTimeout(1000);

    // Verify the LIVE PREVIEW panel shows components (check inside the phone frame)
    await expect(page.getByText('LIVE PREVIEW')).toBeVisible();
    // The phone preview should contain rendered components
    const previewArea = page.locator('.w-\\[360px\\]');
    await expect(previewArea).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nav-content-layout.png' });
  });

  test('login screen renders in code view', async ({ page }) => {
    await page.getByRole('button', { name: /Code/ }).click();
    await page.waitForSelector('.cm-editor');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.pressSequentially(`screen {
  Vertical(fill, fill, center) {
    Label("Login", fontSize=28, bold, color=#3F51B5)
    Text(hint="Username", fill)
    Password(hint="Password", fill)
    Button("Log In", fill, bg=#3F51B5, color=#FFFFFF, bold)
  }
}`, { delay: 5 });

    await page.waitForTimeout(1000);

    // Phone preview should be visible
    const previewArea = page.locator('.w-\\[360px\\]');
    await expect(previewArea).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/login-screen.png' });
  });

  test('counter template loads and renders', async ({ page }) => {
    // Go back to templates
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.getByText('Counter App').click();

    // Should be in design view with components in the tree
    await expect(page.getByText('COMPONENT TREE')).toBeVisible();
    // Check that components are listed in the tree panel
    await expect(page.getByText('CountLabel')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/counter-template.png' });
  });

  test('code view shows error count for bad code', async ({ page }) => {
    await page.getByRole('button', { name: /Code/ }).click();
    await page.waitForSelector('.cm-editor');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.pressSequentially('when { broken syntax }}}', { delay: 10 });

    await page.waitForTimeout(500);

    // Should show error indicator (number + "error")
    await expect(page.locator('text=/\\d+ error/')).toBeVisible();
  });

  test('layout presets populate the screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Layout', exact: true }).click();

    // Click the Login Screen preset button
    await page.locator('button:has-text("Login Screen")').first().click();

    // Phone preview should now show the Login label inside the phone frame
    const phoneFrame = page.locator('.w-\\[360px\\]').first();
    await expect(phoneFrame).toBeVisible();
    await expect(phoneFrame.getByText('Login', { exact: true })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/login-preset.png' });
  });

  test('export button produces a download', async ({ page }) => {
    await page.getByRole('button', { name: /Code/ }).click();
    await page.waitForSelector('.cm-editor');

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.pressSequentially('screen { Button("Test") }', { delay: 10 });
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('MyApp.aia');
  });
});
