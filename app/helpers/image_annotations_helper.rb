module ImageAnnotationsHelper
  def image_annotations_include_tags(swicky_mode=false)
    result = javascript_include_tag('/flexip/scripts/swfobject.js')
    result << javascript_include_tag('jquery.base64.min.js')
    result << javascript_include_tag('/flexip/scripts/flexip_api.js')
    result << javascript_include_tag('flexip/utilities.js')
    result << javascript_include_tag('flexip/common.js')
    unless swicky_mode
      result << javascript_include_tag('flexip/source_annotation.js')
    else
      result << javascript_include_tag('flexip/source_annotation_swicky.js')
    end
  end
end
