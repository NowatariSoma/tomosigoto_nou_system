"use client";

import { FloraItem as FloraItemType } from '../types/flora';

interface FloraItemProps {
  item: FloraItemType;
}

export default function FloraItem({ item }: FloraItemProps) {
  return (
    <div
      className="py-1 px-2 hover:bg-white hover:shadow-sm transition-all duration-200 rounded"
      style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
    >
      <span className="text-gray-800 text-sm font-medium">
        {item.name}
      </span>
    </div>
  );
}
