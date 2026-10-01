# Reading App

Technical challenge (spec in Portuguese: `challenge.md`): a public, collective catalog of books read.

- Public home: paginated book list (newest first), filters by author / genre / publication year; header shows Sign up/Login, or the user's name when logged in.
- Logged in: create books, and edit/delete **only your own** (authorization gem: Pundit or CanCanCan).
- Book creation: user types a title → **backend** queries the OpenLibrary API (Faraday/HTTParty) → React UI lists results → selection fills author/year and creates the book.
- Simple JSON endpoint (`/books.json`).
- Open decisions that must be justified in the README: duplicate books, OpenLibrary unavailable/empty responses, access level of `/books.json`.
- README must have: run instructions (reviewers will try `docker compose up`), technical decisions, "with more time", and an AI usage section (incl. one example where the AI was wrong and how it was fixed).
- Nice to have: GitHub Actions (RuboCop + tests), Kubernetes Deployment/Service manifests, Kaminari, caching, structured logging.

## Stack

- Ruby 3.3.9, Rails 8.1, PostgreSQL 16
- Frontend (planned): React + TypeScript via Inertia.js (Vite)
- Tests (planned): RSpec (app generated with `-T`, no Minitest) + WebMock for OpenLibrary stubs; must cover models, requests, and the external API integration.
- Initial boilerplate commit must stay isolated. Don't squash or amend it.

## Docker (local development)

- `Dockerfile.dev` + `docker-compose.yml` are for development: source is bind-mounted into `/rails`, gems live in the `bundle` named volume, and the container runs as UID 1000.
- `Dockerfile` is the Rails-generated **production** image (Kamal/Kubernetes). Don't use it for dev.
- `bin/docker-dev-entrypoint` removes a stale `server.pid` and runs `db:prepare` when starting the server.
- DB connection comes from `DB_HOST` / `DB_USERNAME` / `DB_PASSWORD` in `config/database.yml` (set by compose). Don't use `DATABASE_URL` in dev because it would override the test database name.

Common commands:

```sh
docker compose up                 # app at http://localhost:3000
docker compose run --rm web bin/rails <cmd>     # generators, migrations, console
docker compose run --rm web bundle install      # after changing the Gemfile
docker compose run --rm web bundle exec rspec   # (once RSpec is installed)
docker compose build              # after changing Dockerfile.dev
```
