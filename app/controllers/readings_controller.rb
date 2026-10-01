class ReadingsController < ApplicationController
  before_action :set_reading, only: %i[update destroy]
  after_action :verify_authorized

  # Marks a book as read by the current user. Two entry points:
  # - book_id: "Lido" toggle / "+ Adicionar leitura" on a book already in the catalog
  # - external_id: a pick in the Add Book modal; the book is imported from OpenLibrary when it's new
  def create
    authorize Reading
    from_search = params[:external_id].present?
    book = from_search ? BookImporter.call(params[:external_id]) : Book.find(params[:book_id])
    return redirect_back_or_to(root_path, alert: "Livro não encontrado no OpenLibrary.") unless book

    reading = Current.user.readings.new(book:, read_on: Date.current)
    unless reading.save
      return redirect_back_or_to(book_path(book), inertia: { errors: reading.errors.to_hash(true) })
    end

    if from_search
      redirect_to book_path(book), notice: "Leitura adicionada."     # open the new book's page so it can be rated right away
    else
      redirect_back_or_to book_path(book), notice: "Leitura adicionada."
    end
  rescue OpenLibrary::Unavailable
    redirect_back_or_to root_path, alert: "OpenLibrary indisponível: não foi possível adicionar o livro agora."
  end

  # "Salvar" on the book page: only the owner can change read_on, rate and review
  def update
    if @reading.update(reading_params)
      redirect_back_or_to book_path(@reading.book), notice: "Leitura salva.", status: :see_other
    else
      redirect_back_or_to book_path(@reading.book), inertia: { errors: @reading.errors.to_hash(true) }, status: :see_other
    end
  end

  # "Marcar como não lido": removes the reading, the book stays in the catalog
  def destroy
    @reading.destroy
    redirect_back_or_to book_path(@reading.book), notice: "Leitura removida.", status: :see_other
  end

  private
    def set_reading
      @reading = Reading.find(params[:id])
      authorize @reading
    end

    def reading_params
      params.permit(:read_on, :rate, :review)
    end
end
