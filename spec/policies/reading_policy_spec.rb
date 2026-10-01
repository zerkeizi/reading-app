require "rails_helper"

RSpec.describe ReadingPolicy do
  fixtures :users, :books, :readings

  subject { described_class }

  let(:reading) { readings(:one_dune) }

  permissions :create? do
    it "lets a signed-in user add a reading" do
      expect(subject).to permit(users(:one), Reading)
    end

    it "blocks guests" do
      expect(subject).not_to permit(nil, Reading)
    end
  end

  permissions :update?, :destroy? do
    it "lets the owner" do
      expect(subject).to permit(users(:one), reading)
    end

    it "blocks another user" do
      expect(subject).not_to permit(users(:two), reading)
    end

    it "blocks guests" do
      expect(subject).not_to permit(nil, reading)
    end
  end

  describe "scope" do
    it "returns only the user's own readings" do
      Reading.create!(user: users(:two), book: books(:dune))

      expect(ReadingPolicy::Scope.new(users(:one), Reading).resolve).to contain_exactly(reading)
    end

    it "returns nothing for guests" do
      expect(ReadingPolicy::Scope.new(nil, Reading).resolve).to be_empty
    end
  end
end
