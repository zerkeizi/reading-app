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

    it "sends the member-since year and the number of read books" do
      users(:one).update_column(:created_at, Time.zone.local(2024, 5, 1))
      sign_in users(:one)

      get profile_path

      expect(inertia.props[:user]["member_since"]).to eq(2024)
      expect(inertia.props[:readings_count]).to eq(1)
    end

    it "lists readings by read date, newest first, undated ones last" do
      user = users(:one)
      old_book = Book.create!(title: "Old", external_id: "/works/OLOLD")
      undated_book = Book.create!(title: "Undated", external_id: "/works/OLUNDATED")
      readings(:one_dune).update!(read_on: Date.new(2026, 9, 20))
      Reading.create!(user:, book: old_book).update!(read_on: Date.new(2025, 1, 1))
      Reading.create!(user:, book: undated_book).update!(read_on: nil)
      sign_in user

      get profile_path

      expect(inertia.props[:readings].map { |reading| reading[:book]["title"] }).to eq([ "Dune", "Old", "Undated" ])
    end
  end
end
