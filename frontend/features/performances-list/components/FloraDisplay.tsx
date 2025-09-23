"use client";

import { FloraSection } from '../types/flora';
import FloraSectionComponent from './FloraSection';

interface FloraDisplayProps {
  sections: FloraSection[];
}

export default function FloraDisplay({ sections }: FloraDisplayProps) {
  return (
    <div className="w-full">
      <div className="h-8"></div>
      <div className="w-full overflow-x-auto">
        <div className="flex flex-col space-y-8 min-w-max items-end" style={{ writingMode: 'horizontal-tb' }}>
          {sections.map((section, sectionIndex) => (
            <FloraSectionComponent key={sectionIndex} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}