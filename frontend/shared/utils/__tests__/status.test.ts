import { describe, it, expect } from 'vitest';
import { getStatusIcon, getStatusColor, getStatusText, getStatusIconColor } from '@/shared/utils/status';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Status } from '@/shared/types/common';

describe('status utils', () => {
  describe('getStatusIcon', () => {
    it('planningの場合はClockを返す', () => {
      expect(getStatusIcon('planning')).toBe(Clock);
    });

    it('in-progressの場合はAlertCircleを返す', () => {
      expect(getStatusIcon('in-progress')).toBe(AlertCircle);
    });

    it('completedの場合はCheckCircleを返す', () => {
      expect(getStatusIcon('completed')).toBe(CheckCircle);
    });

    it('on-holdの場合はAlertCircleを返す', () => {
      expect(getStatusIcon('on-hold')).toBe(AlertCircle);
    });

    it('不明なステータスの場合はClockを返す', () => {
      expect(getStatusIcon('unknown' as Status)).toBe(Clock);
    });
  });

  describe('getStatusColor', () => {
    it('planningの場合は黄色系のクラスを返す', () => {
      expect(getStatusColor('planning')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('in-progressの場合は青色系のクラスを返す', () => {
      expect(getStatusColor('in-progress')).toBe('bg-blue-100 text-blue-800');
    });

    it('completedの場合は緑色系のクラスを返す', () => {
      expect(getStatusColor('completed')).toBe('bg-green-100 text-green-800');
    });

    it('on-holdの場合は赤色系のクラスを返す', () => {
      expect(getStatusColor('on-hold')).toBe('bg-red-100 text-red-800');
    });

    it('不明なステータスの場合はグレー系のクラスを返す', () => {
      expect(getStatusColor('unknown' as Status)).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('getStatusText', () => {
    it('planningの場合は「計画中」を返す', () => {
      expect(getStatusText('planning')).toBe('計画中');
    });

    it('in-progressの場合は「進行中」を返す', () => {
      expect(getStatusText('in-progress')).toBe('進行中');
    });

    it('completedの場合は「完了」を返す', () => {
      expect(getStatusText('completed')).toBe('完了');
    });

    it('on-holdの場合は「保留」を返す', () => {
      expect(getStatusText('on-hold')).toBe('保留');
    });

    it('不明なステータスの場合はそのまま返す', () => {
      expect(getStatusText('unknown' as Status)).toBe('unknown');
    });
  });

  describe('getStatusIconColor', () => {
    it('planningの場合は黄色系のテキストクラスを返す', () => {
      expect(getStatusIconColor('planning')).toBe('text-yellow-600');
    });

    it('in-progressの場合は青色系のテキストクラスを返す', () => {
      expect(getStatusIconColor('in-progress')).toBe('text-blue-600');
    });

    it('completedの場合は緑色系のテキストクラスを返す', () => {
      expect(getStatusIconColor('completed')).toBe('text-green-600');
    });

    it('on-holdの場合は赤色系のテキストクラスを返す', () => {
      expect(getStatusIconColor('on-hold')).toBe('text-red-600');
    });

    it('不明なステータスの場合はグレー系のテキストクラスを返す', () => {
      expect(getStatusIconColor('unknown' as Status)).toBe('text-gray-600');
    });
  });
});
