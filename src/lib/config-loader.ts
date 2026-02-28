/**
 * pow3r.control - Live Config Loader
 *
 * Purpose:
 * - Loads XMAP configs from config.superbots.link or local files
 * - Supports loading multiple configs (PIMP v7, URVS v5, platform)
 * - Adapts v5 configs to v7 via xmap-parser
 *
 * Agent Instructions:
 * - Use loadConfigFromUrl() for remote configs
 * - Use loadConfigByName() for known platform configs
 * - Falls back to sample data if API is unavailable
 */
import type { XmapV7Config } from './types'
import { loadXmapConfig } from './xmap-parser'
import { SAMPLE_CONFIG } from './sample-data'

const API_BASE = 'https://config.superbots.link/api'

export interface ConfigOption {
  id: string
  name: string
  source: 'remote' | 'local'
  url?: string
  config?: XmapV7Config
}

export const AVAILABLE_CONFIGS: ConfigOption[] = [
  {
    id: 'pow3r-platform',
    name: 'Pow3r Uber Master (default)',
    source: 'local',
    config: SAMPLE_CONFIG,
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
      const remote: ConfigOption[] = json.data.configs.map((c) => ({
        id: c.id,
        name: `${c.name} (${c.schema})`,
        source: 'remote' as const,
        url: `${API_BASE}/xmap/config/${c.id}`,
      }))
      return [AVAILABLE_CONFIGS[0], ...remote]
    }
  } catch {
    // Fall back to static list
  }
  return AVAILABLE_CONFIGS
}

export async function loadConfigByName(id: string): Promise<XmapV7Config> {
  const option = AVAILABLE_CONFIGS.find((c) => c.id === id)
  if (!option) throw new Error(`Config not found: ${id}`)

  if (option.source === 'local' && option.config) {
    return option.config
  }

  if (option.url) {
    try {
      const res = await fetch(option.url)
      const json = await res.json() as { success?: boolean; data?: Record<string, unknown> }
      const data = json.success && json.data ? json.data : json
      return await loadXmapConfig(data as Record<string, unknown>)
    } catch (err) {
      console.warn(`Failed to load remote config ${id}, falling back to sample:`, err)
      return SAMPLE_CONFIG
    }
  }

  return SAMPLE_CONFIG
}

export async function loadConfigFromUrl(url: string): Promise<XmapV7Config> {
  try {
    return await loadXmapConfig(url)
  } catch (err) {
    console.warn('Failed to load config from URL, falling back to sample:', err)
    return SAMPLE_CONFIG
  }
}
