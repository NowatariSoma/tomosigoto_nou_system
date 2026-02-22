import { Page, expect } from '@playwright/test';

/**
 * 指定パスにナビゲートし、ネットワークが安定するまで待機する
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * ページのネットワークアイドル状態を待機する
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * 指定パスにリダイレクトされたことを検証する
 */
export async function expectRedirectTo(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}
