---
name: ui-ux-practices
description: Angular/Tailwind UI implementation patterns and hard-won gotchas established while building this app's sidebar, modals, and search/select features. Load before building new UI components, modals, forms, or anything with drag-and-drop, search, or per-row actions in this codebase.
---

# UI/UX practices for hostapp-new

Concrete patterns and traps discovered while building the patient sidebar, the shared
`Modal` component, and the ICPC/G-Standaard/Allergie contraindication features. Follow
these by default for new UI work in this app; deviate deliberately, not accidentally.

This app intentionally has some fields still using `<label>` for a multi-button
component (e.g. the "Allergieën" field) — that was an explicit user decision accepting
the known bug, not an oversight. Don't "fix" it without asking first.

## Section headers

Two tiers, two conventions — don't mix them up:

- **Top-level headers** (the sidebar title "Patiëntinformatie", the "Resultaat" heading
  in the Prescriptor results view, and every modal's title via `Modal`'s `title` input)
  use `<label class="header-text">Text</label>` (or, in `Modal`, the `<h2>` it already
  renders internally). `.header-text` is the distinct Bitter-font/1.05rem/500-weight
  style — keep using it for these.
- **Everything else** — subsection headings within a view (e.g. "Medicatie", "Adviezen")
  and the sidebar field titles ("ICPC contraindicaties", "Allergieën", etc.) — use a bare
  `<label>Text</label>` with **no** extra classes at all: not `<h2>`/`<h3>`, not
  `.header-text`, not one-off utility classes like `text-sm font-medium text-gray-900`.
  The global `label` rule in `@layer base` (see below) already gives it
  `display: block; font-weight: 500;`, which is enough.

## CSS cascade layers (critical)

Any custom global rule added to `src/styles.css` for a bare element selector (`label`,
`th`, `button`, etc.) **must** live inside `@layer base { ... }`. Tailwind's own utility
classes live in `@layer utilities`, and in CSS cascade layers, rules *outside* any
`@layer` always beat rules *inside* a `@layer` — regardless of specificity or source
order. An unlayered `label { display: block; }` will silently override a component's
`class="flex"` on a `<label>`, breaking layout with no warning and no obvious cause.

```css
/* Wrong: wins over every Tailwind utility class unconditionally */
label { display: block; font-weight: 500; }

/* Right: normal cascade rules apply, so utility classes on individual elements win */
@layer base {
  label { display: block; font-weight: 500; }
}
```

When a component's Tailwind classes appear to have "no effect," check whether a global
rule in `styles.css` is unlayered before assuming the component markup is wrong.

## Modal component (`shared/modal/modal.ts`)

Single reusable base: `open` (required boolean input), `title` (string input), `close`
(output), an icon slot via `<ng-content select="[modalIcon]" />` wrapped in its own
`<span>` so its size can be forced with `[&>svg]:size-X` (an `<ng-content>` placeholder
itself cannot take a `class`/attribute — Angular disallows it; wrap it in a real element
instead).

Built-in behavior, centralized once instead of duplicated per modal:
- Backdrop click and `Escape` close the modal.
- `Tab`/`Shift+Tab` are trapped within the dialog.
- Previously-focused element is remembered and restored on close.
- On open, focuses an `[autofocus]`-marked descendant if present, otherwise the dialog
  panel itself. To make a modal's search/name input grab focus on open, just add a
  plain `autofocus` attribute to that one input — don't add a second focus-management
  effect in the child modal, it will race with Modal's own.

## CDK drag-and-drop vs. click (critical)

Don't put `cdkDrag` on a whole row that also needs a reliable `(click)` handler — CDK's
pointer-capture can swallow the row's native `click` event even without an actual drag
occurring, causing "click to select" to stop firing once drag is added to a row.

Fix: give the row a dedicated small drag handle (e.g. a grip icon) marked with
`cdkDragHandle`, and keep `cdkDrag` on the row. Only the handle can *start* a drag; the
rest of the row's `(click)` fires normally.

```html
<tr cdkDrag cdkDragLockAxis="y" (click)="choosePatient(patient.id)">
  <td>
    <svg cdkDragHandle lucideGripVertical class="cursor-grab active:cursor-grabbing"></svg>
  </td>
  ...
</tr>
```

## Row-click-opens-X + inline actions

When a row/card should open something on click, but also contains its own action
buttons (edit, delete, move up/down), attach `(click)` to the row/container and call
`event.stopPropagation()` in every nested button's own handler before it does its
thing, so the row click doesn't also fire:

```ts
protected deleteOne(id: string, event: Event) {
  event.stopPropagation();
  this.store.deletePatient(id);
}
```

## Search + debounce + async resource

- Debounce the raw input with a plain `signal` + `setTimeout`/`clearTimeout` (~300ms),
  writing into a second "debounced" signal that actually drives the request.
- Use `resource({ params, loader })` for the async search. Return `undefined` from
  `params` (e.g. when the term is under 2 characters) instead of guarding inside the
  loader — the resource goes `idle` and the loader doesn't run at all, giving a clean
  `status()` (`idle` / `loading` / `error` / resolved) to branch UI states on.
- When a mode should disable other functionality (e.g. searching disables drag-reorder),
  derive it with `computed()` from the search term and thread it through as
  `[cdkDropListDisabled]` / `[cdkDragDisabled]` / `[disabled]`, with a dimmed
  `cursor-not-allowed` visual cue on anything disabled.

## JSONP and CORS

Don't assume a third-party endpoint's shape or CORS behavior — check with
`curl -i "<url>"` first. Two different situations need two different fixes:

- **True JSONP** (`Content-Type: application/javascript`, response wraps the payload in
  a callback function call): use Angular's built-in `HttpClient.jsonp(url, 'callback')`
  (requires `provideHttpClient(withJsonpSupport())`). Angular auto-generates the
  callback name; a server that just echoes back whatever `callback=` value it's given
  (most JSONP endpoints) works fine — no need to match some app's original callback
  name literally.
- **Plain JSON, no CORS headers**: set up an `ng serve` dev proxy — `proxy.conf.json` +
  `angular.json`'s `serve.options.proxyConfig` — and call a **relative** path from app
  code. Works via the proxy in dev, and works natively same-origin in production if
  deployed to that host. Two gotchas specific to the new Vite-based
  `@angular/build:dev-server`: glob syntax differs from the old builder (`/path/*`
  matches one segment only; use `/path/**` for nested paths), and proxy config changes
  require a full dev-server **restart**, not just a rebuild.

## DTO-to-domain mapping

Keep API response shapes (snake_case fields, wrapped envelopes like
`{ patient: {...} }`, extra unused fields like `created_at`) out of components and
stores entirely. Map them to a clean internal domain type inside the service that talks
to the API, via a small `toX(dto)` function. Components/stores only ever see the clean
shape.

## Store / service split

- `@Service()` (Angular v22+) for new singleton services, not
  `@Injectable({ providedIn: 'root' })`.
- Split the HTTP boundary (`XApiService`, talks to the backend, does DTO mapping) from
  the app-facing state (`XStore`, holds signals, calls the API service, translates
  thrown errors into `loadError`/`actionError` signals for the UI to render).
- For reorder/persist-order operations: update local state immediately (optimistic, for
  a snappy drag/arrow-button UX), persist in the background, and on failure surface an
  error and resync from the server rather than leaving local state silently diverged.

## Signal Forms

Prefer `@angular/forms/signals` (`form()`, `FormField`, `required()`/`min()`/`max()`
with a custom `{ message }`) over reactive/template-driven forms for new forms. Don't
also set `min`/`max` as static HTML attributes when the schema already declares them —
`[formField]` syncs those automatically, and Angular errors at compile time if you set
them a second time statically.

Disable the submit button while an async submit is in flight (a `submitting` signal),
and show failures as an inline bordered red box near the button, not a toast/alert.

## Icons

Use `@lucide/angular` (the maintained package — **not** the deprecated `lucide-angular`
name). Usage: `<svg lucideIconName [size]="16"></svg>`, imported per-icon into the
component's `imports` array. Icons default to `stroke="currentColor"`, so they already
match surrounding text color — don't hardcode a color on an icon unless it's meant to
differ from the adjacent text.

## Field + modal pattern (search/select features)

The ICPC, G-Standaard, and Allergie contraindication features all follow one consistent
shape — reuse it for the next one instead of inventing a new structure:

1. A small **field** component: a card/button showing the current selection(s), opens a
   **modal** on click.
2. A **modal** component wrapping the shared `Modal`, with a debounced, autofocused
   search input and a result list where each row is a `<label>` + checkbox (safe here —
   exactly one control per row) toggling membership in a small **store**.
3. A dedicated **store** per domain holding just that feature's selected items as a
   signal, with `add`/`remove`.

## Workflow

- Verify real backend/third-party behavior with `curl` before writing code against an
  assumed response shape.
- After every change: `ng build` to catch compile errors, then push to the running dev
  server and verify via `curl` or actual interaction — don't just trust that the code
  "looks right."
- The IDE's language-server diagnostics frequently lag behind real file state (stale
  cache). Trust a fresh `ng build` result over a stale diagnostic before investigating
  further.
