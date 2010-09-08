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