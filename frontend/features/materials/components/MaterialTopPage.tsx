'use client';

import { useState } from 'react';
import { mockData } from '../data/material-data';
import { VideoPlaylist } from '../types/material-types';
import { MaterialSearchFilter } from './MaterialSearchFilter';
import { MaterialCard } from './MaterialCard';

export function MaterialTopPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  const years = Array.from(new Set(mockData.map((item: VideoPlaylist) => item.year))).sort((a: number, b: number) => b - a);

  const filteredData = mockData.filter((item: VideoPlaylist) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'all' || item.year.toString() === selectedYear;
    const matchesPhase = selectedPhase === 'all' || item.phase === selectedPhase;
    return matchesSearch && matchesYear && matchesPhase;
  });

  return (
      <main className="container mx-auto px-4 py-8">
        <MaterialSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedPhase={selectedPhase}
          onPhaseChange={setSelectedPhase}
          years={years}
        />

        <div className="mb-4">
          <p className="text-slate-600">
            {filteredData.length}件の記録が見つかりました
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item: VideoPlaylist) => (
            <MaterialCard key={item.id} item={item} />
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">該当する記録が見つかりませんでした</p>
          </div>
        )}
      </main>
  );
}
