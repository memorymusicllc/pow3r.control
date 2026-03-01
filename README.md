# pow3r.control

Omnimedia Orchestration Control Surface for the Pow3r Platform.

A 3D/2D architecture visualization dashboard powered by XMAP v7, Guardian governance, X-System observability, and PKG intelligence.

## Features

- **2D Graph View** -- Force-directed SVG graph with search, filter, node/edge detail panels
- **3D Immersive View** -- React Three Fiber scene with bloom, Data-as-Light particles, orbit controls
- **Light/Dark/System Theme** -- Theme toggle in header cycles Light, Dark, System (follows OS). Light mode for sunlight readability. 3D scene background, fog, and lighting follow theme.
- **Guardian Dashboard** -- 19 deployment gates with phase grouping, evidence slots, compliance scoring
- **Workflow Expander** -- Drill into workflow steps with retry policy visualization, breadcrumb navigation
- **X-System Telemetry** -- Real-time event stream with severity filtering, rate visualization
- **X-Files Cases** -- Bug case tracking with node-linked navigation
- **Map Key** -- Always-visible legend for node types, statuses, edge types

## Tech Stack

- React 18 + Vite + TailwindCSS (Guardian compliant -- no Next.js)
- Three.js + @react-three/fiber + @react-three/drei
- @react-three/postprocessing (bloom, vignette)
- Zustand (state management)
- D3-force / d3-force-3d (graph layout)
- TypeScript (strict, zero errors)

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
```

## Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name=pow3r-control
```

## Architecture

Data flows from XMAP v7 config through the adapter layer into the Zustand store,
which drives both 2D and 3D visualization layers. The 7-layer model:

1. **Topology** -- Nodes + Edges (always visible)
2. **Governance** -- Guardian gates, ACL overlays
3. **Orchestration** -- Workflow expansion, step animation
4. **Observability** -- X-System telemetry, particles, X-Files
5. **Intelligence** -- PKG knowledge overlay (Phase 5)
6. **Configuration** -- Config controls, manifest status
7. **Meta** -- Search, filter, map key

## Data Model

Canonical data source: XMAP v7 schema (configs/schemas/pow3r_schema_v7.json in pow3r.config).
v5 configs supported via adapter (src/lib/xmap-parser.ts).

## Related

- [pow3r.config](https://github.com/memorymusicllc/pow3r.config) -- Central platform config
- [PIMP Plan](.cursor/plans/pimp_plan_configuration.plan.md) -- Architecture viz plan
- [Design References](docs/design/Particles/) -- Concept art for Data-as-Light
