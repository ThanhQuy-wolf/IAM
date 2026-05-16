# Architecture Diagrams — draw.io Export Kit

The 7 Mermaid diagrams from `docs/research.md`, extracted as standalone `.mmd`
files so they can be imported into **draw.io / diagrams.net** and exported as
SVG/PNG for the final Word/PDF report.

| File | Report section | Type |
|------|----------------|------|
| `01-oauth-authcode-sequence.mmd` | §2.1 OAuth 2.0 Authorization Code flow | Sequence |
| `02-totp-sequence.mmd` | §2.4 TOTP setup + 2FA login | Sequence |
| `03-webauthn-sequence.mmd` | §2.5 WebAuthn register + authenticate | Sequence |
| `04-rbac-roles.mmd` | §2.6 RBAC role → permission mapping | Flowchart |
| `05-architecture-components.mmd` | §3.1 Layered component view | Flowchart |
| `06-authz-pipeline-activity.mmd` | §3.2 Request authorization pipeline | Activity |
| `07-data-model-erd.mmd` | §3.3 Data model | ER diagram |

## How to import into draw.io

1. Open <https://app.diagrams.net> (or the draw.io desktop app).
2. Menu: **Arrange → Insert → Advanced → Mermaid…**
   (older builds: **Extras → Edit Diagram**, or the **+ → Advanced → Mermaid**).
3. Open the target `.mmd` file, copy its full contents, paste into the dialog,
   click **Insert**. draw.io renders it as fully editable native shapes.
4. Repeat per file — one diagram per draw.io page keeps the report tidy.
5. Export for the report: **File → Export as → SVG** (vector, sharpest in
   Word/PDF) or **PNG** at 300 dpi if a raster is required.

> draw.io's persistent `.drawio` format stores the *converted shapes*, not the
> Mermaid source — there is no reliable hand-authored `.drawio` for these, which
> is why the `.mmd` source is the deliverable. Conversion happens inside draw.io
> in one paste.

## Fallback (no draw.io)

Paste any `.mmd` into <https://mermaid.live> → **Actions → SVG / PNG**. Same
result, no install. The source is identical to the fenced ```mermaid``` blocks
in `research.md`, so any edit there can be re-exported by re-copying.
