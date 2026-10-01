# `not_change` lets specs chain "changes X and does not change Y":
#   expect { ... }.to change(Reading, :count).by(1).and not_change(Book, :count)
RSpec::Matchers.define_negated_matcher :not_change, :change
