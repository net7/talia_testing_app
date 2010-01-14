module IipHelper

  # Creates the javascript tags to load all things that are required to use the IIP viewer component
  def iip_include_tags
    result = javascript_include_tag('swfobject')
  	result << javascript_include_tag('iip_flashclient')
  	result
  end

  # Inserts the IIP flash viewer into the page. This method takes an IIP data object (from which the iip request
  # url will be generated), and optionally the height, width and a css class that will be attached to the
  # div object of the viewer.
  def iip_flash_viewer(iip_data, height = 400, width = 400, klass='iipviewer')
    raise(ArgumentError, 'Must pass an iip data object here') unless(iip_data.is_a?(TaliaCore::DataTypes::IipData))
    render :partial => 'shared/iip_flash_viewer', :locals => {
      :image_path => iip_data.get_iip_root_file_path,
      :height => height.to_s,
      :width => width.to_s,
      :element_id => "iip_viewer_#{rand 10E16}", # Random name so that multiple instances can be used
      :div_class => klass
    }
  end

end