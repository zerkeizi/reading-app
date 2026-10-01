# frozen_string_literal: true

# Book data comes from OpenLibrary, so it is read-only for everyone.
# What users edit or remove is their own Reading (see ReadingPolicy).
class BookPolicy < ApplicationPolicy
  def index? = true
  def show? = true
  def create? = user.present?
  def update? = false
  def destroy? = false

  class Scope < ApplicationPolicy::Scope
    def resolve = scope.all
  end
end
