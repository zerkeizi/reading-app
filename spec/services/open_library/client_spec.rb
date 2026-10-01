require "rails_helper"

RSpec.describe OpenLibrary::Client do
  subject(:client) { described_class.new }

  let(:search_url) { %r{\Ahttps://openlibrary\.org/search\.json} }
  let(:dune_json) { file_fixture("openlibrary/search_dune.json").read }

  def stub_search(body: dune_json, status: 200)
    stub_request(:get, search_url).to_return(status:, body:, headers: { "Content-Type" => "application/json" })
  end

  describe "#search" do
    it "maps each work to a result with Book attributes" do
      stub_search

      dune, good_omens = client.search("dune")

      expect(dune).to have_attributes(external_id: "/works/OL893414W", title: "Dune", author: "Frank Herbert",
                                      publication_year: 1965, cover_id: 11481354, genre: "Ficção científica")
      expect(dune.cover_url).to eq("https://covers.openlibrary.org/b/id/11481354-M.jpg")
      expect(good_omens).to have_attributes(author: "Neil Gaiman, Terry Pratchett", cover_id: nil, genre: nil)
    end

    it "asks only for the fields it uses, by title, identifying the app" do
      stub_search

      client.search("  Dune ")

      expect(WebMock).to have_requested(:get, search_url)
        .with(query: hash_including("title" => "  Dune ", "fields" => described_class::FIELDS, "limit" => "8"),
              headers: { "User-Agent" => /\AReadingApp \(.+\)\z/ })
    end

    it "returns an empty list when nothing matches" do
      stub_search(body: file_fixture("openlibrary/search_empty.json").read)

      expect(client.search("zzqqxx")).to eq([])
    end

    it "raises Unavailable on a server error" do
      stub_search(status: 500, body: "")

      expect { client.search("dune") }.to raise_error(OpenLibrary::Unavailable, /500/)
    end

    it "raises Unavailable when rate limited" do
      stub_search(status: 429, body: "")

      expect { client.search("dune") }.to raise_error(OpenLibrary::Unavailable, /429/)
    end

    it "raises Unavailable on a timeout" do
      stub_request(:get, search_url).to_timeout

      expect { client.search("dune") }.to raise_error(OpenLibrary::Unavailable)
    end

    it "raises Unavailable on invalid JSON" do
      stub_search(body: "<html>maintenance</html>")

      expect { client.search("dune") }.to raise_error(OpenLibrary::Unavailable)
    end

    context "with a cache store" do
      around do |example|
        original = Rails.cache
        Rails.cache = ActiveSupport::Cache::MemoryStore.new
        example.run
      ensure
        Rails.cache = original
      end

      it "reuses results for the same title, ignoring case and extra spaces" do
        stub_search

        client.search("Dune")
        client.search("  dune ")

        expect(WebMock).to have_requested(:get, search_url).once
      end

      it "does not cache failures" do
        stub_request(:get, search_url).to_return({ status: 503, body: "" },
                                                  { status: 200, body: dune_json, headers: { "Content-Type" => "application/json" } })

        expect { client.search("dune") }.to raise_error(OpenLibrary::Unavailable)
        expect(client.search("dune").first.title).to eq("Dune")
      end
    end
  end

  describe "#find" do
    it "looks a work up by its key" do
      stub_search

      result = client.find("/works/OL893414W")

      expect(result.title).to eq("Dune")
      expect(WebMock).to have_requested(:get, search_url).with(query: hash_including("q" => "key:/works/OL893414W", "limit" => "1"))
    end

    it "returns nil for an unknown key" do
      stub_search(body: file_fixture("openlibrary/search_empty.json").read)

      expect(client.find("/works/OL0W")).to be_nil
    end
  end
end
