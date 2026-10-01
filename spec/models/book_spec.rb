require "rails_helper"

RSpec.describe Book, type: :model do
  fixtures :users, :books, :readings

  subject(:book) { books(:dune) }

  it "is valid with valid attributes" do
    expect(book).to be_valid
  end

  describe "validations" do
    it "requires a title" do
      book.title = ""
      expect(book).not_to be_valid
      expect(book.errors[:title]).to be_present
    end

    it "requires an external_id" do
      book.external_id = nil
      expect(book).not_to be_valid
      expect(book.errors[:external_id]).to be_present
    end

    it "rejects a duplicate external_id" do
      duplicate = Book.new(title: "Dune (another edition)", external_id: book.external_id)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:external_id]).to be_present
    end

    it "is enforced by the database even when validations are skipped" do
      duplicate = Book.new(title: "Dune", external_id: book.external_id)
      expect { duplicate.save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "associations" do
    it "lists its readers through readings" do
      expect(book.readers).to contain_exactly(users(:one))
    end

    it "destroys its readings when destroyed" do
      expect { book.destroy }.to change(Reading, :count).by(-1)
    end
  end

  describe ".filter_by" do
    let!(:tolkien) { Book.create!(title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", publication_year: 1937, external_id: "/works/OLHOBBIT") }
    let!(:percent) { Book.create!(title: "100% Fun", author: "100% Author", external_id: "/works/OLPERCENT") }

    it "matches part of the author, ignoring case" do
      expect(Book.filter_by("author", "tolk")).to contain_exactly(tolkien)
    end

    it "matches part of the genre, ignoring case" do
      expect(Book.filter_by("genre", "fanta")).to contain_exactly(tolkien)
    end

    it "matches the exact publication year" do
      expect(Book.filter_by("year", "1937")).to contain_exactly(tolkien)
      expect(Book.filter_by("year", "193")).to be_empty
    end

    it "returns every book for a blank query" do
      expect(Book.filter_by("author", "  ")).to match_array(Book.all)
    end

    it "treats LIKE wildcards in the query as plain text" do
      expect(Book.filter_by("author", "%")).to contain_exactly(percent)
    end

    it "filters by author when the field is unknown" do
      expect(Book.filter_by("title", "tolk")).to contain_exactly(tolkien)
    end
  end

  describe "#cover_url" do
    it "builds the OpenLibrary cover URL in medium size by default" do
      expect(book.cover_url).to eq("https://covers.openlibrary.org/b/id/#{book.cover_id}-M.jpg")
    end

    it "accepts the S and L sizes" do
      expect(book.cover_url("S")).to end_with("-S.jpg")
      expect(book.cover_url("L")).to end_with("-L.jpg")
    end

    it "is nil when the book has no cover" do
      book.cover_id = nil
      expect(book.cover_url).to be_nil
    end

    it "rejects an unknown size" do
      expect { book.cover_url("XL") }.to raise_error(ArgumentError)
    end
  end
end
