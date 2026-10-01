class AddCoverIdToBooks < ActiveRecord::Migration[8.1]
  def change
    add_column :books, :cover_id, :integer
  end
end
