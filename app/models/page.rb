class Page < TaliaCore::Source
  hobo_model

  extend RdfProperties

  after_save :insert_in_collection

  rdf_property :name, N::SCHOP.page_name
  rdf_property :position, N::SCHOP.page_position
#  rdf_property :book, N::DCT.isPartOf

  def insert_in_collection
    book = Book.find(self.book)
    book [Integer(self.position.to_s)] = self
    book.save!
  end

  def book
    self.dct.isPartOf.first
  end

  def next_page
    my_index = book.index(self)
    return book[my_index + 1] unless book.size == (my_index + 1)
    return self
  end

  def prev_page
    my_index = book.index(self)
    return book[my_index - 1] unless my_index == 0
    return self
  end
end
