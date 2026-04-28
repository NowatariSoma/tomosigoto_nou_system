import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright設定ファイル
 * スケジュールページのE2Eテストを実行するための設定
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],

  // テスト結果の出力先（このファイルからの相対パス）
  outputDir: 'test-results',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // セットアップ: 認証を実行
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // テスト: 認証済みの状態で実行
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 保存された認証状態を使用
        storageState: '__tests__/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // 開発サーバーを自動起動（オプション）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
