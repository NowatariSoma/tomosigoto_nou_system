"use client";

import { FloraSection } from '../types/flora';

interface FloraDisplayProps {
  sections: FloraSection[];
}

export default function FloraDisplay({ sections }: FloraDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
      <div className="max-w-6xl mx-auto">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-16">
            {/* Section Title */}
            <div className="mb-8 flex flex-col items-end">
              <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                {section.title}
              </h1>
              {section.subtitle && (
                <h2 className="text-lg text-gray-700 border border-gray-300 inline-block px-4 py-1" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                  {section.subtitle}
                </h2>
              )}
            </div>

            {/* Flora Grid */}
            <div className="flex flex-wrap gap-6 justify-end">
              {/* Split items into columns for better right-aligned display */}
              {Array.from({ length: Math.ceil(section.items.length / 20) }, (_, colIndex) => (
                <div key={colIndex} className="flex flex-col space-y-1" style={{ writingMode: 'vertical-rl', textOrientation: 'upright', height: 'auto' }}>
                  {section.items
                    .slice(colIndex * 20, (colIndex + 1) * 20)
                    .map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="py-1 px-2 hover:bg-white hover:shadow-sm transition-all duration-200 rounded"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                      >
                        <span className="text-gray-800 text-sm font-medium">
                          {item.name}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}