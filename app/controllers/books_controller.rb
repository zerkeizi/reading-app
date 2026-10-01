class BooksController < InertiaController
  allow_unauthenticated_access only: :index
  # Public actions skip require_authentication, so the session must be resumed to know who is logged in
  before_action :resume_session, only: :index
  after_action :verify_authorized

  def index
    authorize Book
    books = policy_scope(Book).order(Book.arel_table[:last_read_at].desc.nulls_last)

    render inertia: {
      books: books.as_json(only: %i[id title author publication_year genre], methods: :cover_url)
    }
  end
end
