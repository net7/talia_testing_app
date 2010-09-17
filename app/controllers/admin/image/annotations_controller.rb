class Admin::Image::AnnotationsController < Image::AnnotationsController
  def show
    @mode = "write"
    render "image/annotations/show"
  end

  private

    # AJAX RESPONSE METHODS
    def load_configuration
      super
      @response[:data][:layers_url] = admin_image_annotations_ajax_url "getLayersXml", params[:pseudo_id]
      @response[:data][:toolbars_url] = admin_image_annotations_ajax_url "getToolbarsXml", params[:pseudo_id]
    end

    def get_toolbars_xml
      @response[:format] = "text"
      @response[:data] = '<?xml version="1.0" encoding="UTF-8" ?>
<interface>
    <toolbar toolBarID="actions" headerLabel="Actions" toolBarIndex="0" opened="true">
		<button styleName="iconSave"  			toolTip="Save all" 								functionCode="26" 	toggleMode="false"/>
    <button styleName="iconZoomIn"      toolTip="Zoom in (Tn+)"             functionCode="27"   toggleMode="false"/>
    <button styleName="iconZoomOut"     toolTip="Zoom out (Tn-)"            functionCode="28"   toggleMode="false"/>
    <button styleName="iconMoveImage"   toolTip="Enable pan/zoom mode"          functionCode="29"   toggleMode="true"/>
		<button styleName="iconNewLayer0" 		toolTip="Create a new layer" 			functionCode="24" 	toggleMode="false"/>		
  </toolbar>
	<toolbar toolBarID="shapes" headerLabel="Shapes" toolBarIndex="1" opened="true">
		<button styleName="iconSelectTool" 		toolTip="Pointer tool" 							functionCode="22" 	toggleMode="true"/>
		<button styleName="iconSelection" 		toolTip="Select tool" 							functionCode="23" 	toggleMode="true"/>
		<button styleName="iconDrawPolyFreeHand" toolTip="Draw polygon free hand" 				functionCode="19" 	toggleMode="true"/>		
		<button styleName="iconDrawPoly" 	 	toolTip="Draw polygon"			 				functionCode="9" 	toggleMode="true"/>		
		<button styleName="iconRectangle" 	 	toolTip="Draw rectangle"		 				functionCode="10" 	toggleMode="true"/>		
		<button styleName="iconCircle" 		 	toolTip="Draw circle"			 				functionCode="11" 	toggleMode="true"/>				
	</toolbar>
	<toolbar toolBarID="editTools" headerLabel="Edit Tools" toolBarIndex="2" opened="true">
		<button styleName="iconMovePoly" 	 	toolTip="Move shape" 							functionCode="20" 	toggleMode="true"/>
		<button styleName="iconDeletePolygon" 	toolTip="Delete shape" 							functionCode="18" 	toggleMode="false"/>
		<button styleName="iconCopyPolygon" 	toolTip="Move shape" 							functionCode="21" 	toggleMode="false"/>
		<button styleName="iconAddVertex" 	 	toolTip="Add point" 							functionCode="15" 	toggleMode="true"/>
		<button styleName="iconDelVertex" 		toolTip="Delete Point" 							functionCode="16" 	toggleMode="true"/>
		<button styleName="iconMoveVertex" 	 	toolTip="Move point" 							functionCode="17" 	toggleMode="true"/>
	</toolbar>
	<global>
		<setting key="LAYERITEM_TOGGLE_COLLAPSE_ON_DOUBLECLICK" value="true" />
		<setting key="LAYERITEM_COLOPRICKERVISIBLE" value="true" />
		<setting key="LAYERITEM_ALPHASLIDERVISIBLE" value="true" />
		<setting key="SUBLAYER_INDENT" value="10" />
		<setting key="LAYERITEM_OPERATION_PANEL_SETTINGS">
			<item styleName="iconClear" functionCode="4" />
			<item styleName="iconDelete" functionCode="2" />
			<item styleName="iconFormEdit" functionCode="14" />
			<item styleName="iconSave" functionCode="64" />
		</setting>
	</global>
</interface>'
    end
end
