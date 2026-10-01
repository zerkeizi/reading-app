require "rails_helper"

RSpec.describe User, type: :model do
  fixtures :users, :books, :readings

  subject(:user) { users(:one) }

  it "is valid with valid attributes" do
    expect(user).to be_valid
  end

  describe "validations" do
    it "requires a name" do
      user.name = ""
      expect(user).not_to be_valid
      expect(user.errors[:name]).to be_present
    end

    it "requires an email address" do
      user.email_address = ""
      expect(user).not_to be_valid
      expect(user.errors[:email_address]).to be_present
    end

    it "rejects a malformed email address" do
      user.email_address = "not-an-email"
      expect(user).not_to be_valid
      expect(user.errors[:email_address]).to be_present
    end

    it "rejects a duplicate email address, ignoring case and whitespace" do
      duplicate = User.new(name: "Copycat", email_address: "  ONE@example.com ", password: "password")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email_address]).to be_present
    end
  end

  describe "normalization" do
    it "strips and downcases the email address" do
      user = User.new(email_address: "  Someone@Example.COM ")
      expect(user.email_address).to eq("someone@example.com")
    end
  end

  describe "associations" do
    it "lists the books the user has read through readings" do
      expect(user.books).to contain_exactly(books(:dune))
    end

    it "destroys the user's readings but keeps the books" do
      expect { user.destroy }.to change(Reading, :count).by(-1)
      expect(Book.exists?(books(:dune).id)).to be true
    end
  end
end
