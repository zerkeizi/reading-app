class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_back_or_to root_path, alert: "Muitas tentativas. Tente novamente em alguns minutos." }

  def new
  end

  # Two clients: the auth modal (Inertia request, stays on the current page) and the ERB login page,
  # still used as a fallback when a guest opens a protected URL such as /profile.
  def create
    if user = User.authenticate_by(params.permit(:email_address, :password))
      start_new_session_for user
      request.inertia? ? redirect_back_or_to(root_path) : redirect_to(after_authentication_url)
    elsif request.inertia?
      redirect_back_or_to root_path, inertia: { errors: { email_address: [ "E-mail ou senha inválidos." ] } }
    else
      redirect_to new_session_path, alert: "E-mail ou senha inválidos."
    end
  end

  def destroy
    terminate_session
    redirect_to root_path, status: :see_other
  end
end
