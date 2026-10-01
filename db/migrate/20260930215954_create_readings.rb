class CreateReadings < ActiveRecord::Migration[8.1]
  def change
    create_table :readings do |t|
      t.references :user, null: false, foreign_key: true
      t.references :book, null: false, foreign_key: true
      t.date :read_on
      t.decimal :rate, precision: 2, scale: 1
      t.text :review

      t.timestamps
    end
    add_index :readings, [ :user_id, :book_id ], unique: true
  end
end
