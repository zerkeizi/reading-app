class BooksController < InertiaController
  PER_PAGE = 9

  allow_unauthenticated_access only: %i[index show]
  # Public actions skip require_authentication, so the session must be resumed to know who is logged in
  before_action :resume_session, only: %i[index show]
  after_action :verify_authorized

  def index
    authorize Book
    field = Book::FILTER_FIELDS.include?(params[:field]) ? params[:field] : "author"
    books = policy_scope(Book)
              .filter_by(field, params[:q])
              .order(Book.arel_table[:last_read_at].desc.nulls_last, :id)
              .page(params[:page]).per(PER_PAGE)
    reading_ids = reading_ids_for(books)

    render inertia: {
      books: books.map { |book| book_props(book).merge(reading_id: reading_ids[book.id]) },
      filters: { q: params[:q].to_s, field: },
      pagination: { page: books.current_page, total_pages: books.total_pages, total_count: books.total_count }
    }
  end

  def show
    book = Book.find(params[:id])
    authorize book

    render inertia: {
      book: book_props(book),
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

  private
    def book_props(book)
      book.as_json(only: %i[id title author publication_year genre], methods: :cover_url)
    end

    # { book_id => reading_id } for the signed-in user's readings among these books, in one query
    def reading_ids_for(books)
      return {} unless Current.user

      Current.user.readings.where(book_id: books.map(&:id)).pluck(:book_id, :id).to_h
    end
end
