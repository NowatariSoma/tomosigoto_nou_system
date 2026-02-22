import { describe, it, expect } from 'vitest';
import { API_CONFIG, buildApiUrl, buildAuthUrl } from '@/lib/api/config';

describe('API config', () => {
  describe('API_CONFIG', () => {
    it('BASE_URLがデフォルト値を持つ', () => {
      expect(API_CONFIG.BASE_URL).toBeDefined();
      expect(typeof API_CONFIG.BASE_URL).toBe('string');
    });

    it('AUTH_URLがデフォルト値を持つ', () => {
      expect(API_CONFIG.AUTH_URL).toBeDefined();
      expect(typeof API_CONFIG.AUTH_URL).toBe('string');
    });
  });

  describe('buildApiUrl', () => {
    it('エンドポイントからURLを構築する', () => {
      const result = buildApiUrl('/practice_slots');
      expect(result).toContain('/practice_slots');
      expect(result).toContain(API_CONFIG.BASE_URL);
    });

    it('先頭にスラッシュがないエンドポイントでもスラッシュを追加する', () => {
      const result = buildApiUrl('practice_slots');
      expect(result).toContain('/practice_slots');
    });

    it('完全なURLの場合はそのまま返す', () => {
      const fullUrl = 'https://api.example.com/endpoint';
      const result = buildApiUrl(fullUrl);
      expect(result).toBe(fullUrl);
    });

    it('httpで始まるURLはそのまま返す', () => {
      const fullUrl = 'http://localhost:3000/api';
      const result = buildApiUrl(fullUrl);
      expect(result).toBe(fullUrl);
    });
  });

  describe('buildAuthUrl', () => {
    it('認証エンドポイントからURLを構築する', () => {
      const result = buildAuthUrl('/auth/login');
      expect(result).toContain('/auth/login');
      expect(result).toContain(API_CONFIG.AUTH_URL);
    });

    it('先頭にスラッシュがないエンドポイントでもスラッシュを追加する', () => {
      const result = buildAuthUrl('auth/login');
      expect(result).toContain('/auth/login');
    });

    it('完全なURLの場合はそのまま返す', () => {
      const fullUrl = 'https://auth.example.com/login';
      const result = buildAuthUrl(fullUrl);
      expect(result).toBe(fullUrl);
    });
  });
});
