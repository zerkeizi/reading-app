export type FlashData = {
  notice?: string
  alert?: string
}

export type User = {
  id: number
  name: string
}

// Props Rails shares with every page (inertia_share in InertiaController)
export type SharedProps = {
  current_user: User | null
}

export type Book = {
  id: number
  title: string
  author: string | null
  publication_year: number | null
  genre: string | null
  cover_url: string | null
}

export type Reading = {
  id: number
  rate: number | null
  review: string | null
  read_on: string | null
}

// Home list: a book plus the signed-in user's reading id for it (null = not read)
export type CatalogBook = Book & {
  reading_id: number | null
}

export type FilterField = 'author' | 'genre' | 'year'

export type Pagination = {
  page: number
  total_pages: number
  total_count: number
}
