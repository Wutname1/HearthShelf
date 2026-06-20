# HearthShelf

Browser-first, self-hosted replacement UI/UX for [AudiobookShelf](https://www.audiobookshelf.org/) (ABS).

HearthShelf is **mostly the face** - ABS remains the backend server and the source of truth
for all library data, playback, and progress. HearthShelf runs as a self-hosted Docker
container (a static SPA served via nginx) plus one small backend of its own, QuestGiver,
which holds HearthShelf-specific state (app settings, AI recommendation config/history,
request/feedback data) in an embedded SQLite database. It never duplicates ABS data, does no
file management, and all library data comes from a user-configured ABS server via its REST
API and Socket.io interface.

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

## License

HearthShelf is licensed under the **GNU Affero General Public License v3.0**
(AGPLv3) - see [LICENSE.md](LICENSE.md). The AGPL's network clause means anyone
who runs a modified HearthShelf as a network service must make their source
available.

Contributions are welcome and must be signed off under the Developer Certificate
of Origin (`git commit -s`). See [CONTRIBUTING.md](CONTRIBUTING.md) and
[AGENTS.md](AGENTS.md).

## Legal / disclaimer

HearthShelf is a user interface. It does **not** host, store, source, or
distribute audiobooks, ebooks, or any other content, and it is not affiliated
with AudiobookShelf.

**You are responsible for the legality of the content you add to your library
and for any backends or services you connect to HearthShelf.** Integrations that
talk to external services (for example ReadMeABook) are opt-in, unconfigured by
default, and source-agnostic: you supply the backend and are responsible for it.
HearthShelf provides the plumbing, not the content, and is not a means of
obtaining it.
