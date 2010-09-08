class Admin::TaliaSourcesController < Admin::AdminSiteController
  
  hobo_model_controller
  
  auto_actions :all

  def create
    files = params[:talia_source].delete(:file)
    date = params.delete(:date)
    params[:talia_source][:date] = date
    hobo_source_create do |created_source|
      created_source.assign_random_id
      created_source.save!
      add_files(created_source, files)
      assign_collection_from_params(created_source)
      created_source.save!
    end
   
    redirect_to :action => 'index'
  end

  def update
    files = params[:talia_source].delete(:file)
    hobo_source_update do |updated_source|
      add_files(updated_source, files)
      updated_source.save!
    end
    redirect_to :action => 'index'

  end

  def show
    @talia_source = TaliaSource.find(params[:id])
    @property_names = @talia_source.direct_predicates
    @properties = {}
    @property_names.each do |pred|
      @properties[pred.to_s] = @talia_source[pred]
    end
  end

  # attach files to the created/updated source
  def add_files(source, files)
    files.each do |f|
      source.attach_file(f) if File.file?(f)
    end unless files.nil?
  end

  # Connect the current source to the collection passed by the
  # request
  def assign_collection
    source, collection = get_source_and_collection
    collection.updatable_by?(current_user) || raise(Hobo::PermissionDeniedError, "#{self.class.name}#assign_collection")
    collection.real_source << source unless(collection.real_source.include?(source))
    collection.save!
  end

  # Remove the current source from the collection given by the
  # request
  def remove_collection
    source, collection = get_source_and_collection
    collection.updatable_by?(current_user) || raise(Hobo::PermissionDeniedError, "#{self.class.name}#assign_collection")
    collection.real_source.delete(source)
    collection.save!
  end

  # Remove a file from the current source
  def remove_file

    file_location = params[:file_location]
    @source_files_id = params[:source] + '_files'
    @source = TaliaCore::Source.find(N::URI.from_encoded(params[:source]))
    dr = @source.data_records.find_by_type_and_location(params[:file_class], file_location)
    dr.destroy
    dr_iip = @source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', file_location)
    dr_iip = @source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(file_location, File.extname(file_location)) + ".tif") if dr_iip.nil?
    dr_iip = @source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(file_location, File.extname(file_location)) + ".tiff") if dr_iip.nil?
    dr_iip.destroy unless dr_iip.nil?
  end

  # send a file
  def show_file
    @source = TaliaCore::Source.find(N::URI.from_encoded(params[:source]))
    dr = @source.data_records.find_by_type_and_location(params[:file_class], params[:file_location])
    send_file(dr.data_path + dr.full_filename , :disposition => :attachment)
  end

  private

  # Set up source and collection and related class vars for the
  # assign/remove_collection methods
  def get_source_and_collection
    source_uri = N::URI.from_encoded(params[:source])
    collection_uri = N::URI.from_encoded(params[:collection])
    source = TaliaCore::ActiveSource.find(source_uri)
    collection = TaliaCollection.find(collection_uri)
    @source_id = params[:source]
    @source = TaliaSource.find(source.id)
    [ source, collection ]
  end

  def assign_collection_from_params(source)
    if(!params[:attach_collection].blank? && source.updatable_by?(current_user))
      uri = N::URI.from_encoded(params[:attach_collection])
      book = TaliaCore::Collection.find(uri.to_s)
      book << source
      book.save!
    end
  end


end