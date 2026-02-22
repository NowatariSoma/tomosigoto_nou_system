import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * お気に入り資料ページのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. お気に入りページへのナビゲーション
 * 2. お気に入りリストのレンダリング
 */

test.describe('お気に入り資料ページ', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('お気に入りページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/materials/favorites');

    // ページタイトルが表示される
    await expect(page.locator('h1', { hasText: 'お気に入り動画' })).toBeVisible({ timeout: 10000 });
  });

  test('お気に入りページのヘッダーが正しく表示される', async ({ page }) => {
    await navigateTo(page, '/materials/favorites');

    // メインタイトルが表示される
    await expect(page.locator('h1', { hasText: 'お気に入り動画' })).toBeVisible({ timeout: 10000 });

    // 「舞台一覧に戻る」ボタンが表示される
    await expect(page.locator('button', { hasText: '舞台一覧に戻る' })).toBeVisible();
  });

  test('お気に入りリストがレンダリングされる', async ({ page }) => {
    await navigateTo(page, '/materials/favorites');
    await page.waitForSelector('h1:has-text("お気に入り動画")', { timeout: 10000 });

    // 読み込み完了を待機（「読み込み中...」が消えるのを待つ）
    await page.waitForFunction(
      () => !document.querySelector('p')?.textContent?.includes('読み込み中'),
      { timeout: 10000 }
    ).catch(() => {
      // タイムアウトしても続行
    });

    // 以下のいずれかが表示されることを確認
    // 1. お気に入り動画のカード
    // 2. 「お気に入り動画がありません」のメッセージ
    // 3. 検索結果セクション
    const hasCards = await page.locator('.grid > *').first().isVisible().catch(() => false);
    const hasEmptyMessage = await page.locator('text=お気に入り動画がありません').isVisible().catch(() => false);
    const hasSearchResults = await page.locator('text=/検索結果/').isVisible().catch(() => false);

    expect(hasCards || hasEmptyMessage || hasSearchResults).toBeTruthy();
  });

  test('お気に入りページに検索フィールドが表示される', async ({ page }) => {
    await navigateTo(page, '/materials/favorites');
    await page.waitForSelector('h1:has-text("お気に入り動画")', { timeout: 10000 });

    // 検索入力フィールドを確認
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('「舞台一覧に戻る」ボタンで資料一覧に戻れる', async ({ page }) => {
    await navigateTo(page, '/materials/favorites');
    await page.waitForSelector('h1:has-text("お気に入り動画")', { timeout: 10000 });

    // 「舞台一覧に戻る」ボタンをクリック
    const backButton = page.locator('button', { hasText: '舞台一覧に戻る' });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // 資料一覧ページに遷移したことを確認
    await expect(page).toHaveURL(/\/materials$/, { timeout: 5000 });
  });
});
