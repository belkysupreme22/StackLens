# StackLens — Developer & Agent Guide

StackLens is an offline Android Application Intelligence desktop app built with **Tauri 2**, **Rust** (detection engine & ADB integration), **React 18**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Dashboard Visualizations & Charting Standards

- **D3.js (d3js.org)**: Use D3.js (`d3`) as the standard data visualization and math engine for dashboard visualization charts, scales, curves, and geometries.
- **Sparklines**: The micro-trend charts embedded in metric cards, KPI rows, and framework statistics are called **sparklines**.
  - Component location: `apps/desktop/src/components/ui/sparkline.tsx`
  - Sparklines use D3 math (`d3.scaleLinear`, `d3.line().curve(d3.curveMonotoneX)`, `d3.area()`) with subtle linear gradients fading to transparent over dark surfaces.
  - Sparklines must feel tactile, responsive, and data-dense (Edward Tufte microchart philosophy).
- **No Heavy Chart Bloat**: Prefer sleek D3-driven SVG sparklines and spectrum bars over heavy chart canvases or static documentation blocks.

---

## 2. Design System & Livery Guidelines (`rize.roggy.site v2`)

- **Palette**:
  - Root void background: `#0a0a0b`
  - Surfaces / Cards: `#131315`
  - Hairline borders: `#26262a`
  - Elevated elements: `#18181b`
  - Signature Accent: `#47ab61` (Rize green)
  - Muted text / labels: `#8c8b8f`
  - High-contrast text: `#ffffff`
- **Proportions**:
  - The top navigation header and sidebar brand header must remain identical in height (`h-14` / 56px) for an unbroken horizontal horizon line.
  - Border dividers between header and sidebar must align seamlessly.
- **Icons & Logos**:
  - Never construct logos with inline hardcoded SVGs.
  - Framework logos: Use authentic vector files in `apps/desktop/public/frameworks/*.svg` rendered via `<FrameworkLogo />`.
  - Native desktop icon: Official multi-resolution suite in `apps/desktop/src-tauri/icons/`.

---

## 3. Dynamic Package Intelligence & ADB Rules

- **Zero Hardcoding**:
  - Never maintain hardcoded lists of package names or application icons.
  - Dynamic App Names: Derived dynamically using `package-resolver.ts` from reverse-DNS namespaces and compound casing (e.g. `Samsung Internet`, `Gebeta Maps`).
  - Dynamic App Icons: Extracted live from the device APK via ADB prioritizing authentic mipmap launcher icons (`res/mipmap-[^/]+/ic_launcher(\.png|\.webp)`).
- **User vs System Apps**:
  - Filter out system daemons, Knox stubs, Apex modules, and font packs (`!isSystem && !isBackgroundStub`).
  - Show authentic user-facing applications.
- **Hardware Hotplug**:
  - USB plug-in and plug-out detection is automated via non-blocking background polling in `AppLayout` (`useAppStore.refreshDevices(quiet = true)`).
  - Users should never need to press manual refresh to detect plugged or unplugged Android devices.
- **View Modes**:
  - Device manager defaults to **Grid View**, with an interactive toggle for List View.
  - Inspection can be cancelled instantly with the `Esc` key.

---

## 4. Architecture & Build Commands

- **Rust Workspace**:
  - `engine`: Core bytecode, DEX, ELF, and signature detection engine.
  - `cli`: Standalone CLI executable.
  - `shared`: Common types shared between Rust and TypeScript.
  - `apps/desktop/src-tauri`: Tauri 2 backend integration.
- **Build & Verification**:
  - Run engine tests: `cargo test --workspace` (40 unit tests)
  - Desktop frontend build: `cd apps/desktop && npm run build`
  - Desktop dev: `cd apps/desktop && npm run desktop` (or `npm run dev` for Vite web)
