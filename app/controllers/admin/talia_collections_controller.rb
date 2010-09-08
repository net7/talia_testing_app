class Admin::TaliaCollectionsController < Admin::AdminSiteController
  
  hobo_model_controller
  
  auto_actions :all


  def create
    @talia_collection = TaliaCollection.create_collection(params[:talia_collection])
    if(save_created(@talia_collection))
      flash[:notice] = "Collection #{@talia_collection.name} succesfully created"
    else
      flash[:notice] = "Error creating the collection"
    end
    redirect_to :controller => :talia_collections, :action => :index
  end

  def reorder
    @talia_collection = TaliaCollection.find(N::URI.from_encoded(params[:id]))
    @talia_collection.updatable_by?(current_user) || raise(Hobo::PermissionDeniedError, "#{self.class.name}#reorder")
    order = params[:collection_order]
    element_hash = {}
    collection = @talia_collection.real_source
    collection.elements.each { |el| element_hash[el.id.to_s] = el }
    raise(ArgumentError, "Reorder must give the same number of elements than the original collection") unless(order.size == element_hash.size)
    collection.clear
    order.each do |ordered|
      element = element_hash[ordered]
      raise(ArgumentError, "Order contained an element that wasn't in the original collection") if(element.blank?)
      collection << element
    end
    collection.save!

    render :text => 'Done'
  end
  
end