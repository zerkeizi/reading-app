class Book < ApplicationRecord
  has_many :readings, dependent: :destroy
  has_many :readers, through: :readings, source: :user

  validates :title, presence: true
  validates :external_id, presence: true, uniqueness: true

  COVER_SIZES = %w[S M L].freeze
  FILTER_FIELDS = %w[author genre year].freeze

  # Home search: the select picks which field the text filters by (challenge filters: author, genre, year)
  scope :filter_by, ->(field, query) {
    query = query.to_s.strip
    next all if query.empty?

    case field
    when "year" then where(publication_year: query.to_i)
    when "genre" then where("genre ILIKE ?", "%#{sanitize_sql_like(query)}%")
    else where("author ILIKE ?", "%#{sanitize_sql_like(query)}%")
    end
  }

  # Covers are served by OpenLibrary; only their id (cover_i in search results) is stored.
  def cover_url(size = "M")
    return if cover_id.blank?
    raise ArgumentError, "unknown cover size: #{size}" unless COVER_SIZES.include?(size)

    "https://covers.openlibrary.org/b/id/#{cover_id}-#{size}.jpg"
  end
end
