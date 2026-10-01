module OpenLibrary
  # One search result (a work), mapped to Book columns. Every field except the key may be missing.
  Result = Data.define(:external_id, :title, :author, :publication_year, :cover_id, :genre) do
    def self.from_doc(doc)
      new(
        external_id: doc["key"],
        title: doc["title"],
        author: Array(doc["author_name"]).join(", ").presence,
        publication_year: doc["first_publish_year"],
        cover_id: doc["cover_i"],
        genre: Genre.from_subjects(doc["subject"])
      )
    end

    def book_attributes = to_h

    def cover_url(size = "M") = Book.cover_url_for(cover_id, size)
  end
end
