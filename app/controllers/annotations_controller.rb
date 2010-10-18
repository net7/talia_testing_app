class AnnotationsController < ApplicationController
  verify :params => :uri, :except => [:getRepositoryDescription, :getAll]
  verify :params => :repository, :only => [:getRepositoryDescription]

  before_filter :annotations

  def getAll
    @result = @annotations.get_all
    respond_to do |format|
      format.json {render :text => @result.to_json}
      format.xml  {render :text => @result.to_xml}
    end
  end

  def getFragments
    @result = @annotations.get_fragments params.delete(:uri), params
    render_result
  end

  def getFragmentCoordinates
    @result = @annotations.get_fragment_coordinates params[:uri]
    render_result
  end

  def getAnnotationsInvolvingResource
    @result = @annotations.get_annotations_involving_resource params.delete(:uri), params
    render_result
  end

  def getAnnotationsCreatedOnResource
    @result = @annotations.get_annotations_created_on_resource params.delete(:uri), params    
    render_result
  end

  def getResourceProperties
    @result = @annotations.get_resource_properties params[:uri], params[:names]
    render_result
  end

  def getRepositoryDescription
    @result = @annotations.get_repository_description params[:repository]
    render_result
  end

  def getResourceDescription
    @result = @annotations.get_resource_description params[:uri]
    render_result
  end

  private
    def render_result
      respond_to do |format|
        format.json {render :text => @result.to_json}
        format.html # :action.html.erb
        format.rdf  # ?
        format.xml  # :action.xml.builder
      end
    end

    def annotations
      @annotations = TaliaCore::Annotations.new 10
    end
  # end private
end
