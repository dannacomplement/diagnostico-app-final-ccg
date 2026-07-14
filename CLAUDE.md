# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (port 5173)
npm run build    # tsc -b && vite build — must pass with zero errors before deploy
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

No test framework is configured. Verify changes by running `npm run build` (catches TypeScript errors) and testing in the browser via `npm run dev`.

## Environment Variables

`.env` in project root (not committed):

```
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Supabase anon public key>
```

## Architecture

### App Flow

React SPA with Supabase Auth. Two roles:
- **Master** (consultants): see all companies, manage users, configure settings, run surveys
- **Client** (companies): see only their own dashboard with completed diagnostics

Routes are defined in `src/App.tsx`. Navigation uses a **bidirectional bridge** between Zustand's `view` state and React Router URLs (`src/lib/navigation.ts`). Changing `view` in the store pushes the URL; browser back/forward updates the store. This means navigation can happen from either side — always use the store's `setView()` or React Router's `navigate()`, never both.

### Data Flow

```
Survey wizard (WizardShell/TechWizardShell/OrgWizardShell)
  → Zustand store (diagnosticStore/techSurveyStore/orgSurveyStore)
    → persist to localStorage (in-progress surveys)
    → on completion: save to Supabase (diagnostics/tech_surveys/org_surveys tables)
      → Results/Report pages read from store or fetch from Supabase
        → Export functions generate PDF/PPTX/Excel from the saved data
```

Each survey type has its own Zustand store with persist middleware. The store holds all wizard state and computed results. On save, the entire state object is stored as a JSON blob in Supabase's `data` column alongside denormalized columns for filtering.

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase Auth), has `role`, `survey_permissions`, `status` |
| `diagnostics` | Saved business diagnostics (JSON blob in `data` column) |
| `org_surveys` | Saved organizational surveys |
| `tech_surveys` | Saved technology surveys |
| `app_settings` | Key-value store for global config (logos, test client IDs) |
| `prefills` | Master pre-populates survey data for a client (keyed by `user_id` + `survey_type`) |

User management (create/update/delete) goes through Vercel serverless functions in `api/` because it requires Supabase Admin API access.

### Surveys

1. **Diagnóstico Empresarial** — 6-step wizard evaluating company maturity: general data, current situation, professionalization criteria, institutionalization criteria, key positions (gerencias), challenges/urgency. Produces maturity index, risk analysis, opportunity areas, and margin evaluation.

2. **Encuesta Tecnológica** — 7-step wizard: tools, digital presence, automation, data/analytics, AI adoption, security, digital culture. Produces a tech maturity score (0-100) and level (básico/intermedio/avanzado/líder_digital).

3. **Encuesta Organizacional** — 3-step wizard: org structure, area details, talent processes.

### Export System

All export functions are in `src/lib/export*.ts`:
- `exportPdf.ts` — Business diagnostic PDF
- `exportTechPdf.ts` — Tech survey PDF
- `exportOrgPdf.ts` — Org survey PDF
- `exportExpediente.ts` — Consolidated multi-survey PDF per client
- `exportPptx.ts` — PowerPoint (LAYOUT_WIDE: 13.33" × 7.5")
- `export.ts` — Excel export

### Analysis Engine

`src/lib/diagnosticAnalysis.ts` computes maturity index, risk items, and growth readiness. Used by both the web ReportPage and PDF exports — keep them in sync.

`src/lib/calculations.ts` handles company size classification, criterion scoring, opportunity area mapping, urgency levels, and margin evaluation.

## Brand Colors

```
NAVY:         #1B2A4A  (primary dark)
BRAND_ORANGE: #D4922E  (accent)
```

In PDF/PPTX exports, use without `#`: `NAVY = '1B2A4A'`, `BRAND_ORANGE = 'D4922E'`.

## Critical Rule: Spanish Accents

All user-facing text MUST have correct Spanish accents: á, é, í, ó, ú, ñ, ü, ¿, ¡

**Programmatic values MUST NOT have accents** — they are internal identifiers:

```typescript
// CORRECT — type/enum values without accents:
severity: 'critico'        // NOT 'crítico' — it's a type literal
ExcelNivel = 'basico'      // NOT 'básico'
esSocio: 'si'              // NOT 'sí'
empresaFamiliar: 'si_1era' // NOT 'sí_1era'
MarginLevel = 'critico'    // NOT 'crítico'
CalificadoStatus = 'si'    // NOT 'sí'

// CORRECT — display labels WITH accents:
label: 'Básico'            // visible to user
label: 'Sí'                // visible to user
risk: 'Márgenes en nivel crítico'  // visible text
```

If TypeScript gives `Type '"crítico"' is not assignable to type '"critico"'`, you accidentally accented a programmatic value. In exports, boolean displays show `'Sí'` / `'No'` (accented), but internal comparisons use `=== 'si'` (unaccented).

## Deploy

Vercel with custom domain: `radiografia-expedientes.complementcg.com`. Serverless API functions live in `api/` (create-user, update-user, delete-user, send-report). Always run `npm run build` before deploying to catch TypeScript errors.
