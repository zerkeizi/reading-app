class RegistrationsController < ApplicationController
  allow_unauthenticated_access

  def create
    user = User.new(params.permit(:name, :email_address, :password))

    if user.save
      start_new_session_for user
      redirect_back_or_to root_path, notice: "Welcome, #{user.name}!"
    else
      redirect_back_or_to root_path, inertia: { errors: user.errors.to_hash(true) }
    end
  end
end
