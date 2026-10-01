class ProfilesController < InertiaController
  after_action :verify_policy_scoped

  # Singular resource (/profile, no id): it is always the signed-in user's own profile
  def show
    readings = policy_scope(Reading).includes(:book).order(created_at: :desc)

    render inertia: {
      user: Current.user.as_json(only: %i[id name email_address]),
      readings: readings.map do |reading|
        {
          id: reading.id,
          rate: reading.rate&.to_f,
          review: reading.review,
          read_on: reading.read_on,
          book: reading.book.as_json(only: %i[id title author], methods: :cover_url)
        }
      end
    }
  end
end
