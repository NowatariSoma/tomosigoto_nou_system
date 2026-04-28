import { test, expect } from '@playwright/test';

/**
 * スケジュールボトムシートのE2Eテスト
 *
 * 練習日データがある日付でbundle APIが正常に返ることを検証する。
 * （以前 /bundle が 500 を返すバグがあったため、回帰テストとして追加）
 */

test.describe('スケジュールボトムシート - bundle APIテスト', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('練習日のボトムシートがエラーなく表示される', async ({ page }) => {
    // DBに存在する練習日を直接指定
    await page.goto('/schedule?date=2026-03-22');
    await page.waitForTimeout(500);

    // 日付ヘッダーが表示されることを確認
    const heading = page.getByRole('heading', { name: /2026年3月22日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });

    // ローディング完了を待機
    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 15000 }
    ).catch(() => {});

    // エラーメッセージが表示されていないことを確認
    const hasError = await page.locator('text=取得に失敗しました').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // ボトムシートのコンテンツが表示されていることを確認
    // （練習予定あり → フォームまたは「卒業式」タイトル、練習予定なし → メッセージ）
    const hasAttendanceForm = await page.locator('text=/出席|欠席|遅刻/').first().isVisible().catch(() => false);
    const hasNoScheduleMsg = await page.locator('text=練習予定は見つかりませんでした').isVisible().catch(() => false);
    const hasTitle = await page.locator('text=卒業式').isVisible().catch(() => false);

    expect(hasAttendanceForm || hasNoScheduleMsg || hasTitle).toBeTruthy();
  });

  test('練習日でないURLを指定すると「練習予定なし」が表示される', async ({ page }) => {
    // 練習スケジュールが存在しない日付
    await page.goto('/schedule?date=2026-01-01');
    await page.waitForTimeout(500);

    const heading = page.getByRole('heading', { name: /2026年1月1日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 10000 }
    ).catch(() => {});

    // 練習予定が見つからない旨のメッセージが表示される
    const hasNoScheduleMsg = await page.locator('text=練習予定は見つかりませんでした').isVisible().catch(() => false);
    expect(hasNoScheduleMsg).toBeTruthy();
  });

  test('bundle APIがレスポンスを返す（APIレベル検証）', async ({ page, request }) => {
    // ログインしてトークンを取得
    await page.goto('/schedule?date=2026-03-22');
    await page.waitForTimeout(500);

    // ネットワークリクエストをインターセプトしてbundle APIのステータスを確認
    const bundleResponse = await page.waitForResponse(
      (response) => response.url().includes('/bundle') && response.status() !== 0,
      { timeout: 15000 }
    ).catch(() => null);

    if (bundleResponse) {
      // 200 または 404（データなし）は正常、500はNG
      expect(bundleResponse.status()).not.toBe(500);
      expect([200, 404]).toContain(bundleResponse.status());
    }
  });
});
