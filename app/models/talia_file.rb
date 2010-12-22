class TaliaFile < TaliaCore::Source

  before_destroy :delete_file_parts

  # BY RIK
  # Disable LOD RDF for this class
  def self.lod?
    false
  end

  def self.oai?
    false
  end

  def pseudo_id
    self.uri.to_s["#{N::LOCAL.file}/".length, uri.to_s.length]
  end

  def assign_random_id
    self.uri = (N::LOCAL.file + '/' + RandomId.random_id).to_s
  end

  def owner
    @owner ||= self[N::TALIA.isFileOf].first
  end

  def has_type(type)
    data_records.each {|data_record| return true if data_record.is_a? type}
    false
  end

  def file
    return data_records.first
  end

  def file_by_type(type)
    data_records.each {|data_record| return data_record if data_record.is_a? type}
    nil
  end

  # TODO: we should have a way to define a default order of preference for files.
  def file_by_type_preference(*types)
    return nil if types.size == 0
    types.each {|type| return file_by_type type if has_type type}
    nil
  end

  # delete FileParts related to this
  def delete_file_parts
    #TODO implementation
  end

  # TODO: check what we should destroy and when
  def attach_files(files)
    # BY RIK
    files = [files] unless(files.is_a?(Array))
    files.each do |file|
      file.to_options!
      filename = file[:url]
      assit(filename)
      options = file[:options] || {}
      records = TaliaCore::DataTypes::FileRecord.create_from_url(filename, options)
      records.each {|rec| self.data_records << rec}
    end
  end
end
