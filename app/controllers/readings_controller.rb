class ReadingsController < ApplicationController
  before_action :set_reading, only: %i[update destroy]
  after_action :verify_authorized

  # "Lido" toggle / "+ Adicionar leitura": marks an existing catalog book as read by the current user
  def create
    reading = Current.user.readings.new(book: Book.find(params[:book_id]), read_on: Date.current)
    authorize reading

    if reading.save
      redirect_back_or_to book_path(reading.book), notice: "Leitura adicionada."
    else
      redirect_back_or_to book_path(reading.book), inertia: { errors: reading.errors.to_hash(true) }
    end
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
