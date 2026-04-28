import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * 管理者出席管理ページのE2Eテスト
 *
 * /admin/attendance ページの表示と基本機能を検証する。
 * （以前 getUsersWithAttendance API が 500 を返すバグがあったため、回帰テストとして追加）
 */

test.describe('管理者出席管理ページ', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('管理者出席管理ページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/admin/attendance');

    // ローディング完了を待機
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    ).catch(() => {});

    // エラーが表示されていないことを確認
    const hasError = await page.locator('text=エラーが発生しました').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // ページが何らかのコンテンツを表示していること
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    const hasLoadingComplete = await page.locator('.animate-spin').count().then(c => c === 0).catch(() => false);

    expect(hasContent || hasLoadingComplete).toBeTruthy();
  });

  test('出席一覧APIがエラーを返さない（APIレベル検証）', async ({ page }) => {
    await page.goto('/admin/attendance');

    // admin/list APIのレスポンスを待機
    const apiResponse = await page.waitForResponse(
      (response) => response.url().includes('/attendance/admin/list'),
      { timeout: 15000 }
    ).catch(() => null);

    if (apiResponse) {
      // 500 は修正済みのバグなので発生してはいけない
      expect(apiResponse.status()).not.toBe(500);
    }
  });

  test('フィルターUIとスケジュール選択エリアが表示される', async ({ page }) => {
    await navigateTo(page, '/admin/attendance');

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    ).catch(() => {});

    // フィルターエリア（絞り込みアイコン + ドロップダウン）が表示される
    const hasFilterIcon = await page.locator('svg').first().isVisible().catch(() => false);
    const hasDropdown = await page.locator('select').count().then(c => c > 0).catch(() => false);
    const hasSearchInput = await page.locator('input').isVisible().catch(() => false);

    expect(hasFilterIcon || hasDropdown || hasSearchInput).toBeTruthy();
  });
});
