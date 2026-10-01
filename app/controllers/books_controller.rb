class BooksController < InertiaController
  allow_unauthenticated_access only: %i[index show]
  # Public actions skip require_authentication, so the session must be resumed to know who is logged in
  before_action :resume_session, only: %i[index show]
  after_action :verify_authorized

  def index
    authorize Book
    books = policy_scope(Book).order(Book.arel_table[:last_read_at].desc.nulls_last)

    render inertia: {
      books: books.as_json(only: %i[id title author publication_year genre], methods: :cover_url)
    }
  end

  def show
    book = Book.find(params[:id])
    authorize book

    render inertia: {
      book: book.as_json(only: %i[id title author publication_year genre], methods: :cover_url),
      readings: book.readings.includes(:user).order(created_at: :desc).map do |reading|
        {
          id: reading.id,
          rate: reading.rate&.to_f,
          review: reading.review,
          read_on: reading.read_on,
          reader: reading.user.name,
          can_edit: policy(reading).update?
        }
      end
    }
  end
end
