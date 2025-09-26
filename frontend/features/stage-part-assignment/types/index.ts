export interface Part {
  id: string;
  name: string;
  selected: boolean;
}

export interface Grade {
  id: string;
  name: string;
  parts: Part[];
  expanded: boolean;
}

export interface Performance {
  id: string;
  name: string;
  parts: string[];
  grades: Grade[];
}