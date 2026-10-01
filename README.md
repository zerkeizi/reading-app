# Reading App

A collective catalog of books read

## Stack

- Ruby 3.3.9, Rails 8.1
- PostgreSQL 16
- React + TypeScript via Inertia.js, Vite, Tailwind CSS
- RSpec + WebMock
- Faraday (OpenLibrary HTTP client)
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

What is covered (`spec/`):
- **Models**: validations, associations, the `filter_by` search scope, `last_read_at` kept in sync, cover URLs.
- **Policies**: Pundit rules for owner / other user / guest (`BookPolicy`, `ReadingPolicy`).
- **Requests**: catalog (filters, pagination, read state), `/books.json`, book page, profile, sessions, sign-up, readings (create/update/destroy, ownership), book search endpoint.
- **OpenLibrary integration** (WebMock, no real HTTP in tests; JSON fixtures in `spec/fixtures/files/openlibrary/`): result mapping, empty results, timeout / 500 / 429 / invalid JSON → unavailable, caching, import by `external_id` (new, existing, unknown, concurrent), 503 from the search endpoint, nothing created when OpenLibrary is down.

## Technical decisions

### Duplicate book registration
A book is shared, not owned: `books` is the catalog and `readings` is the pivot between users and books (read date, rate, review). A catalog entry is one OpenLibrary **work** (a book across all its editions), identified by `external_id` (`/works/OL893414W`), unique in the model and with a database index.

- **Adding a work that is already in the catalog** only creates your reading; no second `Book` row, and no request to OpenLibrary.
- **Adding a book you already read** is rejected by the `[user_id, book_id]` uniqueness (validation + index). The add-book search marks those results as "Lido".
- **Two people adding the same new work at once**: the unique index keeps one row; `BookImporter` rescues `RecordNotUnique` and uses it.
- The browser sends only the `external_id`. Title, author, year, genre and cover are fetched by the server from OpenLibrary (`q=key:<id>`), so a tampered request can't create fake catalog data.

### OpenLibrary unavailable or empty responses
OpenLibrary is only needed to **search and add new books**; the catalog, book pages, profiles, `/books.json` and adding a book that is already in the catalog all work from our own data.

- **Empty result** (HTTP 200, `numFound: 0`) is not an error: the modal shows "Nenhum livro encontrado".
- **Unavailable** (timeouts of 3s to connect / 5s to answer, connection errors, 5xx, 429/403, invalid JSON) becomes one `OpenLibrary::Unavailable` error. The search endpoint answers **503** with a message ("A busca do OpenLibrary está indisponível…"), shown in the modal instead of an empty list; adding a new book redirects back with an alert and creates nothing.
- **Load on OpenLibrary**: it allows 1–3 requests/s per app. The client sends a `User-Agent` identifying the app, searches are **cached for 12h** by normalized title (failures are never cached), the modal debounces typing (200 ms, 2+ characters, stale requests aborted) and the endpoint is rate-limited per user (30/min).
- Covers are loaded straight from OpenLibrary's cover server; while it's down the UI shows placeholders (see "With more time").

### Access level of `/books.json`
**Public**, because it is the same data the public home page already shows ("qualquer pessoa que acessa a home encontra a lista"): same filters (`q`, `field`), order and pagination (`page`, 9 per page), plus `external_id` and `last_read_at`. It is read-only and has **no user data** (no `reading_id`, even when signed in). Rate-limited to 60 requests/min per client, only for the JSON format.

```sh
curl "http://localhost:3000/books.json?q=tolkien&field=author"
```

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

### OpenLibrary data mapping
- `external_id` ← `key` (the work key), `title` ← `title`, `publication_year` ← `first_publish_year`, `cover_id` ← `cover_i`.
- `author` ← **all** `author_name` entries joined ("Neil Gaiman, Terry Pratchett"), so the author filter finds the book by any of them.
- `genre` ← OpenLibrary's `subject` list is noisy (places, awards, `nyt:` lists). An allow-list maps subjects to Portuguese genres, and **the genre matched by the most subjects wins** (ties go to the more specific genre): The Hobbit has 14 fantasy subjects and one stray "science fiction", so it's "Fantasia"; Dune is "Ficção científica". Plain "Fiction" is a fallback ("Ficção"); no match → no genre.

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
