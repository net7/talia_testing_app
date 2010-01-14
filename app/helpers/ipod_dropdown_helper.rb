module IpodDropdownHelper
  
  # Includes all the javascript and styles needed for the ipod dropdown
  # 
  # Note that this does *not* include the jquery framework which is needed
  # for the widget!
  def fg_menu_includes
    result = javascript_include_tag('fg.menu')
    result << stylesheet_link_tag('ipod-menu/fg.menu.css')
    result << stylesheet_link_tag('ipod-menu/theme/ui.all.css')
    result
  end
  
  # Place an ipod-menu-like dropdown many with multiple levels
  # This must contain a block to render each of the list elements. The block should
  # create an a tag for each of the elements in the list.
  #
  # The elements must be a tree-like hash construct of the form 
  # {root_a => {child1 => {}, child2 => {}}, root_b => {}}
  #
  # Each of the elements will be passed to the rendering block of this method
  def ipod_dropdown(title, elements, &block)
    raise(ArgumentError, "Must pass rendering block here.") unless(block)
    render(:partial => 'shared/ipod_dropdown', :locals => { :button_text => title, :elements => elements, :item_block => block })
  end
    
    
  # Render a nested ul list from a tree-like hash structure (where each hash key is a node,
  # and the value containing the children)
  def tree_list(elements, &block)
    raise(ArgumentError, "No rendering block given") unless(block)
    result = "<ul>\n"
    elements.each { |parent, children| result << subtree_list_for(parent, children, &block) }
    result << "</ul>\n"
    result
  end
  
  private
  
  def subtree_list_for(parent, children, &block)
    result = ''
    result << '<li>' << block.call(parent) << "\n"
    if(!children.empty?)
      result << "<ul>\n"
      children.each { |child, progeny| result << subtree_list_for(child, progeny, &block) }
      result << "</ul>\n"
    end
    result << "</li>\n"
    result
  end
  
end