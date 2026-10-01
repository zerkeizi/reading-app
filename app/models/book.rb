class Book < ApplicationRecord
  has_many :readings, dependent: :destroy
  has_many :readers, through: :readings, source: :user

  validates :title, presence: true
  validates :external_id, presence: true, uniqueness: true

  COVER_SIZES = %w[S M L].freeze

  # Covers are served by OpenLibrary; only their id (cover_i in search results) is stored.
  def cover_url(size = "M")
    return if cover_id.blank?
    raise ArgumentError, "unknown cover size: #{size}" unless COVER_SIZES.include?(size)

    "https://covers.openlibrary.org/b/id/#{cover_id}-#{size}.jpg"
  end
end
