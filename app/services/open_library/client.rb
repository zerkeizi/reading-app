module OpenLibrary
  # Search API client. See docs/openlib_api.md for the fields, limits and response format.
  class Client
    BASE_URL = ENV.fetch("OPENLIBRARY_URL", "https://openlibrary.org")
    FIELDS = "key,title,author_name,first_publish_year,cover_i,subject".freeze
    CACHE_TTL = 12.hours

    # Searches works by title. Results are cached by normalized title: OpenLibrary allows 1-3 requests/s
    # and asks clients not to use it as a high-traffic backend. Failures raise, so they are never cached.
    def search(title, limit: 8)
      Rails.cache.fetch([ "openlibrary", "search", title.downcase.squish, limit ], expires_in: CACHE_TTL) do
        get(title:, limit:)
      end
    end

    # Fetches one work by its key ("/works/OL893414W"), so stored data comes from OpenLibrary,
    # not from what the browser sent. Returns nil for an unknown key.
    def find(external_id)
      get(q: "key:#{external_id}", limit: 1).first
    end

    private
      def get(params)
        response = connection.get("/search.json", params.merge(fields: FIELDS))
        raise Unavailable, "OpenLibrary answered HTTP #{response.status}" unless response.success?

        Array(response.body["docs"]).map { |doc| Result.from_doc(doc) }
      rescue Faraday::Error => e
        raise Unavailable, e.message
      end

      def connection
        @connection ||= Faraday.new(
          url: BASE_URL,
          headers: { "User-Agent" => "ReadingApp (#{ENV.fetch("OPENLIBRARY_CONTACT", "dev@example.com")})" },
          request: { open_timeout: 3, timeout: 5 }
        ) do |faraday|
          faraday.response :json
        end
      end
  end
end
