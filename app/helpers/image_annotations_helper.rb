module ImageAnnotationsHelper
  def image_annotations_include_tags(swicky_mode=false)
    result = javascript_include_tag('/flexip/scripts/swfobject')
    result << javascript_include_tag('jquery.base64.min')
    result << javascript_include_tag('json2')
    result << javascript_include_tag('/flexip/scripts/flexip_api')
    result << javascript_include_tag('flexip/utilities')
    result << javascript_include_tag('flexip/common')
    unless swicky_mode
      result << javascript_include_tag('flexip/source_annotation')
    else
      result << javascript_include_tag('flexip/source_annotation_swicky')
    end
  end
end
