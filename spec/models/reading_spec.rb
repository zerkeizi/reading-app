require "rails_helper"

RSpec.describe Reading, type: :model do
  fixtures :users, :books, :readings

  subject(:reading) { readings(:one_dune) }

  it "is valid with valid attributes" do
    expect(reading).to be_valid
  end

  describe "uniqueness per user and book" do
    it "rejects the same user reading the same book twice" do
      duplicate = Reading.new(user: users(:one), book: books(:dune))
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:book_id]).to be_present
    end

    it "allows another user to read the same book" do
      expect(Reading.new(user: users(:two), book: books(:dune))).to be_valid
    end

    it "is enforced by the database even when validations are skipped" do
      duplicate = Reading.new(user: users(:one), book: books(:dune))
      expect { duplicate.save(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end

  describe "rate" do
    it "is optional" do
      reading.rate = nil
      expect(reading).to be_valid
    end

    [ 0.5, 2.5, 5 ].each do |value|
      it "accepts #{value}" do
        reading.rate = value
        expect(reading).to be_valid
      end
    end

    [ 0, 2.3, 5.5, -1 ].each do |value|
      it "rejects #{value}" do
        reading.rate = value
        expect(reading).not_to be_valid
        expect(reading.errors[:rate]).to be_present
      end
    end
  end

  describe "last_read_at on the book" do
    it "is set to the reading's creation time when a reading is created" do
      book = books(:dune)
      new_reading = Reading.create!(user: users(:two), book: book)

      expect(book.reload.last_read_at).to be_within(1.second).of(new_reading.created_at)
    end
  end
end
