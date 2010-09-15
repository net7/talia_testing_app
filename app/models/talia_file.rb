class TaliaFile < TaliaCore::Source
  def assign_random_id
    self.uri = (N::LOCAL.source + '/' + RandomId.random_id).to_s
  end

  def owner
    @owner ||= self[N::TALIA.isFileOf].first
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
