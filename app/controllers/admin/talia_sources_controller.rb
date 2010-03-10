class Admin::TaliaSourcesController < Admin::AdminSiteController
  
  hobo_model_controller
  
  auto_actions :all
  
  def show
    @talia_source = find_instance
    @real_source = @talia_source.real_source
    @property_names = @real_source.direct_predicates
    @properties = {}
    @property_names.each do |pred|
      @properties[pred.to_s] = @real_source[pred]
    end
  end
  
  # TODO: Permisions?
  def assign_collection
    source, collection = get_source_and_collection
    source.predicate_set_uniq(:talia, :isInCollection, collection)
    source.save!
  end
  
  # TODO: Permissions?
  def remove_collection
    source, collection = get_source_and_collection
    source[N::TALIA.isInCollection].remove(collection)
    source.save!
  end
  
  private
  
  # Set up source and collection and related class vars for the
  # assign/remove_collection methods
  def get_source_and_collection
    source_uri = N::URI.from_encoded(params[:source])
    collection_uri = N::URI.from_encoded(params[:collection])
    source = TaliaCore::ActiveSource.find(source_uri)
    collection = TaliaCore::Collection.find(collection_uri)
    @source_id = params[:source]
    @source = TaliaSource.find(source.id)
    [ source, collection ]
  end
  
end