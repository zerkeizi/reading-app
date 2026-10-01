# Finds a catalog book by its OpenLibrary work key, or creates it from OpenLibrary's own data.
# The browser only sends the key: title, author, year, genre and cover always come from OpenLibrary.
class BookImporter
  def self.call(external_id) = new.call(external_id)

  # Returns the Book, or nil when OpenLibrary doesn't know the key.
  # Raises OpenLibrary::Unavailable when the book is new and OpenLibrary can't be reached.
  def call(external_id)
    Book.find_by(external_id:) || import(external_id)
  end

  private
    def import(external_id)
      result = OpenLibrary::Client.new.find(external_id) or return
      Book.create!(result.book_attributes)
    rescue ActiveRecord::RecordNotUnique
      # Someone added the same new book at the same time: the unique index kept one row, use it
      Book.find_by!(external_id:)
    end
end
