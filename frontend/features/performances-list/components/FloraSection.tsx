"use client";

import { FloraSection as FloraSectionType } from '../types/flora';
import FloraItem from './FloraItem';

interface FloraSectionProps {
  section: FloraSectionType;
}

export default function FloraSection({ section }: FloraSectionProps) {
  return (
    <div className="flex items-start space-x-2 flex-shrink-0 flex-row-reverse">
      {/* Section Title and Subtitle */}
      <div className="flex flex-col items-end space-y-4 min-w-fit">
        <h1 className="text-2xl font-bold text-gray-900" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
          {section.title}
        </h1>
        {section.subtitle && (
          <h2 className="text-lg text-gray-700 border border-gray-300 inline-block px-4 py-1" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
            {section.subtitle}
          </h2>
        )}
      </div>

      {/* Flora Grid */}
      <div className="flex items-start justify-start max-w-96">
        <div className="flex flex-row-reverse flex-wrap gap-1">
          {section.items.map((item, itemIndex) => (
            <FloraItem key={itemIndex} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
