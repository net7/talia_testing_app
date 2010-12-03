class Manuscript < Book
  hobo_model # Don't put anything above this

  include StandardPermissions
  extend RdfProperties
  has_rdf_type N::SCHOP.Manuscript

  after_create :set_title_from_uri

  autofill_uri :force => true

  declare_attr_type :name, :string
  declare_attr_type :title, :string

  rdf_property :volume, N::DCT.isPartOf, :type => :string
  rdf_property :description, N::DCNS.description, :type => :string

  rdf_property :date, N::DCT.date, :type => :string # this accept a range, though it's recommended to follow a standard (ISO861)
  rdf_property :width, N::SCHOP.width, :type => :string
  rdf_property :height, N::SCHOP.height, :type => :string
  rdf_property :binding_type, N::SCHOP.binding_type, :type => :string
  rdf_property :old_title, N::SCHOP.old_title, :type => :string
  rdf_property :new_title, N::SCHOP.new_title, :type => :string
  rdf_property :ex_libris, N::SCHOP.ex_libris, :type => :string
  rdf_property :sheets_number, N::SCHOP.sheets_number, :type => :string
  rdf_property :numbering_type, N::SCHOP.numbering_type, :type => :string
  rdf_property :numbering_author, N::SCHOP.numbering_author, :type => :string
  rdf_property :numbering_writing_type, N::SCHOP.numbering_writing_type, :type => :string
  rdf_property :notes, N::SCHOP.notes, :type => :string
  rdf_property :repository, N::SCHOP.repository, :type => :string
  rdf_property :repository_structure, N::SCHOP.repository_structu, :type => :string
  rdf_property :shelfmark, N::SCHOP.shelfmark, :type => :string


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
