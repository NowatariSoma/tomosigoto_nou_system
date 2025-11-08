import { test, expect } from '@playwright/test';

/**
 * デバッグ用テスト - 日付の問題を特定する
 */

test.describe('スケジュールカレンダー - デバッグ', () => {

  test('12日をクリックしたときのURLパラメータを確認', async ({ page }) => {
    // コンソールログをキャプチャ
    page.on('console', msg => {
      console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
    });

    // ページに移動
    await page.goto('/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    console.log('\n=== 12日をクリックする前のURL ===');
    console.log(page.url());

    // 12日のセルを探してクリック
    const dayCell = page.locator('.cursor-pointer').filter({ hasText: /^12$/ }).first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });

    // クリックする要素のテキストと属性を確認
    const cellText = await dayCell.textContent();
    const cellHtml = await dayCell.innerHTML();
    console.log('\n=== クリック対象の要素 ===');
    console.log('Text:', cellText);
    console.log('HTML (first 200 chars):', cellHtml?.substring(0, 200));

    await dayCell.click();

    // URLが変わるまで待機
    await page.waitForURL(/date=/, { timeout: 5000 });

    console.log('\n=== 12日をクリックした後のURL ===');
    const currentUrl = page.url();
    console.log(currentUrl);

    // URLパラメータから日付を抽出
    const url = new URL(currentUrl);
    const dateParam = url.searchParams.get('date');
    console.log('\n=== URLパラメータの date 値 ===');
    console.log(dateParam);

    // アニメーションを待機
    await page.waitForTimeout(500);

    // ボトムシートの日付を確認
    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('\n=== ボトムシートに表示された日付 ===');
    console.log(dateText);

    // URLパラメータが2025-11-12であることを確認
    expect(dateParam).toBe('2025-11-12');

    // ボトムシートに12日が表示されていることを確認
    expect(dateText).toContain('12日');
  });
});
