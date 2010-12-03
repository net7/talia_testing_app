class Manuscript < Book
  hobo_model # Don't put anything above this

  include StandardPermissions
  extend RdfProperty
  has_rdf_type N::SCHOP.Manuscript

  after_create :set_title_from_uri

  declare_attr_type :name, :string
  declare_attr_type :title, :string

  rdf_property :volume, N::DCT.isPartOf, :type => :string
  singular_property :description, N::DCNS.description, :type => :string

  singular_property :date, N::DCT.date # this accept a range, though it's recommended to follow a standard (ISO861)
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


  def add_index_element(position, title, start_page, end_page)
    bis = BookIndexSection.new()
    bis.book = self
    bis.number = position
    bis.title = title
    bis.starting_page = start_page
    bis.ending_page = end_page
    bis.save!
  end
 
  def name
    title.blank? ? uri.local_name : title
  end


  private

  def set_title_from_uri
    self.title = self.uri.local_name
  end
  

end
