require "rails_helper"

RSpec.describe BookImporter do
  fixtures :books

  let(:search_url) { %r{\Ahttps://openlibrary\.org/search\.json} }

  def stub_work(fixture: "openlibrary/search_dune.json", status: 200)
    stub_request(:get, search_url)
      .to_return(status:, body: file_fixture(fixture).read, headers: { "Content-Type" => "application/json" })
  end

  it "returns a book already in the catalog without calling OpenLibrary" do
    book = described_class.call(books(:dune).external_id)

    expect(book).to eq(books(:dune))
    expect(WebMock).not_to have_requested(:get, search_url)
  end

  it "creates a new book from OpenLibrary's data" do
    stub_work
    books(:dune).destroy

    book = nil
    expect { book = described_class.call("/works/OL893414W") }.to change(Book, :count).by(1)
    expect(book).to have_attributes(title: "Dune", author: "Frank Herbert", publication_year: 1965,
                                    cover_id: 11481354, genre: "Ficção científica", external_id: "/works/OL893414W")
  end

  it "returns nil when OpenLibrary doesn't know the key" do
    stub_work(fixture: "openlibrary/search_empty.json")

    expect(described_class.call("/works/OL0W")).to be_nil
  end

  it "raises Unavailable when a new book can't be fetched" do
    stub_request(:get, search_url).to_timeout

    expect { described_class.call("/works/OL0W") }.to raise_error(OpenLibrary::Unavailable)
  end

  it "returns the existing row when the same book was created concurrently" do
    stub_work
    existing = books(:dune)
    # Simulate the race: the lookup misses, then the INSERT hits the unique index
    allow(Book).to receive(:find_by).and_return(nil)
    allow(Book).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique)
    allow(Book).to receive(:find_by!).with(external_id: "/works/OL893414W").and_return(existing)

    expect(described_class.call("/works/OL893414W")).to eq(existing)
  end
end
