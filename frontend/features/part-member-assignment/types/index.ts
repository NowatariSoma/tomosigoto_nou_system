export interface Member {
  id: number;
  name: string;
  isSelected: boolean;
}

export interface Part {
  id: number;
  name: string;
  members: Member[];
}