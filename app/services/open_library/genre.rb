module OpenLibrary
  # Picks one genre from OpenLibrary's noisy `subject` list (places, awards, "nyt:" lists, translations...).
  # The genre matched by the most subjects wins: The Hobbit has 14 fantasy subjects and one stray
  # "science fiction". Ties go to the earlier entry; "Ficção" only when no specific genre matches.
  # Returns nil when nothing matches.
  module Genre
    FALLBACK = "Ficção"
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
      /classic/i => "Clássico"
    }.freeze

    def self.from_subjects(subjects)
      subjects = Array(subjects)
      votes = PRIORITY.to_h { |pattern, genre| [ genre, subjects.count { |subject| subject.match?(pattern) } ] }
      best, count = votes.max_by.with_index { |(_, count), index| [ count, -index ] }

      return best if count.positive?
      FALLBACK if subjects.any? { |subject| subject.match?(/\Afiction\z/i) }
    end
  end
end
