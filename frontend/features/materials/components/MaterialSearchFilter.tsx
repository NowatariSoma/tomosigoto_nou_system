'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';

/**
 * 検索・フィルター機能のプロパティ
 */
interface MaterialSearchFilterProps {
  /** 検索クエリの値 */
  searchQuery: string;
  /** 検索クエリの変更ハンドラー */
  onSearchChange: (query: string) => void;
  /** 選択された年度 */
  selectedYear: string;
  /** 年度選択の変更ハンドラー */
  onYearChange: (year: string) => void;
  /** 選択されたフェーズ */
  selectedPhase: string;
  /** フェーズ選択の変更ハンドラー */
  onPhaseChange: (phase: string) => void;
  /** 利用可能な年度のリスト */
  years: number[];
}

/**
 * 資料検索・フィルターコンポーネント
 * 舞台名での検索と年度・フェーズでのフィルタリング機能を提供
 */
export function MaterialSearchFilter({
  searchQuery,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedPhase,
  onPhaseChange,
  years,
}: MaterialSearchFilterProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="舞台名で検索..."
          className="pl-10 h-12 text-lg"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="年度を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての年度</SelectItem>
            {years.map((year: number) => (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPhase} onValueChange={onPhaseChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="フェーズを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのフェーズ</SelectItem>
            <SelectItem value="稽古">稽古</SelectItem>
            <SelectItem value="本番">本番</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
