module SwikyNotebooksHelper
  
  # Wraps the given element into an <div class=""
  def thctag(id, content_or_options_with_block=nil, options=nil, &block)
    if(block)
      content_tag(:div, thctag_options(id, content_or_options_with_block), nil, true, &block)
    else
      content_tag(:div, content_or_options_with_block, thctag_options(id, options))
    end
  end
  
  private
  
  # Updates the given options hash for the thctag
  def thctag_options(id, options)
    options ||= {}
    options.to_options!
    if(options[:class])
      options[:class] << " THCContent"
    else
      options[:class] = "THCContent"
    end
    options[:id] = id
    options
  end
  
end
