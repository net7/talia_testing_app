class BookIndexSection < TaliaCore::Source
hobo_model
#  self.inheritance_column = :foo
  
  singular_property :number, N::SCHOP.index_section_number
  singular_property :title, N::SCHOP.index_section_title
  singular_property :starting_page, N::SCHOP.index_section_starting_page
  singular_property :ending_page, N::SCHOP.index_section_ending_page

  # Returns the book this index section is about
  def book
    self.schop.index_of.first
  end
end
