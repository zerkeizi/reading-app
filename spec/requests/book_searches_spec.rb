require "rails_helper"

RSpec.describe "Book searches", type: :request do
  fixtures :users, :books, :readings

  let(:search_url) { %r{\Ahttps://openlibrary\.org/search\.json} }
  let(:json_headers) { { "Accept" => "application/json" } }

  def stub_search(status: 200, fixture: "openlibrary/search_dune.json")
    stub_request(:get, search_url)
      .to_return(status:, body: file_fixture(fixture).read, headers: { "Content-Type" => "application/json" })
  end

  describe "GET /book_searches" do
    it "sends guests to the login page" do
      get book_searches_path, params: { q: "dune" }, headers: json_headers

      expect(response).to redirect_to(new_session_path)
      expect(WebMock).not_to have_requested(:get, search_url)
    end

    context "when signed in" do
      before { sign_in users(:one) }

      it "returns OpenLibrary's results, marking the ones the user already read" do
        stub_search

        get book_searches_path, params: { q: "dune" }, headers: json_headers

        expect(response).to have_http_status(:ok)
        dune, good_omens = response.parsed_body["results"]
        expect(dune).to include("external_id" => books(:dune).external_id, "title" => "Dune", "author" => "Frank Herbert",
                                "publication_year" => 1965, "read" => true,
                                "cover_url" => "https://covers.openlibrary.org/b/id/11481354-S.jpg")
        expect(good_omens).to include("author" => "Neil Gaiman, Terry Pratchett", "cover_url" => nil, "read" => false)
      end

      it "does not call OpenLibrary for a query shorter than 2 characters" do
        get book_searches_path, params: { q: " d " }, headers: json_headers

        expect(response.parsed_body).to eq("results" => [])
        expect(WebMock).not_to have_requested(:get, search_url)
      end

      it "returns an empty list when nothing matches" do
        stub_search(fixture: "openlibrary/search_empty.json")

        get book_searches_path, params: { q: "zzqqxx" }, headers: json_headers

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq("results" => [])
      end

      it "answers 503 with a message when OpenLibrary is unavailable" do
        stub_request(:get, search_url).to_timeout

        get book_searches_path, params: { q: "dune" }, headers: json_headers

        expect(response).to have_http_status(:service_unavailable)
        expect(response.parsed_body["error"]).to be_present
      end
    end
  end
end
