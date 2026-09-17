import { expect, test } from '@playwright/test';

test('edits a preset and completes playback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Balanced weekday' })).toBeVisible();
  await page.getByLabel('Driver 1 name').fill('Maya Chen');
  await expect(page.getByRole('heading', { name: 'Balanced weekday' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText('All covered')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('cell', { name: 'Maya Chen' }).first()).toBeVisible();
});
