// Layout Design feature types
export interface LayoutElement {
  id: string;
  type: 'rectangle' | 'circle' | 'equipment';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

export type ToolType = 'select' | 'rectangle' | 'circle';

export interface CanvasConfig {
  width: number;
  height: number;
  viewBox: string;
  gridSize: number;
} 