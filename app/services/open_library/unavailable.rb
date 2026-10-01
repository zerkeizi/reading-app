module OpenLibrary
  # Raised when OpenLibrary can't be used right now: timeout, connection error, 5xx, 429/403 or invalid JSON.
  # An empty search is not an error (HTTP 200 with no docs).
  class Unavailable < StandardError; end
end
