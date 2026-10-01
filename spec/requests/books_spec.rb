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
end
