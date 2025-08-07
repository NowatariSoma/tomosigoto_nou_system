export interface Room {
  id: string;
  name: string;
  campus: string;
  capacity: number;
  danceAllowed: boolean;
  description: string;
  location?: string;
} 