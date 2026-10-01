class Book < ApplicationRecord
  has_many :readings, dependent: :destroy
  has_many :readers, through: :readings, source: :user

  validates :title, presence: true
  validates :external_id, presence: true, uniqueness: true
end
