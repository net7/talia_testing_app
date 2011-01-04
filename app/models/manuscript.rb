class Manuscript < Book
  hobo_model # Don't put anything above this

  include StandardPermissions
  extend RdfProperties
  has_rdf_type N::SCHOP.Manuscript

  before_save :set_uri_from_title

  after_create :set_title_from_uri
  after_save :save_volume

  autofill_uri 

  declare_attr_type :name, :string
  declare_attr_type :title, :string

# rdf_property :volume, N::DCT.isPartOf, :type => :string
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
  rdf_property :numbering_notes, N::SCHOP.numbering_notes, :type => :string
  rdf_property :writing_starting_date, N::SCHOP.writing_starting_date, :type => :string
  rdf_property :writing_ending_date, N::SCHOP.writing_ending_date, :type => :string
  rdf_property :repository, N::SCHOP.repository, :type => :string
  rdf_property :repository_structure, N::SCHOP.repository_structu, :type => :string
  rdf_property :shelfmark, N::SCHOP.shelfmark, :type => :string
  rdf_property :author, N::SCHOP.has_author, :type => TaliaCore::ActiveSource
  rdf_property :notes, N::SCHOP.notes, :type => :string
  manual_property :volume

  def volume 
    @volume ||= fetch_volume
  end


  def volume=(value)
    if (!value.empty?)
      @volume = (value.is_a?(Manuscript) ? value : Manuscript.find(value))
      @volume_new = true
      
      old_volume = fetch_volume
      if !old_volume.nil? && old_volume.to_uri != @volume.to_uri
        old_volume.each do |el|
          if el.uri == self.uri
            old_volume.delete el
            break
          end
        end
        
        old_volume.save
        @volume << self
      elsif old_volume.nil?
        @volume << self
      end
    end
  end
  
  def save_volume
    is_new = @volume_new
    @volume_new = false
    is_new ? @volume.save : volume_valid?
  end

  def fetch_volume
    ActiveRDF::Query.new(Manuscript).select(:m).where(:m, N::DCT.hasPart, self).execute.first
  end

  # If there's errors validating the volume, add these errors to this                                                                
  # object's errors and return false                                                                                                  
  def validate_volume
    if(!volume_valid?)
      @volume.errors.each_full { |msg| errors.add('volume', msg) }
    end
    volume_valid?
  end


  def volume_valid?
    @volume ? @volume.valid? : true
  end



  def add_index_element(position, title, start_page, end_page)
    bis = BookIndexSection.new()
    bis.book = self
    bis.number = position
    bis.title = title
    bis.starting_page = start_page
    bis.ending_page = end_page
    bis.save!
  end


  def index_elements
    BookIndexSection.index_sections_of(self)
  end


 
  def name
    title.blank? ? uri.local_name : title
  end


  private

  def set_uri_from_title
    self.uri = (N::LOCAL + self.title.to_s).to_s unless self.title.nil?
  end

  def set_title_from_uri
    self.title = self.uri.local_name if self.title.nil?
  end
  

end
