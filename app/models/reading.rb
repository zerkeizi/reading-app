class Reading < ApplicationRecord
  belongs_to :user
  belongs_to :book

  validates :book_id, uniqueness: { scope: :user_id }
  validates :rate, inclusion: { in: (0.5..5).step(0.5).to_a }, allow_nil: true

  after_create_commit { book.update_column(:last_read_at, created_at) }
  after_destroy_commit :recompute_book_last_read_at

  private
    # Back to the newest remaining reading (nil when none). A query instead of book.update_column,
    # so it is a no-op when the book itself was destroyed along with its readings.
    def recompute_book_last_read_at
      Book.where(id: book_id).update_all(last_read_at: Reading.where(book_id:).maximum(:created_at))
    end
end
