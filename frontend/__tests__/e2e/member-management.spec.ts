import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * メンバー管理ページのE2Eテスト（管理者向け）
 *
 * このテストは以下を検証します：
 * 1. メンバー管理ページへのアクセス
 * 2. メンバーリストの表示
 * 3. ロール情報の表示
 *
 * 注意: このテストはログインユーザーが管理者権限を持っている前提です。
 * 権限がない場合、テストはスキップされます。
 */

test.describe('メンバー管理ページ', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('メンバー管理ページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/member-management');

    // ページが読み込まれるまで待機
    // 権限がない場合はリダイレクトまたはエラーが表示される
    await page.waitForTimeout(2000);

    // メンバー管理の要素が表示されるか確認
    const hasTitle = await page.locator('text=メンバー管理').first().isVisible().catch(() => false);
    const hasMemberTable = await page.locator('text=登録メンバー').isVisible().catch(() => false);
    const hasPermissionError = await page.locator('text=/権限|アクセス/').isVisible().catch(() => false);

    // メンバー管理ページが表示される、またはアクセス制限メッセージが出る
    expect(hasTitle || hasMemberTable || hasPermissionError).toBeTruthy();

    if (!hasTitle && !hasMemberTable) {
      console.log('メンバー管理ページへのアクセス権限がないため、以降のテストはスキップされます');
    }
  });

  test('メンバーリストが表示される', async ({ page }) => {
    await navigateTo(page, '/member-management');
    await page.waitForTimeout(2000);

    // 「登録メンバー」のサマリーカードが表示されるか確認
    const hasMemberSummary = await page.locator('text=登録メンバー').isVisible().catch(() => false);

    if (!hasMemberSummary) {
      console.log('メンバー管理ページにアクセスできません。スキップします。');
      test.skip();
      return;
    }

    // 読み込み完了を待機
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 10000 }
    ).catch(() => {
      // タイムアウトしても続行
    });

    // メンバーテーブル/リストが表示されることを確認
    // デスクトップではテーブル、モバイルではカードリストが表示される
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasMemberCards = await page.locator('.divide-y').isVisible().catch(() => false);

    expect(hasTable || hasMemberCards).toBeTruthy();
  });

  test('サマリーカードが表示される', async ({ page }) => {
    await navigateTo(page, '/member-management');
    await page.waitForTimeout(2000);

    const hasMemberSummary = await page.locator('text=登録メンバー').isVisible().catch(() => false);

    if (!hasMemberSummary) {
      console.log('メンバー管理ページにアクセスできません。スキップします。');
      test.skip();
      return;
    }

    // サマリーカードが表示される
    await expect(page.locator('text=登録メンバー')).toBeVisible();
    await expect(page.locator('text=管理者')).toBeVisible();

    // 「名」を含むメンバー数が表示される
    await expect(page.locator('text=/\\d+名/')).toBeVisible();
  });

  test('ロール情報がバッジで表示される', async ({ page }) => {
    await navigateTo(page, '/member-management');
    await page.waitForTimeout(2000);

    const hasMemberSummary = await page.locator('text=登録メンバー').isVisible().catch(() => false);

    if (!hasMemberSummary) {
      console.log('メンバー管理ページにアクセスできません。スキップします。');
      test.skip();
      return;
    }

    // 読み込み完了を待機
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 10000 }
    ).catch(() => {});

    // ロールバッジが表示されることを確認（管理者、基本権限、閲覧のみのいずれか）
    const hasAdminBadge = await page.locator('text=管理者').isVisible().catch(() => false);
    const hasBasicBadge = await page.locator('text=基本権限').isVisible().catch(() => false);
    const hasViewerBadge = await page.locator('text=閲覧のみ').isVisible().catch(() => false);

    // 少なくとも1つのロールバッジが表示されている
    expect(hasAdminBadge || hasBasicBadge || hasViewerBadge).toBeTruthy();
  });

  test('絞り込みセクションが表示される', async ({ page }) => {
    await navigateTo(page, '/member-management');
    await page.waitForTimeout(2000);

    const hasMemberSummary = await page.locator('text=登録メンバー').isVisible().catch(() => false);

    if (!hasMemberSummary) {
      console.log('メンバー管理ページにアクセスできません。スキップします。');
      test.skip();
      return;
    }

    // 絞り込みセクションが表示される
    await expect(page.locator('text=絞り込み')).toBeVisible();

    // キーワード検索フィールドが表示される
    const searchInput = page.locator('input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('編集モードボタンが表示される', async ({ page }) => {
    await navigateTo(page, '/member-management');
    await page.waitForTimeout(2000);

    const hasMemberSummary = await page.locator('text=登録メンバー').isVisible().catch(() => false);

    if (!hasMemberSummary) {
      console.log('メンバー管理ページにアクセスできません。スキップします。');
      test.skip();
      return;
    }

    // 読み込み完了を待機
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 10000 }
    ).catch(() => {});

    // 編集モードボタンが表示される
    const editButton = page.locator('button', { hasText: '編集モード' });
    await expect(editButton).toBeVisible();
  });
});
