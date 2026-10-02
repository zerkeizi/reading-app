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

# external_id and cover_id checked against OpenLibrary's search API. Authors are written by hand
# (OpenLibrary lists translators and narrators too), and so are a few years where its data is wrong
# (The Jungle: 1906). Genres use the Portuguese names the OpenLibrary import produces (OpenLibrary::Genre);
# essays that fit none of them have no genre.
books = [
  { key: :grapes_of_wrath, title: "The Grapes of Wrath", author: "John Steinbeck", publication_year: 1939, genre: "Clássico", external_id: "/works/OL23205W", cover_id: 12715902 },
  { key: :peoples_history, title: "A People's History of the United States", author: "Howard Zinn", publication_year: 1980, genre: "História", external_id: "/works/OL50283W", cover_id: 10592817 },
  { key: :manufacturing_consent, title: "Manufacturing Consent", author: "Edward S. Herman, Noam Chomsky", publication_year: 1988, genre: nil, external_id: "/works/OL31013W", cover_id: 7900362 },
  { key: :malcolm_x, title: "The Autobiography of Malcolm X", author: "Malcolm X, Alex Haley", publication_year: 1964, genre: "Biografia", external_id: "/works/OL36522668W", cover_id: 14875135 },
  { key: :wretched, title: "The Wretched of the Earth", author: "Frantz Fanon", publication_year: 1961, genre: "História", external_id: "/works/OL31677379W", cover_id: 14325884 },
  { key: :open_veins, title: "Las venas abiertas de América Latina", author: "Eduardo Galeano", publication_year: 1971, genre: "História", external_id: "/works/OL698173W", cover_id: 5416334 },
  { key: :pedagogy, title: "Pedagogy of the Oppressed", author: "Paulo Freire", publication_year: 1970, genre: nil, external_id: "/works/OL1870518W", cover_id: 99306 },
  { key: :death_row, title: "Live from Death Row", author: "Mumia Abu-Jamal", publication_year: 1995, genre: "Biografia", external_id: "/works/OL3353722W", cover_id: 3888776 },
  { key: :assata, title: "Assata: An Autobiography", author: "Assata Shakur", publication_year: 1987, genre: "Biografia", external_id: "/works/OL4975846W", cover_id: 8598296 },
  { key: :prison_writings, title: "Prison Writings: My Life Is My Sun Dance", author: "Leonard Peltier", publication_year: 1999, genre: "Biografia", external_id: "/works/OL14494W", cover_id: 175612 },
  { key: :fahrenheit, title: "Fahrenheit 451", author: "Ray Bradbury", publication_year: 1953, genre: "Distopia", external_id: "/works/OL103123W", cover_id: 12993656 },
  { key: :soledad_brother, title: "Soledad Brother", author: "George Jackson", publication_year: 1970, genre: "Biografia", external_id: "/works/OL124173W", cover_id: 10115114 },
  { key: :prisons_obsolete, title: "Are Prisons Obsolete?", author: "Angela Y. Davis", publication_year: 2003, genre: nil, external_id: "/works/OL2709370W", cover_id: 10129501 },
  { key: :the_jungle, title: "The Jungle", author: "Upton Sinclair", publication_year: 1906, genre: "Clássico", external_id: "/works/OL114967W", cover_id: 8231790 },
  { key: :lotr, title: "The Lord of the Rings", author: "J.R.R. Tolkien", publication_year: 1954, genre: "Fantasia", external_id: "/works/OL27448W", cover_id: 14625765 },
  { key: :neuromancer, title: "Neuromancer", author: "William Gibson", publication_year: 1984, genre: "Ficção científica", external_id: "/works/OL27258W", cover_id: 283860 },
  { key: :povo_brasileiro, title: "O Povo Brasileiro", author: "Darcy Ribeiro", publication_year: 1995, genre: "História", external_id: "/works/OL1755883W", cover_id: 3842030 },
  { key: :chocolate_factory, title: "Charlie and the Chocolate Factory", author: "Roald Dahl", publication_year: 1964, genre: "Fantasia", external_id: "/works/OL45790W", cover_id: 12459564 }
].to_h do |attrs|
  key = attrs.delete(:key)
  # Updates existing rows too, so re-running the seeds refreshes covers and genres
  book = Book.find_or_initialize_by(external_id: attrs[:external_id])
  book.update!(attrs.except(:external_id))
  [ key, book ]
end

# [user, book, days ago, rate, review]. Different dates give the list a visible "latest reading" order.
# The Wretched of the Earth, Prison Writings and Soledad Brother have no readers on purpose:
# books without readers are still listed.
readings = [
  [ :cecilia, :grapes_of_wrath, 1, 5, "O Tom Joad mora aqui." ],
  [ :bruno, :peoples_history, 2, 4.5, "Muda o jeito de ler a história dos EUA." ],
  [ :ana, :malcolm_x, 3, 5, "Impossível largar." ],
  [ :cecilia, :pedagogy, 5, 4.5, nil ],
  [ :bruno, :manufacturing_consent, 6, 4, nil ],
  [ :ana, :assata, 7, 4.5, nil ],
  [ :cecilia, :povo_brasileiro, 9, 5, "Leitura obrigatória." ],
  [ :bruno, :fahrenheit, 11, 3.5, nil ],
  [ :ana, :open_veins, 12, 5, "Dói, e é para doer." ],
  [ :cecilia, :neuromancer, 14, 4, nil ],
  [ :bruno, :lotr, 18, 5, nil ],
  [ :ana, :chocolate_factory, 20, 3, nil ],
  [ :bruno, :the_jungle, 25, 3.5, nil ],
  [ :ana, :prisons_obsolete, 28, 4, nil ],
  [ :cecilia, :death_row, 30, nil, nil ]
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
