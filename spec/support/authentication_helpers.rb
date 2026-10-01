module AuthenticationHelpers
  # Logs in through the real SessionsController, like a browser would.
  def sign_in(user, password: "password")
    post session_path, params: { email_address: user.email_address, password: }
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
end
