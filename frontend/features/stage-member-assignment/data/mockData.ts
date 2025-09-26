import { Performance } from '../types';

export const mockPerformances: Performance[] = [
  {
    id: '1',
    name: '公演名 1',
    parts: ['パート 1', 'パート 2', 'パート 3', 'パート 4'],
    grades: [
      {
        id: 'grade-1-1',
        name: '1回生',
        expanded: false,
        parts: [
          { id: 'part-1-1-1', name: 'パート 1', selected: false },
          { id: 'part-1-1-2', name: 'パート 2', selected: false },
          { id: 'part-1-1-3', name: 'パート 3', selected: false },
          { id: 'part-1-1-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-1-2',
        name: '2回生',
        expanded: false,
        parts: [
          { id: 'part-1-2-1', name: 'パート 1', selected: false },
          { id: 'part-1-2-2', name: 'パート 2', selected: false },
          { id: 'part-1-2-3', name: 'パート 3', selected: false },
          { id: 'part-1-2-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-1-3',
        name: '3回生',
        expanded: false,
        parts: [
          { id: 'part-1-3-1', name: 'パート 1', selected: false },
          { id: 'part-1-3-2', name: 'パート 2', selected: true },
          { id: 'part-1-3-3', name: 'パート 3', selected: false },
          { id: 'part-1-3-4', name: 'パート 4', selected: true },
        ]
      },
      {
        id: 'grade-1-4',
        name: '4回生',
        expanded: false,
        parts: [
          { id: 'part-1-4-1', name: 'パート 1', selected: false },
          { id: 'part-1-4-2', name: 'パート 2', selected: false },
          { id: 'part-1-4-3', name: 'パート 3', selected: false },
          { id: 'part-1-4-4', name: 'パート 4', selected: false },
        ]
      }
    ]
  },
  {
    id: '2',
    name: '公演名 2',
    parts: ['パート 1', 'パート 2', 'パート 3', 'パート 4'],
    grades: [
      {
        id: 'grade-2-1',
        name: '1回生',
        expanded: false,
        parts: [
          { id: 'part-2-1-1', name: 'パート 1', selected: false },
          { id: 'part-2-1-2', name: 'パート 2', selected: false },
          { id: 'part-2-1-3', name: 'パート 3', selected: false },
          { id: 'part-2-1-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-2-2',
        name: '2回生',
        expanded: false,
        parts: [
          { id: 'part-2-2-1', name: 'パート 1', selected: false },
          { id: 'part-2-2-2', name: 'パート 2', selected: false },
          { id: 'part-2-2-3', name: 'パート 3', selected: false },
          { id: 'part-2-2-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-2-3',
        name: '3回生',
        expanded: false,
        parts: [
          { id: 'part-2-3-1', name: 'パート 1', selected: false },
          { id: 'part-2-3-2', name: 'パート 2', selected: false },
          { id: 'part-2-3-3', name: 'パート 3', selected: false },
          { id: 'part-2-3-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-2-4',
        name: '4回生',
        expanded: false,
        parts: [
          { id: 'part-2-4-1', name: 'パート 1', selected: false },
          { id: 'part-2-4-2', name: 'パート 2', selected: false },
          { id: 'part-2-4-3', name: 'パート 3', selected: false },
          { id: 'part-2-4-4', name: 'パート 4', selected: false },
        ]
      }
    ]
  },
  {
    id: '3',
    name: '公演名 3',
    parts: ['パート 1', 'パート 2', 'パート 3', 'パート 4'],
    grades: [
      {
        id: 'grade-3-1',
        name: '1回生',
        expanded: false,
        parts: [
          { id: 'part-3-1-1', name: 'パート 1', selected: false },
          { id: 'part-3-1-2', name: 'パート 2', selected: false },
          { id: 'part-3-1-3', name: 'パート 3', selected: false },
          { id: 'part-3-1-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-3-2',
        name: '2回生',
        expanded: false,
        parts: [
          { id: 'part-3-2-1', name: 'パート 1', selected: false },
          { id: 'part-3-2-2', name: 'パート 2', selected: false },
          { id: 'part-3-2-3', name: 'パート 3', selected: false },
          { id: 'part-3-2-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-3-3',
        name: '3回生',
        expanded: false,
        parts: [
          { id: 'part-3-3-1', name: 'パート 1', selected: false },
          { id: 'part-3-3-2', name: 'パート 2', selected: false },
          { id: 'part-3-3-3', name: 'パート 3', selected: false },
          { id: 'part-3-3-4', name: 'パート 4', selected: false },
        ]
      },
      {
        id: 'grade-3-4',
        name: '4回生',
        expanded: false,
        parts: [
          { id: 'part-3-4-1', name: 'パート 1', selected: false },
          { id: 'part-3-4-2', name: 'パート 2', selected: false },
          { id: 'part-3-4-3', name: 'パート 3', selected: false },
          { id: 'part-3-4-4', name: 'パート 4', selected: false },
        ]
      }
    ]
  },
  {
    id: '4',
    name: '公演名 4',
    parts: ['パート 1', 'パート 2', 'パート 3', 'パート 4', 'パート 5', 'パート 6'],
    grades: [
      {
        id: 'grade-4-1',
        name: '1回生',
        expanded: false,
        parts: [
          { id: 'part-4-1-1', name: 'パート 1', selected: false },
          { id: 'part-4-1-2', name: 'パート 2', selected: false },
          { id: 'part-4-1-3', name: 'パート 3', selected: false },
          { id: 'part-4-1-4', name: 'パート 4', selected: false },
          { id: 'part-4-1-5', name: 'パート 5', selected: false },
          { id: 'part-4-1-6', name: 'パート 6', selected: false },
        ]
      },
      {
        id: 'grade-4-2',
        name: '2回生',
        expanded: false,
        parts: [
          { id: 'part-4-2-1', name: 'パート 1', selected: false },
          { id: 'part-4-2-2', name: 'パート 2', selected: false },
          { id: 'part-4-2-3', name: 'パート 3', selected: false },
          { id: 'part-4-2-4', name: 'パート 4', selected: false },
          { id: 'part-4-2-5', name: 'パート 5', selected: false },
          { id: 'part-4-2-6', name: 'パート 6', selected: false },
        ]
      },
      {
        id: 'grade-4-3',
        name: '3回生',
        expanded: true,
        parts: [
          { id: 'part-4-3-1', name: 'パート 1', selected: false },
          { id: 'part-4-3-2', name: 'パート 2', selected: true },
          { id: 'part-4-3-3', name: 'パート 3', selected: false },
          { id: 'part-4-3-4', name: 'パート 4', selected: true },
          { id: 'part-4-3-5', name: 'パート 5', selected: false },
          { id: 'part-4-3-6', name: 'パート 6', selected: false },
        ]
      },
      {
        id: 'grade-4-4',
        name: '4回生',
        expanded: false,
        parts: [
          { id: 'part-4-4-1', name: 'パート 1', selected: false },
          { id: 'part-4-4-2', name: 'パート 2', selected: false },
          { id: 'part-4-4-3', name: 'パート 3', selected: false },
          { id: 'part-4-4-4', name: 'パート 4', selected: false },
          { id: 'part-4-4-5', name: 'パート 5', selected: false },
          { id: 'part-4-4-6', name: 'パート 6', selected: false },
        ]
      }
    ]
  }
];