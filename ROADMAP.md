# Roadmap

Platform to host nonprofits with multiple chapters. The Angular app already has chapter UI (home, projects, where we stand, events, auth/manage); content is mostly static and the Node server is a stub. This roadmap covers turning that into a multi-tenant, configurable platform.

## Themes and branding

- [ ] **Home page template selection** — Let each chapter pick from a set of home page layouts instead of a single hard-coded template.
- [ ] **Color customization** — Per-organization brand colors (CSS variables / theme tokens) applied across the chapter site.

## Dynamic content

- [ ] **Dynamic home page content** — Store and serve home copy, featured items, and CTAs from the API (replace hard-coded home content).
- [ ] **Dynamic project page content** — Manage project stories, sections, updates, and galleries via the API (replace `project-data.ts` / static assets as the source of truth).
- [ ] **Dynamic where we stand content** — Drive project status groupings (in progress / planned / completed) from the same project data API.

## Access control

- [ ] **Permissions based on organization and user** — Authorize actions by org membership and user role, not a single global chapter assumption.
- [ ] **Global admins** — Platform-level admins who can manage organizations and cross-chapter settings.
- [ ] **Chapter-specific admins and officers** — Org-scoped `admin` / `officer` roles for content and chapter settings (extends the existing manage UI roles).

## Platform operations

- [ ] **Global onboarding tools** — Flows and admin tools to stand up a new organization/chapter (branding, admins, initial content).
- [ ] **Image uploads** — Server-backed storage for content and project images.
- [ ] **Multi-tenant SSO** — Sign-in scoped per organization/tenant (IdP configuration and session isolation across chapters).
