class ProfilesController < InertiaController
  after_action :verify_policy_scoped

  # Singular resource (/profile, no id): it is always the signed-in user's own profile
  def show
    readings = policy_scope(Reading)
                 .includes(:book)
                 .order(Reading.arel_table[:read_on].desc.nulls_last, created_at: :desc)

    render inertia: {
      user: Current.user.as_json(only: %i[id name email_address]).merge(member_since: Current.user.created_at.year),
      readings_count: readings.size,
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
