# Portal Page Builder (Puck)

A drag-and-drop builder that lets org admins assemble **public, branded portal
pages** from a set of safe, data-aware blocks — no code. Built on
[@measured/puck](https://puckeditor.com).

## How to use it (as an org admin)

1. Log in to the web app (`admin@acmecorp.com` / `Admin@123`).
2. Go to **Dashboard → Portals**.
3. Type a name (e.g. "Help Center") and click **Create**.
4. Click **Open builder** on the new portal card.
5. In the builder:
   - Drag blocks from the left panel onto the canvas.
   - Select a block to edit its fields on the right.
   - Click **Publish** (Puck's button, top-right) to **save the page layout**.
6. Click **Make public** (top bar) to make the portal live.
7. Click **View public** to open it — public, no login required.

## Public URLs (three ways to reach a portal)

- **Pretty slug:** `/portal/<orgSlug>/<portalSlug>` (what "View public" links to)
- **By id:** `/p/<portalId>` (always works)
- **Custom domain:** set a `customDomain` on the portal; middleware rewrites that
  domain's root to the portal. (Point the domain's DNS at the app; locally you
  can test with `curl -H "Host: help.acme.com" http://localhost:3000/`.)

> Two different "publish" actions: Puck's **Publish** saves the *page design*;
> the **Make public** toggle controls whether the portal is *visible to the world*.

## Blocks

| Block | What it does |
| ----- | ------------ |
| **Hero** | Title, subtitle, CTA button |
| **Text section** | Heading + body (rendered as plain text — no HTML injection) |
| **Call to action** | Message + button |
| **FAQ** | Repeatable question/answer list |
| **Testimonials** | Repeatable quote / author / role cards |
| **Video embed** | YouTube/Vimeo URL → responsive iframe (only those hosts are embedded) |
| **Image** | Image URL + alt + caption |
| **Courses (live)** | Renders the org's **published courses**, live from the API |
| **Articles (live)** | Renders the org's **published knowledge-base articles**, live |

The "live" blocks are the point: the page always reflects current published
content for that organization — no manual updates.

## How it works

- **Storage:** the Puck document is saved as JSON in `Portal.pageJson` (Postgres) —
  no external service, works on-prem / dedicated instances.
- **Editing:** `apps/web/src/app/dashboard/portals/[portalId]` dynamically loads
  the client-only editor (`components/builder/PortalEditor.tsx`). Blocks are
  defined once in `src/lib/puck.config.tsx`.
- **Public render:** `apps/web/src/app/p/[portalId]` is a server component using
  Puck's lightweight `rsc` renderer (~0 KB editor JS on the public page). It
  fetches `GET /portals/public/:id`, which returns the page JSON **plus** the
  org's published courses/articles, injected into the blocks via Puck `metadata`.
- **Security:** blocks are your own React components (no arbitrary HTML/JS), the
  Text block renders as plain text, and the public endpoint serves a portal only
  when `isPublic` is true (404 otherwise).

## API

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/portals` | create (ORG_ADMIN) |
| GET | `/portals` | list org portals |
| GET | `/portals/:id` | get one |
| GET | `/portals/:id/data` | published courses+articles for the builder |
| PATCH | `/portals/:id` | update (name, `isPublic`, color, logo) |
| PUT | `/portals/:id/page` | save the Puck page JSON |
| DELETE | `/portals/:id` | delete |
| GET | `/portals/public/:id` | **public** render payload (only if `isPublic`) |

## Extending it

Add a new block by adding one entry to `portalConfig.components` in
`apps/web/src/lib/puck.config.tsx` — define its `fields`, `defaultProps`, and a
`render` function (use `puck.metadata` for live data). It appears in the builder
and renders on public pages automatically.

## Roadmap (not in v1)

- Slug / custom-domain routing (currently public pages are `/p/<id>`).
- Brand-color theming from `BrandingConfig` applied to blocks.
- More blocks (FAQ, testimonials, instructor bio, embedded video).
