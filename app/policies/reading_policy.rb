# frozen_string_literal: true

# Only the owner can edit or remove a reading; the book stays in the catalog.
class ReadingPolicy < ApplicationPolicy
  def create? = user.present?
  def update? = owner?
  def destroy? = owner?

  class Scope < ApplicationPolicy::Scope
    def resolve = user ? scope.where(user:) : scope.none
  end

  private
    def owner? = user.present? && record.user_id == user.id
end
