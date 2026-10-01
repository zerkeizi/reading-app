class Reading < ApplicationRecord
  belongs_to :user
  belongs_to :book

  validates :book_id, uniqueness: { scope: :user_id }
  validates :rate, inclusion: { in: (0.5..5).step(0.5).to_a }, allow_nil: true

  after_create_commit { book.update_column(:last_read_at, created_at) }
end
