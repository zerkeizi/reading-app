require "rails_helper"

RSpec.describe "Sessions", type: :request do
  fixtures :users

  # Requests sent by the auth modal: Inertia visits made from the book page
  let(:inertia_headers) { { "X-Inertia" => "true", "Referer" => books_url } }

  describe "POST /session from the auth modal" do
    it "signs in and goes back to the page the modal was opened on" do
      post session_path, params: { email_address: users(:one).email_address, password: "password" }, headers: inertia_headers

      expect(response).to redirect_to(books_url)
      expect(cookies[:session_id]).to be_present
    end

    it "returns a form error on a wrong password, without signing in" do
      post session_path, params: { email_address: users(:one).email_address, password: "wrong" }, headers: inertia_headers

      expect(response).to redirect_to(books_url)
      expect(cookies[:session_id]).to be_blank

      follow_redirect!
      expect(inertia.props[:errors]).to include(:email_address)
    end
  end

  describe "POST /session from the ERB login page" do
    it "returns to the protected page the guest tried to open" do
      get profile_path
      post session_path, params: { email_address: users(:one).email_address, password: "password" }

      expect(response).to redirect_to(profile_url)
    end
  end

  describe "DELETE /session" do
    it "signs out and lands on the public catalog" do
      sign_in users(:one)

      delete session_path

      expect(response).to redirect_to(root_path)
      expect(response).to have_http_status(:see_other)
    end
  end
end
