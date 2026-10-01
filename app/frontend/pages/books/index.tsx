type IBook = {
  id: number
  author: string
  title: string
  genre: string
  last_read_at: string
  publication_year: number
  external_id: string
  created_at: string
  updated_at: string
}

export default function Index({ books }: { books: IBook[] }) {
  console.log("# books: ", books)
  return (
    <>
      <h1 className="font-bold text-4xl">Books#index</h1>
      <p>Find me in app/frontend/pages/books/index.tsx</p>


      <div>
        <ul className="grid-3">
          { books.map((book) =>
            <li key={book.id}>{book.title}</li> 
          ) }
        </ul>
      </div>
    </>
  );
}
