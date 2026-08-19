import { test as setup, expect } from '@playwright/test';

const authFile = '__tests__/.auth/user.json';

/**
 * 認証セットアップ
 * テスト実行前に一度だけログインして、認証状態を保存する
 */
setup('authenticate', async ({ page }) => {
  // ログインページに移動
  await page.goto('/login');

  // メールアドレスを入力（環境変数 E2E_USER_EMAIL から取得）
  await page.fill('input[type="email"]', process.env.E2E_USER_EMAIL!);

  // パスワードを入力（環境変数 E2E_USER_PASSWORD から取得）
  await page.fill('input[type="password"]', process.env.E2E_USER_PASSWORD!);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // ログイン後、設定ページ（/settings）にリダイレクトされるので待機
  await page.waitForURL('/settings', { timeout: 10000 });

  // 認証が成功したことを確認（サイドバーのスケジュールリンクが表示されているか）
  await expect(page.getByRole('link', { name: 'スケジュール' })).toBeVisible({ timeout: 5000 });

  // 認証状態を保存
  await page.context().storageState({ path: authFile });
});
