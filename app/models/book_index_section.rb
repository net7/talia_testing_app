class BookIndexSection < TaliaCore::Source
hobo_model

  include StandardPermissions
  extend RdfProperties
  has_rdf_type N::SCHOP.BookIndexSection

  autofill_uri   

  rdf_property :number, N::SCHOP.index_section_number, :type => :integer
  rdf_property :title, N::SCHOP.index_section_title, :type => :string
  rdf_property :starting_page, N::SCHOP.index_section_starting_page, :type => :string
  rdf_property :ending_page, N::SCHOP.index_section_ending_page, :type => :string
  manual_property :book

  def book=(value)
    self.schop.index_of << value
  end
  
  def book
    self.schop.index_of.first
  end

  # Returns a list of  Book(s) and subclasses with index sections
  def self.books_with_index_sections
    qry = ActiveRDF::Query.new(Book).select(:b).distinct
    qry.where(:section, N::SCHOP.index_of, :b)
    qry.execute
  end
    
  # Returns all the index_sections of a book, ordered by  :number
  def self.index_sections_of(book)
    qry = ActiveRDF::Query.new(BookIndexSection).select(:section).distinct
    qry.where(:section, N::SCHOP.index_of, book)
    qry.where(:section, N::SCHOP.index_section_number, :position)
    qry.sort(:position)
    qry.execute
  end 
  
end
