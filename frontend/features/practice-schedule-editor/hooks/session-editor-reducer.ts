/**
 * セッション編集のreducer・型定義・初期状態
 */

import {
  SessionEditorState,
  SessionEditorAction,
} from '../types/session-editor';

/**
 * 未保存の移動変更を追跡するための型
 */
export interface PendingSessionMove {
  sessionId: string;
  venueId: string;
  slotOrder: number;
}

export interface PendingInstructorMove {
  instructorId: string;
  venueId: string;
  slotOrder: number;
}

/**
 * 未保存の会場変更を追跡するための型
 */
export interface PendingVenueAdd {
  type: 'add';
  venue: import('../types/session-editor').VenueInfo;
  tempId: string;
}

export interface PendingVenueRemove {
  type: 'remove';
  venueId: string;
}

export type PendingVenueChange = PendingVenueAdd | PendingVenueRemove;

/**
 * 未保存のタイムスロット変更を追跡するための型（追加・削除用）
 */
export interface PendingTimeSlotChange {
  originalCount: number;
  newCount: number;
}

/**
 * 未保存のタイムスロット時刻編集を追跡するための型
 */
export interface PendingTimeSlotTimeEdit {
  timeSlotId: string;
  startTime: string;
  endTime: string;
}

/**
 * 初期状態
 */
export const initialSessionEditorState: SessionEditorState = {
  sessions: [],
  instructors: [],
  venues: [],
  time_slots: [],
  selected_session: null,
  is_modal_open: false,
  edit_mode: 'edit',
  loading: false,
  error: null,
};

/**
 * セッション編集の状態管理
 */
export const sessionEditorReducer = (
  state: SessionEditorState,
  action: SessionEditorAction
): SessionEditorState => {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_INSTRUCTORS':
      return { ...state, instructors: action.payload };
    case 'UPDATE_INSTRUCTOR': {
      const updatedInstructors = state.instructors.map(i =>
        i.id === action.payload.id ? action.payload : i
      );
      return { ...state, instructors: updatedInstructors };
    }
    case 'SET_VENUES':
      return { ...state, venues: action.payload };
    case 'ADD_VENUES':
      return { ...state, venues: [...state.venues, ...action.payload] };
    case 'REMOVE_VENUE':
      return {
        ...state,
        venues: state.venues.filter(v => v.id !== action.payload)
      };
    case 'UPDATE_VENUE':
      return {
        ...state,
        venues: state.venues.map(v =>
          v.id === action.payload.id ? action.payload : v
        )
      };
    case 'SET_TIME_SLOTS':
      return { ...state, time_slots: action.payload };
    case 'UPDATE_TIME_SLOT':
      return {
        ...state,
        time_slots: state.time_slots.map(ts => {
          const isSameSlot = (action.payload.id && ts.id && ts.id === action.payload.id) || ts.time === action.payload.time;
          return isSameSlot ? action.payload : ts;
        })
      };
    case 'SELECT_SESSION':
      return { ...state, selected_session: action.payload };
    case 'OPEN_MODAL':
      return { ...state, is_modal_open: true };
    case 'CLOSE_MODAL':
      return { ...state, is_modal_open: false, selected_session: null };
    case 'SET_EDIT_MODE':
      return { ...state, edit_mode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.id ? action.payload : s
        )
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload)
      };
    default:
      return state;
  }
};
