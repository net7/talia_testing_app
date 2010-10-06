class Book < TaliaCore::Collection
hobo_model
  singular_property :volume, N::DCT.isPartOf
  singular_property :description, N::DCNS.description
  singular_property :date, N::DCT.date #this accept a range, though it's recommended to stich to a standard (ISO861)
  singular_property :width, N::SCHOP.width
  singular_property :height, N::SCHOP.height
  singular_property :binding_type, N::SCHOP.binding_type
  singular_property :old_title, N::SCHOP.old_title
  singular_property :new_title, N::SCHOP.new_title
  singular_property :ex_libris, N::SCHOP.ex_libris
  singular_property :sheets_number, N::SCHOP.sheets_number
  singular_property :numbering_type, N::SCHOP.numbering_type
  singular_property :numbering_author, N::SCHOP.numbering_author
  singular_property :numbering_writing_type, N::SCHOP.numbering_writing_type
  singular_property :notes, N::SCHOP.notes
  singular_property :repository, N::SCHOP.repository
  singular_property :repository_structure, N::SCHOP.repository_structure
  singular_property :shelfmark, N::SCHOP.shelfmark
  # TODO: campo per capire se manuscript o opera

  def add_index_element(position, title, start_page, end_page)
    bis = BookIndexSection.new()
    bis.book = self
    bis.index_section_number = position
    bis.index_section_title = title
    bis.index_section_starting_page = start_page
    bis.index_section_ending_page = end_page
    bis.save!
  end

  def pages
    pages = []
    self.elements.each do |page|
      pages << page.becomes(Page)
    end
    pages
  end

end
