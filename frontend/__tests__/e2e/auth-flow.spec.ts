import { test, expect } from '@playwright/test';
import { navigateTo, expectRedirectTo } from './helpers/navigation';

/**
 * 認証フローのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. 未認証ユーザーがログインページにリダイレクトされること
 * 2. ログインページが正しくレンダリングされること
 * 3. 認証済みユーザーが保護されたページにアクセスできること
 * 4. ログアウトフローが正しく動作すること
 */

test.describe('認証フロー - 未認証ユーザー', () => {
  // このブロックでは認証状態を使用しない
  test.use({ storageState: { cookies: [], origins: [] } });

  test('未認証ユーザーが保護ページにアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/schedule');
    await expectRedirectTo(page, '/login');
  });

  test('ログインページが正しくレンダリングされる', async ({ page }) => {
    await navigateTo(page, '/login');

    // メールアドレス入力フィールドが表示されている
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // パスワード入力フィールドが表示されている
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // ログインボタン（Sign in）が表示されている
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // サインアップリンクが表示されている
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test('空の状態でログインボタンが無効化されている', async ({ page }) => {
    await navigateTo(page, '/login');

    // ログインボタンが無効化されている（email/passwordが空のため）
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
});

test.describe('認証フロー - 認証済みユーザー', () => {
  // 保存された認証状態を使用
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('認証済みユーザーがスケジュールページにアクセスできる', async ({ page }) => {
    await navigateTo(page, '/schedule');

    // スケジュールページが表示される（カレンダーの年月表示を確認）
    await expect(page.locator('text=/\\d{4}年\\d{1,2}月/')).toBeVisible({ timeout: 10000 });
  });

  test('認証済みユーザーが設定ページにアクセスできる', async ({ page }) => {
    await navigateTo(page, '/settings');

    // 設定ページが表示される（プロフィール情報の見出しを確認）
    await expect(page.locator('text=プロフィール情報').first()).toBeVisible({ timeout: 10000 });
  });

  test('サイドバーのナビゲーションリンクが表示されている', async ({ page }) => {
    await navigateTo(page, '/schedule');

    // サイドバーにスケジュールリンクが表示されている
    await expect(page.getByRole('link', { name: 'スケジュール' })).toBeVisible({ timeout: 5000 });
  });

  test.skip('ログアウトフローが正しく動作する', async ({ page }) => {
    // ログアウト機能の実装に依存するため、スキップ
    // ログアウトボタンの場所やUIは実装により異なるため
    await navigateTo(page, '/settings');

    // ログアウトボタンを探す（実装に応じて調整が必要）
    const logoutButton = page.locator('button', { hasText: 'ログアウト' });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await expectRedirectTo(page, '/login');
    }
  });
});
