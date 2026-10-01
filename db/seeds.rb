# Demo data for local development and reviewers. Idempotent: safe to run more than once.
# Load with: docker compose run --rm web bin/rails db:seed
# Every demo user logs in with the password "password".

users = [
  { name: "Cecília", email_address: "cecilia@example.com" },
  { name: "Bruno", email_address: "bruno@example.com" },
  { name: "Ana", email_address: "ana@example.com" }
].to_h do |attrs|
  user = User.find_or_create_by!(email_address: attrs[:email_address]) do |u|
    u.name = attrs[:name]
    u.password = "password"
  end
  [ attrs[:email_address].split("@").first.to_sym, user ]
end

# external_id and cover_id checked against OpenLibrary's search API (2026-10-01). Genres use the same
# Portuguese names the OpenLibrary import produces (OpenLibrary::Genre), picked by hand for the demo.
books = [
  { key: :dune, title: "Dune", author: "Frank Herbert", publication_year: 1965, genre: "Ficção científica", external_id: "/works/OL893414W", cover_id: 11481354 },
  { key: :hobbit, title: "The Hobbit", author: "J.R.R. Tolkien", publication_year: 1937, genre: "Fantasia", external_id: "/works/OL27482W", cover_id: 14627509 },
  { key: :nineteen_eighty_four, title: "Nineteen Eighty-Four", author: "George Orwell", publication_year: 1949, genre: "Distopia", external_id: "/works/OL1168083W", cover_id: 9267242 },
  { key: :pride, title: "Pride and Prejudice", author: "Jane Austen", publication_year: 1813, genre: "Romance", external_id: "/works/OL66554W", cover_id: 14348537 },
  { key: :solitude, title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", publication_year: 1967, genre: "Ficção", external_id: "/works/OL274505W", cover_id: 12627383 },
  { key: :gatsby, title: "The Great Gatsby", author: "F. Scott Fitzgerald", publication_year: 1925, genre: "Clássico", external_id: "/works/OL468431W", cover_id: 10590366 },
  { key: :brave_new_world, title: "Brave New World", author: "Aldous Huxley", publication_year: 1932, genre: "Distopia", external_id: "/works/OL64365W", cover_id: 8231823 },
  { key: :mockingbird, title: "To Kill a Mockingbird", author: "Harper Lee", publication_year: 1960, genre: "Clássico", external_id: "/works/OL3140822W", cover_id: 14351077 },
  { key: :white_teeth, title: "White Teeth", author: "Zadie Smith", publication_year: 2000, genre: "Ficção", external_id: "/works/OL481143W", cover_id: 5276331 },
  { key: :blind_assassin, title: "The Blind Assassin", author: "Margaret Atwood", publication_year: 2000, genre: "Ficção", external_id: "/works/OL675698W", cover_id: 11041760 },
  { key: :lotr, title: "The Lord of the Rings", author: "J.R.R. Tolkien", publication_year: 1954, genre: "Fantasia", external_id: "/works/OL27448W", cover_id: 14625765 },
  { key: :goblet_of_fire, title: "Harry Potter and the Goblet of Fire", author: "J.K. Rowling", publication_year: 2000, genre: "Fantasia", external_id: "/works/OL82560W", cover_id: 12059372 }
].to_h do |attrs|
  key = attrs.delete(:key)
  # Updates existing rows too, so re-running the seeds refreshes covers and genres
  book = Book.find_or_initialize_by(external_id: attrs[:external_id])
  book.update!(attrs.except(:external_id))
  [ key, book ]
end

# [user, book, days ago, rate, review]. Different dates give the list a visible "latest reading" order.
# The Lord of the Rings and Goblet of Fire have no readers on purpose: books without readers are still listed.
readings = [
  [ :cecilia, :white_teeth, 1, 4.5, "Funny and sharp. Loved the family chaos." ],
  [ :cecilia, :dune, 3, 5, nil ],
  [ :bruno, :dune, 4, 4, "Slow start, worth it." ],
  [ :bruno, :nineteen_eighty_four, 6, 4.5, nil ],
  [ :ana, :pride, 8, 3.5, "Elizabeth carries the whole book." ],
  [ :ana, :blind_assassin, 10, nil, nil ],
  [ :cecilia, :solitude, 12, 5, "Read it twice." ],
  [ :bruno, :hobbit, 15, 4, nil ],
  [ :ana, :gatsby, 20, 3, nil ],
  [ :bruno, :brave_new_world, 25, 3.5, nil ],
  [ :ana, :mockingbird, 30, 5, "A classic for a reason." ]
]

readings.each do |user_key, book_key, days_ago, rate, review|
  Reading.find_or_create_by!(user: users.fetch(user_key), book: books.fetch(book_key)) do |r|
    r.created_at = days_ago.days.ago
    r.read_on = days_ago.days.ago.to_date
    r.rate = rate
    r.review = review
  end
end

puts "Seeded #{User.count} users, #{Book.count} books, #{Reading.count} readings."
