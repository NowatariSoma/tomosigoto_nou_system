import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * 資料一覧ページのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. 資料ページへのナビゲーション
 * 2. プレイリストカードの表示
 * 3. 検索・フィルター機能
 */

test.describe('資料一覧ページ', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('資料ページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/materials');

    // ページタイトルが表示される
    await expect(page.locator('text=youtubeプレイリスト')).toBeVisible({ timeout: 10000 });
  });

  test('ページヘッダーが正しく表示される', async ({ page }) => {
    await navigateTo(page, '/materials');

    // メインタイトルが表示される
    await expect(page.locator('h1', { hasText: 'youtubeプレイリスト' })).toBeVisible({ timeout: 10000 });

    // 編集ボタンが表示される
    await expect(page.locator('button', { hasText: '編集' })).toBeVisible();

    // お気に入りボタンが表示される
    await expect(page.locator('button', { hasText: 'お気に入り' })).toBeVisible();
  });

  test('プレイリストカードが表示される', async ({ page }) => {
    await navigateTo(page, '/materials');

    // ページが読み込まれるまで待機
    await page.waitForSelector('h1:has-text("youtubeプレイリスト")', { timeout: 10000 });

    // グリッドレイアウト内にカードが存在するか確認
    const gridContainer = page.locator('.grid');
    const isGridVisible = await gridContainer.first().isVisible().catch(() => false);

    if (isGridVisible) {
      // グリッド内の子要素（カード）の数を確認
      const cards = gridContainer.first().locator('> *');
      const cardCount = await cards.count();
      console.log(`表示されているプレイリストカード数: ${cardCount}`);

      // カードが1つ以上表示されている、または「見つかりませんでした」メッセージが表示されている
      const hasCards = cardCount > 0;
      const hasEmptyMessage = await page.locator('text=該当する記録が見つかりませんでした').isVisible().catch(() => false);
      expect(hasCards || hasEmptyMessage).toBeTruthy();
    } else {
      // グリッドが見つからない場合は空状態メッセージを確認
      const hasEmptyMessage = await page.locator('text=該当する記録が見つかりませんでした').isVisible().catch(() => false);
      expect(hasEmptyMessage).toBeTruthy();
    }
  });

  test('検索フィールドが表示され、入力できる', async ({ page }) => {
    await navigateTo(page, '/materials');
    await page.waitForSelector('h1:has-text("youtubeプレイリスト")', { timeout: 10000 });

    // 検索入力フィールドを探す
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();

    // 検索キーワードを入力
    await searchInput.fill('テスト検索');

    // 入力値が反映されていることを確認
    await expect(searchInput).toHaveValue('テスト検索');
  });

  test('検索で結果がフィルタリングされる', async ({ page }) => {
    await navigateTo(page, '/materials');
    await page.waitForSelector('h1:has-text("youtubeプレイリスト")', { timeout: 10000 });

    // 検索入力フィールドに存在しないキーワードを入力
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await searchInput.fill('存在しないキーワード12345');

    // 結果が更新されるのを待機
    await page.waitForTimeout(500);

    // 「見つかりませんでした」のメッセージ、または結果が0件であることを確認
    const hasEmptyMessage = await page.locator('text=該当する記録が見つかりませんでした').isVisible().catch(() => false);
    const hasZeroResults = await page.locator('text=0件').isVisible().catch(() => false);
    expect(hasEmptyMessage || hasZeroResults).toBeTruthy();
  });

  test('お気に入りボタンからお気に入りページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/materials');
    await page.waitForSelector('h1:has-text("youtubeプレイリスト")', { timeout: 10000 });

    // お気に入りボタンをクリック
    const favButton = page.locator('button', { hasText: 'お気に入り' });
    await expect(favButton).toBeVisible();
    await favButton.click();

    // お気に入りページに遷移したことを確認
    await expect(page).toHaveURL(/\/materials\/favorites/, { timeout: 5000 });
  });
});
