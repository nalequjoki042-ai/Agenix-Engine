import { create } from 'zustand'

export type NodeObj = {
  id: string
  type: 'object' | 'trigger'
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
}

interface CanvasState {
  nodes: NodeObj[]
  selectedNodeIds: string[]
  camera: { x: number; y: number; scale: number }
  
  // Actions
  addNode: (node: NodeObj) => void
  updateNode: (id: string, updates: Partial<NodeObj>) => void
  removeNode: (id: string) => void
  selectNode: (id: string | null, multi?: boolean) => void
  setCamera: (camera: Partial<CanvasState['camera']>) => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  selectedNodeIds: [],
  camera: { x: 0, y: 0, scale: 1 },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    selectedNodeIds: state.selectedNodeIds.filter(selId => selId !== id)
  })),

  selectNode: (id, multi = false) => set((state) => {
    if (id === null) return { selectedNodeIds: [] }
    if (multi) return { selectedNodeIds: [...new Set([...state.selectedNodeIds, id])] }
    return { selectedNodeIds: [id] }
  }),

  setCamera: (cameraUpdates) => set((state) => ({
    camera: { ...state.camera, ...cameraUpdates }
  }))
}))
