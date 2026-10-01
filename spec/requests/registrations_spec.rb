require "rails_helper"

RSpec.describe "Registrations", type: :request do
  fixtures :users

  let(:headers) { { "X-Inertia" => "true", "Referer" => books_url } }
  let(:valid_params) { { name: "Cecília", email_address: "cecilia@example.com", password: "password" } }

  describe "POST /registration" do
    it "creates the user, signs them in and goes back" do
      expect { post registration_path, params: valid_params, headers: }.to change(User, :count).by(1)

      expect(response).to redirect_to(books_url)
      expect(cookies[:session_id]).to be_present
    end

    it "returns validation errors to the form without creating a user" do
      invalid_params = valid_params.merge(name: "", email_address: users(:one).email_address)

      expect { post registration_path, params: invalid_params, headers: }.not_to change(User, :count)

      follow_redirect!
      expect(inertia.props[:errors]).to include(:name, :email_address)
    end
  end
end
