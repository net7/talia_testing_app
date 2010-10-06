require 'exifr'

class Facsimile <  TaliaCore::Source
hobo_model
  after_create :fill_data_from_image_file

  singular_property :author, N::DCT.author #TODO check if correct ontology item
  singular_property :copyright_note, N::DCT.copyright #TODO check if correct ontology item
  singular_property :width, N::SCHOP.width
  singular_property :height, N::SCHOP.height
  singular_property :date, N::DCT.date

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
