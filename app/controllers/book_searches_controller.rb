# JSON endpoint for the Add Book modal: the backend queries OpenLibrary, React only lists the results.
class BookSearchesController < ApplicationController
  MIN_QUERY_LENGTH = 2

  # OpenLibrary allows 1-3 requests/s for the whole app; the modal already debounces typing
  rate_limit to: 30, within: 1.minute, by: -> { Current.user&.id || request.remote_ip },
             with: -> { render json: { error: "Muitas buscas seguidas. Aguarde um pouco." }, status: :too_many_requests }
  after_action :verify_authorized

  def index
    authorize Book, :create?
    query = params[:q].to_s.squish
    return render(json: { results: [] }) if query.length < MIN_QUERY_LENGTH

    results = OpenLibrary::Client.new.search(query)
    render json: { results: results.map { |result| result_json(result, read_book_ids(results)) } }
  rescue OpenLibrary::Unavailable
    render json: { error: "A busca do OpenLibrary está indisponível. Tente novamente em instantes." },
           status: :service_unavailable
  end

  private
    def result_json(result, read_ids)
      result.to_h.slice(:external_id, :title, :author, :publication_year)
            .merge(cover_url: result.cover_url("S"), read: read_ids.include?(result.external_id))
    end

    # external_ids of these results that the current user already read (one query, memoized)
    def read_book_ids(results)
      @read_book_ids ||= Current.user.readings.joins(:book)
                                .where(books: { external_id: results.map(&:external_id) })
                                .pluck("books.external_id").to_set
    end
end
