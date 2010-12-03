class Image::AnnotationsController < ApplicationController
  before_filter :init

  def show 
    @mode = "read"
  end

  def service
    begin
      @response = {:format => 'json', :error => false, :data => {}}
      unless flash[:error].nil?
        @response[:error] = flash[:error]
      else 
        case params[:method]
        when "loadConfiguration" then load_configuration
        when "getLayersXml" then get_layers_xml
        when "getToolbarsXml" then get_toolbars_xml
        else @response[:error] = "Unknown or no method"
        end
      end
      render_response
    rescue
      render :inline => ''
    end
  end

  private

    def init
      params.to_options!
      load_file params[:pseudo_id]
    end
    
    def load_file(pseudo_id)
      flash[:error] = "No pseudo_id" and return false if pseudo_id.nil?
      begin
        @talia_file = TaliaFile.find "#{N::LOCAL.file.to_s}/#{params[:pseudo_id]}"
        @file = @talia_file.file_by_type_preference TaliaCore::DataTypes::IipData, TaliaCore::DataTypes::ImageData
        flash[:error] = "File is not an image" if @file.nil?
      rescue ActiveRecord::RecordNotFound
        @file = nil
        flash[:error] = "File not found"
      end
      return flash[:error].nil?
    end

    def render_response
      render :inline => @response[:data] and return if @response[:format] == "text"
      render :inline => @response.to_json
    end

    # AJAX RESPONSE METHODS
    def load_configuration
      if @file.is_a? TaliaCore::DataTypes::IipData
        background = 'modules/image/iip/imageHolder.swf'
        image_url = @file.class.iip_server_uri + "?FIF=" + @file.get_iip_root_file_path
      else
        background = 'modules/image/simple/imageHolder.swf'
        image_url = url_for_data_record(@file)
      end
      @response[:data][:modules] = {:background => background}
      @response[:data][:image] = image_url
      @response[:data][:layers_url] = image_annotations_ajax_url "getLayersXml", params[:pseudo_id]
      @response[:data][:toolbars_url] = image_annotations_ajax_url "getToolbarsXml", params[:pseudo_id]
    end

    # TODO: should load all annotations for image.
    def get_layers_xml
      @response[:format] = "text"
      @response[:data] = '<?xml version="1.0" encoding="UTF-8" ?><data></data>'
    end

    def get_toolbars_xml
      @response[:format] = "text"
      @response[:data] = '<?xml version="1.0" encoding="UTF-8" ?>
<interface>
    <toolbar toolBarID="actions" headerLabel="Actions" toolBarIndex="0" opened="true">
    <button styleName="iconZoomIn" toolTip="Zoom in (Tn+)"             functionCode="27"   toggleMode="false"/>
    <button styleName="iconZoomOut" toolTip="Zoom out (Tn-)"            functionCode="28"   toggleMode="false"/>
    <button styleName="iconMoveImage" toolTip="Enable pan/zoom mode"          functionCode="29"   toggleMode="true"/>
  </toolbar>
	<global>
    <setting key="COORDS_BAR_VISIBLE" value="false" />
    <setting key="HINT_BAR_VISIBLE" value="false" />
		<setting key="LAYERITEM_TOGGLE_COLLAPSE_ON_DOUBLECLICK" value="true" />
		<setting key="LAYERITEM_COLOPRICKERVISIBLE" value="true" />
		<setting key="LAYERITEM_ALPHASLIDERVISIBLE" value="true" />
		<setting key="SUBLAYER_INDENT" value="10" />
	</global>
</interface>'
    end
end
