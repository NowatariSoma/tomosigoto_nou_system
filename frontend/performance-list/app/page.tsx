"use client";

import FloraDisplay from './components/FloraDisplay';
import { mockFloraData } from './data/mockFlora';

export default function Home() {
  return <FloraDisplay sections={mockFloraData.sections} />;
}