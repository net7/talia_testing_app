class TaliaSource < TaliaCore::Source
  hobo_model # Don't put anything above this

  include StandardPermissions
  extend RdfProperties
  extend RandomId

  cattr_reader :per_page
  @@per_page = 10

#  rdf_property :title, N::DCNS.title
#  autofill_uri :force => true

#  self.inheritance_column = 'foo_source'

  # BY RIK
  def talia_files
    @talia_files ||= self[N::TALIA.hasFile]
  end

  def files
    @files ||= begin
      result = []
      talia_files.each do |talia_file|
        talia_file.data_records.each do |data_record|
          result << data_record
        end
      end
      result
    end
  end

  # TODO: refactor
  # Returns an array of data_records related to this source through a N::TALIA.hasFile relation,
  # but only files of the requested type. Some files may have more than one type, as for example
  # images, which can have a IIP version and a normal version of the same file.
  # In such situations is often desired to have only one file in the resulting array, and that file 
  # should be IIP if present or normal otherwise. This can be done by passing a list of types.
  # The list will be considered like a preference order: if a file of the first type is found
  # then only that file is added to the result; if not, the sencond type is searched for... and so on.
  # Example: source.files_of_type TaliaCore::DataTypes::IipData, TaliaCore::DataTypes::ImageData.
  def files_of_type(*types)
    result = []
    return result if types.size == 0
    types.each do |type|
      unless files_by_type[type.to_s].nil?
        files_by_type[type.to_s].each {|file| result << file}
        break
      end
    end
    result
  end

  # Returns an array of data records of type of_type that belong to talia_files that 
  # _do not_ also contain data records of type but_not_of_type.
  # Useful to get images that have no IIP version, for example.
  def files_of_type_diff(of_type, but_not_of_type)
    result = []
    talia_files.each do |talia_file|
      found_good = false; found_bad = false
      for data_record in talia_file.data_records
        found_good = true  if data_record.is_a? of_type
        found_bad = true if data_record.is_a? but_not_of_type
      end
      result << data_record if found_good and !found_bad
    end
    result
  end

  def files_by_type
    @files if @files
    @files = {}
    talia_files.each do |talia_file|
      talia_file.data_records.each do |data_record|
        @files[data_record[:type]] = [] if @files[data_record[:type]].nil?
        @files[data_record[:type]] << data_record
      end
    end
    @files
  end

  # BY RIK
  # TODO: check what we should destroy and when
  # TODO: refactor!!!!
  def attach_files(files)
    files = [files] unless(files.is_a?(Array))
    files.each do |file|
      file.to_options!
      filename = file[:url]
      assit(filename)
      options = file[:options] || {}
      # BEGIN BY RIK
      talia_file = TaliaFile.new
      talia_file.assign_random_id
      talia_file[N::RDFS.label] << File.basename(filename)
      records = TaliaCore::DataTypes::FileRecord.create_from_url(filename, options)
      records.each do |rec|
        talia_file.data_records << rec
      end
      talia_file[N::TALIA.isFileOf] = self
      self[N::TALIA.hasFile] << talia_file
      # talia_file.save!
      # END BY RIK
    end
  end

  def self.file_staging_dir
    @file_staging_dir ||=  begin
      staging_dir = File.join(TaliaCore::CONFIG['data_directory_location'], 'staged_images')
      FileUtils.mkdir(staging_dir) unless(File.exist?(staging_dir))
      staging_dir
    end
  end

  def name
    self.rdfs.label.first
#    self.title
  end

  def assign_random_id
    self.uri = (N::LOCAL.source + '/' + RandomId.random_id).to_s
  end

  def attach_file(up_file)
    content_type = up_file.content_type.to_s
    case content_type
    when 'image/jpeg', 'image/tiff'
      self.save! if(self.new_record?)
      staged_file = File.join(self.class.file_staging_dir, Digest::MD5.hexdigest(self.uri.to_s) + '.jpg')
      if(up_file.is_a?(File))
        File.open(staged_file, 'w') { |f| f << up_file.read }
      else
        FileUtils.copy(up_file, staged_file)
      end
      FileWorker.async_attach_file(:source_uri => self.uri, :file => staged_file, :location => up_file.original_filename, :mime_type => content_type)

    else
      content_type ||= 'text/plain'
      self.save!
      self.attach_files(:url => up_file.path, :options => {:mime_type => content_type, :location => up_file.original_filename})
    end
  end

  def to_uri
    self.uri.to_uri
  end

  #  def real_source
  #    @real_source ||= TaliaCore::ActiveSource.find(self.id, :prefetch_relations => true)
  #  end

  def attached_to_collections
    return [] if(new_record?)
    attached_query = ActiveRDF::Query.new(TaliaCore::Collection).select(:collection)
    attached_query.where(:collection, N::DCT.hasPart, self).where(:collection, N::RDF.type, N::DCNS.Collection)
    attached_query.execute.collect { |col| TaliaCollection.from_real_source(col) }
  end

  def unattached_collections
    collections = TaliaCollection.all
    return collections if(new_record?)
    attached = attached_to_collections
    collections.reject { |col| attached.include?(col) }
  end
end
