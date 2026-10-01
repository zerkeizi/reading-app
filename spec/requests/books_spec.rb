require "rails_helper"

RSpec.describe "Books", type: :request do
  fixtures :users, :books, :readings

  describe "GET /" do
    it "is public: guests see the catalog without a current user" do
      get root_path

      expect(response).to have_http_status(:ok)
      expect_inertia.to render_component("books/index")
      expect(inertia.props[:current_user]).to be_nil
    end

    it "shares the signed-in user with the page" do
      sign_in users(:one)
      get root_path

      expect(response).to have_http_status(:ok)
      expect(inertia.props[:current_user]).to include("id" => users(:one).id, "name" => users(:one).name)
    end

    it "lists books by latest reading, with unread books last" do
      unread = Book.create!(title: "Unread", external_id: "/works/OLUNREAD")
      recent = Book.create!(title: "Recent", external_id: "/works/OLRECENT")
      Reading.create!(user: users(:two), book: recent)

      get root_path

      titles = inertia.props[:books].map { |book| book["title"] }
      expect(titles).to eq([ recent.title, books(:dune).title, unread.title ])
    end
  end

  describe "GET /books" do
    it "renders the same catalog" do
      get books_path

      expect(response).to have_http_status(:ok)
      expect_inertia.to render_component("books/index")
    end
  end

  describe "GET /books/:id" do
    let(:book) { books(:dune) }

    it "is public and lists the book's readings" do
      get book_path(book)

      expect(response).to have_http_status(:ok)
      expect_inertia.to render_component("books/show")
      expect(inertia.props[:book]).to include("id" => book.id, "title" => book.title)
      expect(inertia.props[:readings].map { |reading| reading[:reader] }).to eq([ users(:one).name ])
    end

    it "sends the rate as a number, not a string" do
      get book_path(book)

      expect(inertia.props[:readings].first[:rate]).to eq(4.5)
    end

    it "lets only the owner edit their reading" do
      Reading.create!(user: users(:two), book:)
      sign_in users(:one)

      get book_path(book)

      permissions = inertia.props[:readings].to_h { |reading| [ reading[:reader], reading[:can_edit] ] }
      expect(permissions).to eq(users(:one).name => true, users(:two).name => false)
    end

    it "does not let guests edit anything" do
      get book_path(book)

      expect(inertia.props[:readings].map { |reading| reading[:can_edit] }).to all(be false)
    end

    it "returns 404 for an unknown book" do
      get book_path(id: 0)

      expect(response).to have_http_status(:not_found)
    end
  end
end
