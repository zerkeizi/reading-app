# Collective catalog

A collective catalog of books read. Anyone can browse the catalog; logged-in users mark books as read, with a date, rating, and review. Books come from OpenLibrary.

## How to run

```sh
docker compose up
```

The app starts at http://localhost:3000. On the first run the database is created, migrated, and seeded with sample data.

Sample users (password `password`): `cecilia@example.com`, `bruno@example.com`, `ana@example.com`.

Tests:

```sh
docker compose run --rm web bundle exec rspec
```

**Stack:** Ruby 3.3.9, Rails 8.1, PostgreSQL 16, React + TypeScript via Inertia.js (Vite, Tailwind), RSpec + WebMock, Pundit, Faraday, Kaminari.

## Technical decisions

### Duplicate book registration
Books registered in the catalog have a `unique` external identifier, `external_id`, in the `books` table, which represents their identifier in the external service (OpenLibrary). This value is used as a reference to ensure the same book is never registered twice.

### OpenLibrary unavailable or returning empty responses
- **Empty response** (status 200, no results): the modal shows "No books found".
- **Unavailable** (timeout, connection error, 5xx, 429, or invalid JSON): the search responds with 503 and the modal warns that OpenLibrary is down; adding a new book creates nothing.

### Access to `/books.json`
Public: it exposes the same data as the home page, which is already public. Read-only, no user data, with the same filters and pagination as the home page, and a limit of 60 requests per minute.

```sh
curl "http://localhost:3000/books.json?q=tolkien&field=author"
```

### Editing a book by the user who registered it
The project description mentions that Cecília comes back to the platform and edits the book she registered. I believe data such as title, publication year, and genre should be read-only, since it doesn't make much sense to change them once they are pulled from Open Library with already-correct data.

With that in mind, once a user registers a book that wasn't in the catalog, it becomes part of the collection, even if that same user later removes it from their read books. The fields open for editing live in the pivot table `readings` responsible for the association between `books` and `users`, and they are: read on (`read_on`), rating (`rate`), and review (`review`).

### The paginated book list
It is ordered by most recently read books. This rule relies on a column called `last_read_at` in the `books` table, which is updated EVERY time a new book is registered. I chose this approach to keep the data consistent for the ordering rule. In the future, in a scenario where disk writes become too heavy, this column should probably be computed by a background job, improving performance at the expense of consistency.

### Architecture
- **Rails decides, React displays**: data, rules, and permissions live in Rails; React receives everything ready-made as Inertia props (including whether the user can edit something).
- **OpenLibrary through the backend** (as suggested, using Faraday): the browser sends only the `external_id` of the chosen book and the server fetches the data again, guaranteeing the integrity of each book's data.
- **Authentication** with Rails 8's built-in generator instead of a gem like Devise. The controllers live in the app, rendering pages through Inertia without overriding anything.
- **Authorization with Pundit**: since the book is shared, "editing/removing a book" means editing/removing your reading of it, and only its owner can do that.
- **Filters**: the search select chooses the filtered field (Author, Genre, or Year). The list is ordered by most recent reading and paginated with Kaminari, 9 per page.


## With more time

1. Improve user registration:
  - In the form, require password confirmation and complexity
  - Email confirmation
  - Password recovery

2. Covers independent from OpenLibrary, stored in our own service.

3. Add other services to keep the app redundant in case OpenLibrary is unavailable.

4. A confirmation modal when marking a book as unread, plus soft delete — today the system deletes the record in the pivot table, sending the rating and review into the void.

5. Also update `last_read_at` when the user changes their `read_on` to a date more recent than the current one. E.g.: the person read the book again — it should show up at the top of the catalog.

## AI usage
I used Claude Code as my pair-programming partner throughout the project.

- **Plan mode** for every larger feature: the AI wrote the plan and asked me the open questions; it only started coding after my approval.
- **Step by step**, reviewing and committing each step before the next one, with manual approval of every command and edit.
- **Skills**: `todo`, which records decisions and tracks tasks in a `todo.txt` file, and `rails-mentor`, which comments the suggested code so I can explain every line.
- **Parallel subtasks (/subtasks)** for questions outside the current step (why call OpenLibrary from the backend, how to store images in Rails, a summary of the OpenLibrary API).
- **Verification** of each step in the running application, in addition to the tests, which caught bugs the tests didn't.

**Example of an incorrect AI suggestion:** when planning the models, the AI proposed a 1-n relationship between users and books. That would store the same book once per reader. I rejected it and asked for an n-n model: `books` is a shared catalog and `readings` links users and books, with each one's date, rating, and review. This decision shaped the rest of the application.
