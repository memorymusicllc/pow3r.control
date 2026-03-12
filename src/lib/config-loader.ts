/**
 * pow3r.control - Live Config Loader
 *
 * Purpose:
 * - Loads XMAP configs from config.superbots.link API
 * - Supports platform-expansion (primary), platform-v7, and other remote configs
 * - Adapts v5 configs to v7 via xmap-parser
 *
 * Agent Instructions:
 * - Use loadConfigByName() for known config IDs (platform-expansion, platform-v7, etc.)
 * - Use loadConfigFromUrl() for arbitrary URLs
 * - No sample data fallback; API failure surfaces error
 */
import type { XmapV7Config } from './types'
import { loadXmapConfig } from './xmap-parser'

const API_BASE = 'https://config.superbots.link/api'

export interface ConfigOption {
  id: string
  name: string
  source: 'remote' | 'local'
  url?: string
  config?: XmapV7Config
}

export const DEFAULT_CONFIG_ID = 'platform-expansion'

export const AVAILABLE_CONFIGS: ConfigOption[] = [
  {
    id: 'platform-expansion',
    name: 'Platform Expansion',
    source: 'remote',
    url: `${API_BASE}/xmap/config/platform-expansion`,
  },
  {
    id: 'platform-v7',
    name: 'Platform v7',
    source: 'remote',
    url: `${API_BASE}/xmap/config/platform-v7`,
  },
  {
    id: 'pimp-v7',
    name: 'PIMP v7',
    source: 'remote',
    url: `${API_BASE}/xmap/config/pimp-v7`,
  },
  {
    id: 'pimp-v5',
    name: 'PIMP v5',
    source: 'remote',
    url: `${API_BASE}/xmap/config/pimp-v5`,
  },
  {
    id: 'urvs-v5',
    name: 'URVS v5',
    source: 'remote',
    url: `${API_BASE}/xmap/config/urvs-v5`,
  },
  {
    id: 'control-v7',
    name: 'pow3r.control v7',
    source: 'remote',
    url: `${API_BASE}/xmap/config/control-v7`,
  },
  {
    id: 'control-v5',
    name: 'pow3r.control v5',
    source: 'remote',
    url: `${API_BASE}/xmap/config/control-v5`,
  },
]

export async function fetchAvailableConfigs(): Promise<ConfigOption[]> {
  try {
    const res = await fetch(`${API_BASE}/xmap/configs`)
    const json = await res.json() as { success: boolean; data?: { configs: Array<{ id: string; name: string; schema: string; description: string }> } }
    if (json.success && json.data?.configs) {
      return json.data.configs.map((c) => ({
        id: c.id,
        name: `${c.name} (${c.schema})`,
        source: 'remote' as const,
        url: `${API_BASE}/xmap/config/${c.id}`,
      }))
    }
  } catch {
    // Fall back to static list
  }
  return AVAILABLE_CONFIGS
}

export async function loadConfigByName(id: string): Promise<XmapV7Config> {
  const url = AVAILABLE_CONFIGS.find((c) => c.id === id)?.url ?? `${API_BASE}/xmap/config/${id}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Config ${id} failed: ${res.status} ${res.statusText}`)
  const json = await res.json() as { success?: boolean; data?: Record<string, unknown> }
  const data = json.success && json.data ? json.data : json
  return await loadXmapConfig(data as Record<string, unknown>)
}

export async function loadConfigFromUrl(url: string): Promise<XmapV7Config> {
  return await loadXmapConfig(url)
}
