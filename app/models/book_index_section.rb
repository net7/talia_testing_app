class BookIndexSection < TaliaCore::Source

#  self.inheritance_column = :foo
  
  singular_property :index_section_number, N::SCHOP.index_section_number
  singular_property :index_section_title, N::SCHOP.index_section_title
  singular_property :index_section_starting_page, N::SCHOP.index_section_starting_page
  singular_property :index_section_ending_page, N::SCHOP.index_section_ending_page

  def book
    self.schop.index_of
  end
end
