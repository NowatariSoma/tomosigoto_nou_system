import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * アカウント設定ページのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. 設定ページへのナビゲーション
 * 2. プロフィールフォームの表示
 * 3. プロフィールフィールドの編集
 */

test.describe('アカウント設定ページ', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('設定ページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/settings');

    // プロフィール情報の見出しが表示される
    await expect(page.locator('text=プロフィール情報')).toBeVisible({ timeout: 10000 });
  });

  test('プロフィールフォームが表示される', async ({ page }) => {
    await navigateTo(page, '/settings');

    // プロフィール情報セクションが表示される
    await expect(page.locator('text=プロフィール情報')).toBeVisible({ timeout: 10000 });

    // 各フィールドのラベルが表示されている
    await expect(page.locator('text=学籍番号')).toBeVisible();
    await expect(page.locator('label', { hasText: '姓' }).first()).toBeVisible();
    await expect(page.locator('label', { hasText: '名' }).first()).toBeVisible();
    await expect(page.locator('text=学年')).toBeVisible();
    await expect(page.locator('text=メールアドレス')).toBeVisible();
  });

  test('編集ボタンが表示されクリックできる', async ({ page }) => {
    await navigateTo(page, '/settings');
    await page.waitForSelector('text=プロフィール情報', { timeout: 10000 });

    // 編集ボタン（または登録ボタン）が表示されている
    const editButton = page.locator('button', { hasText: /編集|登録/ }).first();
    await expect(editButton).toBeVisible();

    // 編集ボタンをクリック
    await editButton.click();
    await page.waitForTimeout(300);

    // 編集モードに入ると入力フィールドが表示される
    const inputFields = page.locator('input[type="text"]');
    const inputCount = await inputFields.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('編集モードでキャンセルできる', async ({ page }) => {
    await navigateTo(page, '/settings');
    await page.waitForSelector('text=プロフィール情報', { timeout: 10000 });

    // 編集ボタンをクリック
    const editButton = page.locator('button', { hasText: /編集|登録/ }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await page.waitForTimeout(300);

    // キャンセルボタンが表示される
    const cancelButton = page.locator('button', { hasText: 'キャンセル' });
    await expect(cancelButton).toBeVisible();

    // キャンセルボタンをクリック
    await cancelButton.click();
    await page.waitForTimeout(300);

    // 編集モードが終了し、再度編集ボタンが表示される
    await expect(page.locator('button', { hasText: /編集|登録/ }).first()).toBeVisible();
  });

  test.skip('プロフィールフィールドを更新できる', async ({ page }) => {
    // このテストはバックエンドの状態に依存するためスキップ
    // 実行するとテストデータが変更される可能性がある
    await navigateTo(page, '/settings');
    await page.waitForSelector('text=プロフィール情報', { timeout: 10000 });

    // 編集ボタンをクリック
    const editButton = page.locator('button', { hasText: /編集|登録/ }).first();
    await editButton.click();
    await page.waitForTimeout(300);

    // 学籍番号フィールドに入力
    const studentIdInput = page.locator('input[type="text"]').first();
    if (await studentIdInput.isVisible()) {
      const originalValue = await studentIdInput.inputValue();
      await studentIdInput.clear();
      await studentIdInput.fill('TEST12345');
      await expect(studentIdInput).toHaveValue('TEST12345');

      // 元の値に戻す
      await studentIdInput.clear();
      await studentIdInput.fill(originalValue);
    }
  });

  test('account-settingパスから設定ページにリダイレクトされる', async ({ page }) => {
    await page.goto('/account-setting');

    // /settings にリダイレクトされる
    await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });
  });
});
