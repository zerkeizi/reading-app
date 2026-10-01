require "rails_helper"

RSpec.describe "Profiles", type: :request do
  fixtures :users, :books, :readings

  describe "GET /profile" do
    it "redirects guests to the login page" do
      get profile_path

      expect(response).to redirect_to(new_session_path)
    end

    it "shows the signed-in user and only their own readings" do
      other_book = Book.create!(title: "Other", external_id: "/works/OLOTHER")
      Reading.create!(user: users(:two), book: other_book)
      sign_in users(:one)

      get profile_path

      expect(response).to have_http_status(:ok)
      expect_inertia.to render_component("profiles/show")
      expect(inertia.props[:user]).to include("name" => users(:one).name)
      expect(inertia.props[:readings].map { |reading| reading[:book]["title"] }).to eq([ books(:dune).title ])
    end
  end
end
