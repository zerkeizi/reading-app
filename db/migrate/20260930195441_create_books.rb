class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.string :title, null: false
      t.string :author
      t.integer :publication_year
      t.string :genre
      t.string :external_id, null: false
      t.datetime :last_read_at

      t.timestamps
    end
    add_index :books, :external_id, unique: true
    add_index :books, :last_read_at
  end
end
