import { Part, Member } from '../types';

export const createMockMembers = (): Member[] => [
  { id: 1, name: '部員1', isSelected: false },
  { id: 2, name: '部員2', isSelected: true },
  { id: 3, name: '部員3', isSelected: true },
  { id: 4, name: '部員4', isSelected: true },
  { id: 5, name: '部員5', isSelected: false },
  { id: 6, name: '部員6', isSelected: true },
  { id: 7, name: '部員7', isSelected: false },
  { id: 8, name: '部員8', isSelected: false },
  { id: 9, name: '部員9', isSelected: true },
  { id: 10, name: '部員10', isSelected: false },
];

export const mockParts: Part[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  name: `パート ${index + 1}`,
  members: createMockMembers(),
}));