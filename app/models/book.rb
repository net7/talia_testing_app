class Book < TaliaCore::Collection

#    singular_property :book_collection, N::SCHOP.book_collection

#    before_save :set_collection_value

    def pages
    pages = []
    self.elements.each do |page|
      pages << page
    end
    pages
  end

#    def set_collection_value
#      book_collection = false if book_collection.nil?
#    end

end