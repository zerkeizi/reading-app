require "rails_helper"

RSpec.describe OpenLibrary::Genre do
  describe ".from_subjects" do
    it "prefers the specific genre over plain fiction, whatever the subject order" do
      expect(described_class.from_subjects([ "Dune (Imaginary place)", "Fiction", "Science fiction" ])).to eq("Ficção científica")
    end

    it "falls back to Ficção for plain fiction" do
      expect(described_class.from_subjects([ "Fiction", "Families" ])).to eq("Ficção")
    end

    it "ignores tags such as awards and best-seller lists" do
      expect(described_class.from_subjects([ "award:hugo_award=1966", "nyt:trade-fiction=2020-01-01" ])).to be_nil
    end

    it "returns nil when there are no subjects" do
      expect(described_class.from_subjects(nil)).to be_nil
    end
  end
end
