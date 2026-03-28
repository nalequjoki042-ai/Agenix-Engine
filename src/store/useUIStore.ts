import { create } from 'zustand'

interface UIState {
  contextMenu: {
    isOpen: boolean
    x: number
    y: number
    canvasX: number // Coordinates relative to canvas world
    canvasY: number
  } | null
  
  openContextMenu: (x: number, y: number, canvasX: number, canvasY: number) => void
  closeContextMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  contextMenu: null,
  
  openContextMenu: (x, y, canvasX, canvasY) => set({
    contextMenu: { isOpen: true, x, y, canvasX, canvasY }
  }),
  
  closeContextMenu: () => set({ contextMenu: null })
}))
