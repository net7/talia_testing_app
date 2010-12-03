require 'exifr'

class Facsimile < TaliaCore::Source
hobo_model
  extend RdfProperties
  include StandardPermissions

  has_rdf_type N::SCHOP.Facsimile

  after_create :fill_data_from_image_file

  rdf_property :author, N::DCT.author #TODO check if correct ontology item
  rdf_property :copyright_note, N::DCT.copyright #TODO check if correct ontology item
  rdf_property :width, N::SCHOP.width
  rdf_property :height, N::SCHOP.height
  rdf_property :date, N::DCT.date
#  rdf_property :page, N::DCT.isFormatOf, :type => Page

  def page
    self.dct.isFormatOf.first
  end

  def fill_data_from_image_file
    file = self.data_records.find_by_type('TaliaCore::DataTypes::IipData')
    exifr_image = EXIFR::TIFF.new(file.get_iip_root_file_path)
    self.width = exifr_image.width.to_s
    self.height = exifr_image.height.to_s
  end

end
