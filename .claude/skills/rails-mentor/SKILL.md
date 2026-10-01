---
name: rails-mentor
description: The author is new to Rails (comes from Node). Use whenever creating a plan, proposing next steps, or suggesting Ruby/Rails code (models, migrations, controllers, routes, policies, specs, config) in this project — annotate the code with explanatory comments and explain Rails conventions/DSLs instead of assuming them.
---

# Teaching while building

The author is an experienced developer, but new to Ruby on Rails. They usually work in
Node/TypeScript, and they must be able to explain every line of this project to the reviewers.
Treat each plan and code suggestion as a chance to teach the Rails part, not just to deliver it.

## When creating a plan or suggesting code

1. **Comment the code you suggest.** Every Rails-specific line gets a short comment saying what it
   does and why it is written that way. Focus on what a Node developer would not guess:
   - DSL calls that look like keywords but are methods: `has_many`, `belongs_to`, `validates`,
     `before_action`, `resources`, `t.references`, `scope`.
   - Ruby syntax: symbols (`:name`), hash shorthand (`{ books: }`), blocks (`do |t| ... end`),
     implicit returns, `?`/`!` method suffixes, safe navigation (`&.`), endless methods (`def x = y`).
   - Magic by convention: names that wire things up implicitly (`BooksController` ↔ `resources
     :books` ↔ `app/frontend/pages/books/index.tsx`, `user_id` ↔ `belongs_to :user`, fixtures
     referencing `user: one`).
   Keep comments to one line each; don't comment plain Ruby that reads like any language.

2. **Name the convention behind each step.** When a step relies on a Rails convention (plural
   controllers, singular models, RESTful actions, `db/schema.rb` being generated, migrations being
   immutable once shared), say so in one sentence and what would break if it were ignored.

3. **Map to Node/PHP when it helps.** A short comparison is often the fastest explanation, e.g.
   "`before_action` ≈ Express middleware scoped to this controller", "a migration ≈ a Knex/Prisma
   migration", "`Current.user` ≈ request-scoped context like `req.user`".

4. **Show where things live.** Give the file path for every snippet and, the first time a
   directory appears (`app/policies/`, `spec/requests/`, `config/initializers/`), say what goes there.

5. **Explain generator output.** When a step uses `bin/rails g ...`, list what files it creates and
   which ones the author should edit before running the next command (e.g. migrations before
   `db:migrate`). Commands run inside Docker: `docker compose run --rm web bin/rails ...`.

6. **Point out the "why" for README material.** If a step embodies a decision worth defending to
   reviewers, flag it in one line so it can go into the README's technical decisions.

## Keep it proportionate

- Don't explain the same concept again in the same conversation unless asked; refer back instead.
- Plain answers to quick questions don't need the full treatment — this is for plans and code.
- Comments explain *Rails*; don't pad them with obvious narration.

## Example

```ruby
# app/models/reading.rb
class Reading < ApplicationRecord           # ApplicationRecord = base model class, maps to the "readings" table by name
  belongs_to :user                          # expects a user_id column; adds reading.user and validates presence
  belongs_to :book

  validates :book_id, uniqueness: { scope: :user_id }  # one reading per (user, book); DB unique index backs it up
  after_create_commit { book.update_column(:last_read_at, created_at) }  # runs after the INSERT commits; update_column skips validations/callbacks
end
```
