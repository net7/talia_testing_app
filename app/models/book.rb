class Book < TaliaCore::Collection
  
#    singular_property :book_collection, N::SCHOP.book_collection
#      before_save :set_collection_value

  has_rdf_type N::SCHOP.Book


  # Returns an ordered list of index sections
  def index_sections
    qry = ActiveRDF::Query.new(BookIndexSection).select(:bis).distinct
    qry.where(:bis, N::SCHOP.index_of, self)
    qry.where(:bis, N::SCHOP.index_section_number, :x)
    qry.sort(:x)
    qry.execute
  end
  
  # Returns the book pages
  def pages
    load_subparts
    @pages
  end

  # Return the book sub-books. If they exist
  def books
    load_subparts
    @books
  end


  def load_subparts
    unless @pages.nil? and @books.nil?
      return
    end
    @pages = []
    @books = []
    self.elements.each do |el|
      @pages << el if el.is_a? Page
      @books << el if el.is_a? Book
    end
  end


  #    def set_collection_value
  #      book_collection = false if book_collection.nil?
  #    end

end
