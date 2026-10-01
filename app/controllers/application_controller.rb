class ApplicationController < ActionController::Base
  include Authentication
  include Pundit::Authorization

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  # 303 See Other: after a PATCH/DELETE, Inertia needs it so the browser follows the redirect with a GET
  rescue_from Pundit::NotAuthorizedError do
    redirect_back_or_to root_path, alert: "You are not allowed to do that.", status: :see_other
  end

  private
    # Pundit asks for pundit_user (current_user by default); Rails 8 authentication keeps the user in Current
    def pundit_user = Current.user
end
