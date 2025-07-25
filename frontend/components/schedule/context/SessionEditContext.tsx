'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Position } from '../../../../types/session'

interface SessionEditState {
  selectedSessionId: string | null
  draggingSessionId: string | null
  editingSessionId: string | null
  isQuickCreateMenuOpen: boolean
  quickCreatePosition: Position | null
}

interface SessionEditActions {
  selectSession: (id: string | null) => void
  startDragSession: (id: string) => void
  endDragSession: () => void
  openSessionEdit: (id: string | null) => void
  openQuickCreateMenu: (position: Position) => void
  closeAllMenus: () => void
}

type SessionEditContextType = SessionEditState & SessionEditActions

type SessionEditAction =
  | { type: 'SELECT_SESSION'; payload: string | null }
  | { type: 'START_DRAG'; payload: string }
  | { type: 'END_DRAG' }
  | { type: 'OPEN_EDIT'; payload: string | null }
  | { type: 'OPEN_QUICK_CREATE'; payload: Position }
  | { type: 'CLOSE_ALL' }

const initialState: SessionEditState = {
  selectedSessionId: null,
  draggingSessionId: null,
  editingSessionId: null,
  isQuickCreateMenuOpen: false,
  quickCreatePosition: null,
}

const sessionEditReducer = (
  state: SessionEditState,
  action: SessionEditAction
): SessionEditState => {
  switch (action.type) {
    case 'SELECT_SESSION':
      return {
        ...state,
        selectedSessionId: action.payload,
        isQuickCreateMenuOpen: false,
        quickCreatePosition: null,
      }
    
    case 'START_DRAG':
      return {
        ...state,
        draggingSessionId: action.payload,
        selectedSessionId: action.payload,
        isQuickCreateMenuOpen: false,
        quickCreatePosition: null,
      }
    
    case 'END_DRAG':
      return {
        ...state,
        draggingSessionId: null,
      }
    
    case 'OPEN_EDIT':
      return {
        ...state,
        editingSessionId: action.payload,
        isQuickCreateMenuOpen: false,
        quickCreatePosition: null,
      }
    
    case 'OPEN_QUICK_CREATE':
      return {
        ...state,
        isQuickCreateMenuOpen: true,
        quickCreatePosition: action.payload,
        selectedSessionId: null,
        editingSessionId: null,
      }
    
    case 'CLOSE_ALL':
      return {
        ...state,
        selectedSessionId: null,
        editingSessionId: null,
        isQuickCreateMenuOpen: false,
        quickCreatePosition: null,
      }
    
    default:
      return state
  }
}

const SessionEditContext = createContext<SessionEditContextType | undefined>(undefined)

interface SessionEditProviderProps {
  children: ReactNode
}

export const SessionEditProvider: React.FC<SessionEditProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionEditReducer, initialState)

  const actions: SessionEditActions = {
    selectSession: (id: string | null) => {
      dispatch({ type: 'SELECT_SESSION', payload: id })
    },
    
    startDragSession: (id: string) => {
      dispatch({ type: 'START_DRAG', payload: id })
    },
    
    endDragSession: () => {
      dispatch({ type: 'END_DRAG' })
    },
    
    openSessionEdit: (id: string | null) => {
      dispatch({ type: 'OPEN_EDIT', payload: id })
    },
    
    openQuickCreateMenu: (position: Position) => {
      dispatch({ type: 'OPEN_QUICK_CREATE', payload: position })
    },
    
    closeAllMenus: () => {
      dispatch({ type: 'CLOSE_ALL' })
    },
  }

  const contextValue: SessionEditContextType = {
    ...state,
    ...actions,
  }

  return (
    <SessionEditContext.Provider value={contextValue}>
      {children}
    </SessionEditContext.Provider>
  )
}

export const useSessionEdit = (): SessionEditContextType => {
  const context = useContext(SessionEditContext)
  if (context === undefined) {
    throw new Error('useSessionEdit must be used within a SessionEditProvider')
  }
  return context
}