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

books = [
  { key: :dune, title: "Dune", author: "Frank Herbert", publication_year: 1965, genre: "Science Fiction", external_id: "/works/OL893415W" },
  { key: :hobbit, title: "The Hobbit", author: "J.R.R. Tolkien", publication_year: 1937, genre: "Fantasy", external_id: "/works/OL262758W" },
  { key: :nineteen_eighty_four, title: "Nineteen Eighty-Four", author: "George Orwell", publication_year: 1949, genre: "Dystopian", external_id: "/works/OL1168083W" },
  { key: :pride, title: "Pride and Prejudice", author: "Jane Austen", publication_year: 1813, genre: "Romance", external_id: "/works/OL66554W" },
  { key: :solitude, title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", publication_year: 1967, genre: "Magical Realism", external_id: "/works/OL274505W" },
  { key: :gatsby, title: "The Great Gatsby", author: "F. Scott Fitzgerald", publication_year: 1925, genre: "Classic", external_id: "/works/OL468431W" },
  { key: :brave_new_world, title: "Brave New World", author: "Aldous Huxley", publication_year: 1932, genre: "Dystopian", external_id: "/works/OL64468W" },
  { key: :mockingbird, title: "To Kill a Mockingbird", author: "Harper Lee", publication_year: 1960, genre: "Classic", external_id: "/works/OL3140822W" },
  { key: :white_teeth, title: "White Teeth", author: "Zadie Smith", publication_year: 2000, genre: "Literary Fiction", external_id: "/works/OL1966503W" },
  { key: :blind_assassin, title: "The Blind Assassin", author: "Margaret Atwood", publication_year: 2000, genre: "Literary Fiction", external_id: "/works/OL675140W" },
  { key: :lotr, title: "The Lord of the Rings", author: "J.R.R. Tolkien", publication_year: 1954, genre: "Fantasy", external_id: "/works/OL27448W" },
  { key: :goblet_of_fire, title: "Harry Potter and the Goblet of Fire", author: "J.K. Rowling", publication_year: 2000, genre: "Fantasy", external_id: "/works/OL82586W" }
].to_h do |attrs|
  key = attrs.delete(:key)
  [ key, Book.find_or_create_by!(external_id: attrs[:external_id]) { |b| b.assign_attributes(attrs) } ]
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
