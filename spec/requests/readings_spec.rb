require "rails_helper"

RSpec.describe "Readings", type: :request do
  fixtures :users, :books, :readings

  let(:book) { books(:dune) }
  let(:own_reading) { readings(:one_dune) }
  let(:headers) { { "X-Inertia" => "true", "Referer" => book_url(book) } }

  describe "POST /readings" do
    it "marks the book as read for the signed-in user" do
      sign_in users(:two)

      expect { post readings_path, params: { book_id: book.id }, headers: }.to change(users(:two).readings, :count).by(1)
      expect(response).to redirect_to(book_url(book))
      expect(users(:two).readings.last.read_on).to eq(Date.current)
    end

    it "returns an error when the user already read the book" do
      sign_in users(:one)

      expect { post readings_path, params: { book_id: book.id }, headers: }.not_to change(Reading, :count)

      follow_redirect!
      expect(inertia.props[:errors]).to include(:book_id)
    end

    it "returns 404 for an unknown book" do
      sign_in users(:one)

      post readings_path, params: { book_id: 0 }, headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it "sends guests to the login page" do
      expect { post readings_path, params: { book_id: book.id } }.not_to change(Reading, :count)
      expect(response).to redirect_to(new_session_path)
    end
  end

  describe "POST /readings with an OpenLibrary external_id (Add Book modal)" do
    let(:search_url) { %r{\Ahttps://openlibrary\.org/search\.json} }

    before { sign_in users(:two) }

    def stub_work(fixture: "openlibrary/search_dune.json")
      stub_request(:get, search_url)
        .to_return(status: 200, body: file_fixture(fixture).read, headers: { "Content-Type" => "application/json" })
    end

    it "imports a new book with OpenLibrary's data and opens its page" do
      stub_work
      books(:dune).destroy

      expect { post readings_path, params: { external_id: "/works/OL893414W", title: "Fake title" }, headers: }
        .to change(Book, :count).by(1).and change(users(:two).readings, :count).by(1)

      book = Book.find_by!(external_id: "/works/OL893414W")
      expect(book.title).to eq("Dune")
      expect(response).to redirect_to(book_path(book))
    end

    it "reuses a book already in the catalog without calling OpenLibrary" do
      expect { post readings_path, params: { external_id: book.external_id }, headers: }
        .to change(users(:two).readings, :count).by(1).and not_change(Book, :count)

      expect(WebMock).not_to have_requested(:get, search_url)
    end

    it "creates nothing when OpenLibrary is unavailable" do
      stub_request(:get, search_url).to_timeout

      expect { post readings_path, params: { external_id: "/works/OL0W" }, headers: }
        .to not_change(Book, :count).and not_change(Reading, :count)

      expect(flash[:alert]).to match(/OpenLibrary indisponível/)
    end

    it "creates nothing for a key OpenLibrary doesn't know" do
      stub_work(fixture: "openlibrary/search_empty.json")

      expect { post readings_path, params: { external_id: "/works/OL0W" }, headers: }.not_to change(Book, :count)

      expect(flash[:alert]).to match(/não encontrado/)
    end
  end

  describe "PATCH /readings/:id" do
    let(:changes) { { read_on: "2026-09-01", rate: 3.5, review: "Mudou minha vida." } }

    it "lets the owner update read_on, rate and review" do
      sign_in users(:one)

      patch reading_path(own_reading), params: changes, headers: headers

      expect(response).to redirect_to(book_url(book))
      expect(response).to have_http_status(:see_other)
      expect(own_reading.reload).to have_attributes(read_on: Date.new(2026, 9, 1), rate: 3.5, review: "Mudou minha vida.")
    end

    it "returns validation errors for an invalid rate" do
      sign_in users(:one)

      patch reading_path(own_reading), params: { rate: 2.3 }, headers: headers

      expect(own_reading.reload.rate).to eq(4.5)
      follow_redirect!
      expect(inertia.props[:errors]).to include(:rate)
    end

    it "does not let another user change it" do
      sign_in users(:two)

      patch reading_path(own_reading), params: changes, headers: headers

      expect(own_reading.reload.review).to be_nil
      expect(flash[:alert]).to be_present
    end

    it "ignores attributes that are not editable" do
      sign_in users(:one)

      patch reading_path(own_reading), params: { user_id: users(:two).id, book_id: 0 }, headers: headers

      expect(own_reading.reload).to have_attributes(user_id: users(:one).id, book_id: book.id)
    end
  end

  describe "DELETE /readings/:id" do
    it "lets the owner remove it, keeping the book" do
      sign_in users(:one)

      expect { delete reading_path(own_reading), headers: }.to change(Reading, :count).by(-1)
      expect(response).to have_http_status(:see_other)
      expect(Book.exists?(book.id)).to be true
    end

    it "does not let another user remove it" do
      sign_in users(:two)

      expect { delete reading_path(own_reading), headers: }.not_to change(Reading, :count)
    end

    it "sends guests to the login page" do
      expect { delete reading_path(own_reading) }.not_to change(Reading, :count)
      expect(response).to redirect_to(new_session_path)
    end
  end
end
