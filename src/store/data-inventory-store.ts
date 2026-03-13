/**
 * pow3r.control - Data Inventory Store
 *
 * Purpose:
 * - Fetches real data store inventory from /api/data/inventory
 * - Replaces hardcoded KV_STORES, D1_DATABASES, etc. in DataKnowledgeView
 *
 * Agent Instructions:
 * - Use useDataInventoryStore() hook in components
 * - Call fetchInventory() to load data
 */
import { create } from 'zustand'
import { api } from '../lib/api-client'

export interface StoreItem {
  binding: string
  name: string
  description: string
  available: boolean
  itemCount?: number | string | null
  tableCount?: number | null
}

interface DataInventoryState {
  kvStores: StoreItem[]
  d1Databases: StoreItem[]
  r2Buckets: StoreItem[]
  vectorizeIndexes: StoreItem[]
  knowledgeBases: Array<StoreItem & { id: string; type: string; documentCount?: number | string | null }>
  summary: Record<string, number>
  loading: boolean
  error: string | null

  fetchInventory: () => Promise<void>
}

export const useDataInventoryStore = create<DataInventoryState>((set) => ({
  kvStores: [],
  d1Databases: [],
  r2Buckets: [],
  vectorizeIndexes: [],
  knowledgeBases: [],
  summary: {},
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true, error: null })
    const res = await api.get<{
      kvStores: StoreItem[]
      d1Databases: StoreItem[]
      r2Buckets: StoreItem[]
      vectorizeIndexes: StoreItem[]
      knowledgeBases: Array<StoreItem & { id: string; type: string; documentCount?: number | string | null }>
      summary: Record<string, number>
    }>('/api/data/inventory')

    if (res.success && res.data) {
      set({ ...res.data, loading: false })
    } else {
      set({ loading: false, error: res.error || 'Failed to fetch inventory' })
    }
  },
}))
