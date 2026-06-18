# HearthShelf

Browser-first, self-hosted replacement UI/UX for [AudiobookShelf](https://www.audiobookshelf.org/) (ABS).

HearthShelf is **only the face** - ABS remains the backend server. HearthShelf runs as a
self-hosted Docker container (a static SPA served via nginx) with no backend, no database,
and no file management. All data comes from a user-configured ABS server via its REST API
and Socket.io interface.

- Domain: hearthshelf.com
- Stack: React 19 + TypeScript, Vite, Tailwind v4, shadcn/ui, TanStack Query, Zustand,
  React Router, socket.io-client, nginx + Docker

## Documentation

Full specs live in [`docs/`](docs/README.md). Start with the
[project overview](docs/overview.md) and [architecture](docs/architecture.md).

For contributor guidance and critical rules, see [CLAUDE.md](CLAUDE.md).

## Status

v0.1 - spec stage. See [docs/scope.md](docs/scope.md) for what's in and out of v0.1, and
[docs/init-commands.md](docs/init-commands.md) to scaffold the project.
