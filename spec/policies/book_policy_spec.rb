require "rails_helper"

RSpec.describe BookPolicy do
  fixtures :users, :books

  subject { described_class }

  let(:book) { books(:dune) }

  permissions :index? do
    it "lets guests see the catalog" do
      expect(subject).to permit(nil, Book)
    end

    it "lets signed-in users see the catalog" do
      expect(subject).to permit(users(:one), Book)
    end
  end

  permissions :create? do
    it "lets a signed-in user register a book" do
      expect(subject).to permit(users(:one), Book)
    end

    it "blocks guests" do
      expect(subject).not_to permit(nil, Book)
    end
  end

  permissions :update?, :destroy? do
    it "blocks everyone, since book data comes from OpenLibrary" do
      expect(subject).not_to permit(users(:one), book)
      expect(subject).not_to permit(nil, book)
    end
  end

  describe "scope" do
    it "returns every book, for guests too" do
      expect(BookPolicy::Scope.new(nil, Book).resolve).to match_array(Book.all)
    end
  end
end
