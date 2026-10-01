# Reading App

A collective catalog of books read

## Stack

- Ruby 3.3.9, Rails 8.1
- PostgreSQL 16
- React + TypeScript via Inertia.js, Vite, Tailwind CSS
- RSpec + WebMock
- Pundit (authorization), Kaminari (pagination)
- Docker

## Getting started

Requirements: Docker and Docker Compose.

```sh
docker compose up
```

The app is served at http://localhost:3000. The database is created and migrated automatically on startup by `bin/docker-dev-entrypoint`.

Useful commands:

```sh
docker compose run --rm web bin/rails <cmd>     # generators, migrations, console
docker compose run --rm web bundle install      # after changing the Gemfile
docker compose run --rm web bundle exec rspec   # run the test suite
docker compose build                            # after changing Dockerfile.dev
```

### Mock data (Seed)
users:
  - cecilia@example.com
  - bruno@example.com
  - ana@example.com

password: 
  - password

## TESTS

```sh
docker compose run --rm web bundle exec rspec
```

<!-- TODO: coverage notes (what is covered: models, requests, OpenLibrary integration) -->

## Technical decisions

### Duplicate book registration
<!-- TODO: decision + justification (a many-to-many User <-> Book design via a readings pivot is being considered, not final) -->

### OpenLibrary unavailable or empty responses
<!-- TODO: behavior on timeouts/errors/empty results + justification -->

### Access level of `/books.json`
<!-- TODO: who can access the endpoint + justification -->

### Local Docker setup
Development uses a separate `Dockerfile.dev` and `docker-compose.yml`: the source is bind-mounted, gems live in a named volume, the container runs as a non-root user (UID 1000), and Node is included for Vite. The Rails-generated `Dockerfile` is kept untouched as the production image.

The DB connection is configured through `DB_HOST` / `DB_USERNAME` / `DB_PASSWORD` instead of `DATABASE_URL`, because `DATABASE_URL` would override the test database name. A custom entrypoint removes a stale `tmp/pids/server.pid` (it persists across container restarts because the source is bind-mounted) and runs `db:prepare`.

### Ruby 3.3.9 instead of 3.3.0
`rails new` pinned the host's Ruby 3.3.0, which has a parser bug (fixed in 3.3.1) that rejects anonymous `*`/`**` parameters used inside blocks. Rails 8.1's ActionView (`capture_helper.rb`) uses that syntax, so the app failed to boot with `anonymous rest parameter is also used within block (SyntaxError)`. Ruby was bumped to the latest 3.3 patch release.

### Authentication
Uses the Rails 8 built-in authentication generator instead of Devise. The generated controllers live in the app, so rendering Inertia pages from them is trivial, whereas Devise's gem-owned controllers and ERB views would need overriding. Sign-up is not provided by the generator and is implemented separately; a `name` column was added to `users`.

Sign-in and sign-up live in a modal instead of separate pages, so the user never leaves the page they were on: the controllers redirect back, and validation errors return through Inertia's `errors`. The generated ERB login page is kept only as a fallback for guests opening a protected URL directly. `/profile` is a singular resource (no id in the URL), so only your own profile exists.

### Authorization
Pundit over CanCanCan: policies are explicit plain Ruby objects, easy to unit test with RSpec, and permissions can be passed to React as Inertia props. CanCanCan centralizes rules in a single `Ability` class and relies on the more implicit `load_and_authorize_resource`.

The challenge asks that only the author can edit or remove a book. Here a book is shared by many readers (see the readings pivot) and its data comes from OpenLibrary, so "editing/removing a book" means editing/removing **your reading** of it:

- `BookPolicy`: anyone can list books, signed-in users can register them, nobody can edit or delete them.
- `ReadingPolicy`: only the owner can update or destroy a reading. Without it, any signed-in user could change `/readings/:id` to someone else's id (IDOR).
- `verify_authorized` runs after each action of resource controllers, so an action that forgets to call `authorize` fails loudly instead of being silently open.

### Rating (not asked)

A reading's rate goes from 0.5 to 5 in half steps (Letterboxd-like), stored as `decimal(2,1)`. The design shows five square buttons; each square is split into two clickable halves, so the five squares cover all ten values and a half value shows as a half-filled square. Props cast the rate with `to_f`, because Rails serializes `BigDecimal` as a JSON string.

### Catalog search, filters and pagination

The challenge asks for filters by author, genre and publication year; the design has a single search box joined to a select. The select picks **which field the text filters by** (Autor / Gênero / Ano), so the requirement fits the design's control: author and genre match partially and case-insensitively (`ILIKE`, with user-typed `%`/`_` escaped), the year matches exactly. Filters live in the URL (`?q=&field=`), so results can be shared and survive pagination. The list is sorted by latest reading (`books.last_read_at`, kept in sync when readings are created or removed) and paginated with Kaminari, 9 per page (the 3×3 grid).

### Frontend (wireframe phase)

The screens follow a low-fidelity wireframe handoff: black, grays and white, Arial Black headings, no rounded corners. Those choices live in Tailwind `@theme` tokens (`bg-ink`, `font-heading`…) and a few UI primitives (`Button`, `Cover`, `Avatar`, `RatingSquares`), so the final visual style can replace them without touching pages. One persistent layout (header, flash, modals, "+" button) is set once in `createInertiaApp`. Modals use the native `<dialog>` (backdrop, Esc and focus trap from the browser). UI copy is in Portuguese.

### Testing

RSpec + Rails fixtures + WebMock only, deliberately minimal. Upgrades would be warranted when:

- **factory_bot**: tests need many per-test record variations, or shared fixtures start coupling unrelated specs.
- **shoulda-matchers**: there are many models with standard validations.
- **faker**: large, realistic seed data is needed.

Generators are configured to skip view, helper and routing specs (and helpers), since views are React.

## With more time

- **Password reset**: provided by the Rails 8 authentication generator but removed to keep scope focused, since it depends on email delivery. Would bring it back with a dev mail preview (e.g. `letter_opener_web`).
- **Book covers independent of OpenLibrary**: covers are loaded straight from OpenLibrary (`books.cover_id` → `covers.openlibrary.org`), so while it is down the catalog shows placeholders instead of covers. Next steps, in order of effort:
  - ~~a placeholder in the UI for missing or failed covers~~ (done: `Cover` falls back to a placeholder on `onError`);
  - a background job downloading each cover once into Active Storage when the book is created, keeping `cover_id` to re-fetch it, so the catalog works fully without OpenLibrary;
  - shared storage (S3 or similar) for that copy in production, since local disk is per server/pod.

- **Portuguese validation messages**: UI copy and flash messages are in Portuguese, but model validation errors still use Rails' English defaults ("Name can't be blank"). Next step: the `rails-i18n` gem with `pt-BR` as default locale.
- **Confirmation before "Marcar como não lido"**: one click deletes the reading's rating and review; the design has no confirmation step.
- **Richer book data**: series, page count, tags and description from the OpenLibrary works API (the design shows them; only the search data is stored now).
- **Content Security Policy**: Rails' CSP initializer is still commented out; enabling it (report-only first) needs the Vite dev-server exceptions in development.

<!-- TODO: other items left out or done differently, and why this prioritization -->

## AI usage
<!-- TODO: brief description of how AI assistants were used -->

### Example: incorrect or incomplete AI suggestion
<!-- TODO: at least one real example where the AI suggested something incorrect/incomplete and how it was fixed -->

## CI
<!-- TODO: GitHub Actions pipeline running RuboCop and RSpec on every push -->

## Kubernetes
<!-- TODO: example Deployment/Service manifests and how to apply them -->
