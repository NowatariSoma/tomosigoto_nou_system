import { test, expect } from '@playwright/test';

/**
 * デバッグ用テスト - クリックする要素を詳細に調査
 */

test.describe('スケジュールカレンダー - 要素調査', () => {

  test('12日の要素を詳しく調査', async ({ page }) => {
    // ページに移動
    await page.goto('/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    console.log('\n=== カレンダーグリッドを探す ===');
    const calendarGrid = page.locator('.grid-cols-7');
    const gridCount = await calendarGrid.count();
    console.log('grid-cols-7 の数:', gridCount);

    console.log('\n=== cursor-pointer の要素を探す ===');
    const allCursorPointer = calendarGrid.locator('.cursor-pointer');
    const cursorPointerCount = await allCursorPointer.count();
    console.log('cursor-pointer の数:', cursorPointerCount);

    console.log('\n=== cursor-pointer:not(.bg-transparent) の要素を探す ===');
    const currentMonthCells = calendarGrid.locator('.cursor-pointer:not(.bg-transparent)');
    const currentMonthCount = await currentMonthCells.count();
    console.log('cursor-pointer:not(.bg-transparent) の数:', currentMonthCount);

    console.log('\n=== "12" というテキストを持つ要素を探す ===');
    const cells12 = currentMonthCells.filter({ hasText: /^12$/ });
    const cells12Count = await cells12.count();
    console.log('"12" というテキストを持つ要素の数:', cells12Count);

    if (cells12Count > 0) {
      for (let i = 0; i < cells12Count; i++) {
        const cell = cells12.nth(i);
        const text = await cell.textContent();
        const html = await cell.innerHTML();
        const classList = await cell.evaluate(el => Array.from(el.classList));
        const tagName = await cell.evaluate(el => el.tagName);

        console.log(`\n=== 要素 ${i} の詳細 ===`);
        console.log('Tag:', tagName);
        console.log('Text:', text?.substring(0, 50));
        console.log('Classes:', classList);
        console.log('HTML (first 200 chars):', html?.substring(0, 200));
      }

      // 最初の要素の中にある数字だけのdivを探す
      const firstCell = cells12.first();
      console.log('\n=== 最初の要素の内部構造を調査 ===');
      const innerDivs = firstCell.locator('div');
      const innerDivCount = await innerDivs.count();
      console.log('内部のdivの数:', innerDivCount);

      for (let i = 0; i < Math.min(innerDivCount, 3); i++) {
        const div = innerDivs.nth(i);
        const text = await div.textContent();
        const classList = await div.evaluate(el => Array.from(el.classList));
        console.log(`\n内部div ${i}:`, {
          text: text?.substring(0, 50),
          classes: classList
        });
      }

      // onClickが設定されているか確認
      console.log('\n=== onClick ハンドラの確認 ===');
      const hasOnClick = await firstCell.evaluate(el => {
        const events = (el as any)._reactProps;
        return {
          hasReactProps: !!events,
          propsKeys: events ? Object.keys(events) : []
        };
      });
      console.log('React props:', hasOnClick);
    }

    // 実際にクリックして何が起こるか確認
    console.log('\n=== 実際にクリックしてみる ===');
    const dayCell = cells12.first();

    // クリック前のURL
    console.log('クリック前URL:', page.url());

    await dayCell.click();

    // 少し待機
    await page.waitForTimeout(1000);

    // クリック後のURL
    console.log('クリック後URL:', page.url());
  });
});
