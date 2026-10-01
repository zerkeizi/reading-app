module OpenLibrary
  # Picks one genre from OpenLibrary's noisy `subject` list (places, awards, "nyt:" lists, translations...).
  # Patterns are checked in priority order, specific genres first: Dune lists "Fiction" before
  # "Science fiction" and should end up as "Ficção científica". Returns nil when nothing matches.
  module Genre
    PRIORITY = {
      /dystopi/i => "Distopia",
      /science.fiction/i => "Ficção científica",
      /fantasy/i => "Fantasia",
      /historical fiction/i => "Ficção histórica",
      /mystery|detective/i => "Mistério",
      /horror/i => "Terror",
      /thriller|suspense/i => "Suspense",
      /romance|love stories/i => "Romance",
      /biograph/i => "Biografia",
      /poetry/i => "Poesia",
      /histor/i => "História",
      /classic/i => "Clássico",
      /\Afiction\z/i => "Ficção"
    }.freeze

    def self.from_subjects(subjects)
      subjects = Array(subjects)
      PRIORITY.each do |pattern, genre|
        return genre if subjects.any? { |subject| subject.match?(pattern) }
      end
      nil
    end
  end
end
