export interface FloraItem {
  name: string;
  category: string;
}

export interface FloraSection {
  title: string;
  subtitle?: string;
  items: FloraItem[];
}

export interface FloraData {
  sections: FloraSection[];
}