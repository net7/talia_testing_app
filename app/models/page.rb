class Page < TaliaCore::Source
  hobo_model
  include StandardPermissions

  has_rdf_type N::SCHOP.Page

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
    book.next(self)

  end

  def prev_page
    book.prev(self)
  end

  # Returns an array of facsimiles related to this page (or an empty one)
  def related_facsimiles
    self.inverse[N::DCT.isFormatOf]
  end

end
