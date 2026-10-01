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
