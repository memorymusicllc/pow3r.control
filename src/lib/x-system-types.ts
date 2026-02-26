/**
 * pow3r.control - X-System Data Types
 *
 * Purpose:
 * - Types for X-Plugin observations, X-Log entries, X-Files cases, X-Stream telemetry
 * - Matches the data structures from pow3r.config X-System implementation
 *
 * Agent Instructions:
 * - These types mirror the shapes returned by x_plugin_get_all_x_system_data
 * - Severity levels: critical > high > medium > low > info
 */

export type XEventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type XEventSource = 'cursor' | 'workflow' | 'mcp' | 'guardian' | 'healing' | 'api' | 'deploy'

export type XEventType = 'xlog' | 'xplugin' | 'xfiles' | 'xstream' | 'eval' | 'learning'

export interface XLogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  source: XEventSource
  correlationId?: string
  nodeId?: string
  workflowId?: string
  tags?: string[]
}

export interface XFilesCase {
  id: string
  title: string
  description: string
  nodeId: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  severity: XEventSeverity
  timestamp: string
  resolution?: {
    description: string
    timestamp: string
    agentId: string
  }
}

export interface XStreamEvent {
  id: string
  type: XEventType
  source: XEventSource
  severity: XEventSeverity
  timestamp: string
  nodeId?: string
  edgeId?: string
  message: string
  data?: Record<string, unknown>
}

export const SEVERITY_COLORS: Record<XEventSeverity, string> = {
  critical: '#FF3D00',
  high: '#FF6D00',
  medium: '#FFB300',
  low: '#00E5FF',
  info: '#555566',
}

export const LEVEL_COLORS: Record<string, string> = {
  debug: '#555566',
  info: '#00E5FF',
  warn: '#FFB300',
  error: '#FF3D00',
  critical: '#FF0000',
}
