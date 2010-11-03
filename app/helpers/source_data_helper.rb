module SourceDataHelper

  def prepare_data_records
    @files = @source.files_by_type
    @files.delete 'TaliaCore::DataTypes::IipData'
    @files.delete 'TaliaCore::DataTypes::ImageData'
    @data_records = []
    @files.each_value {|type| type.each {|data_record| @data_records << data_record}}
  end
end
