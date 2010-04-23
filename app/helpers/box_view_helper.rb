module BoxViewHelper

  def semantic_menu_for (elements)
    result = '<ul>'
    # the first element is "Resource" we don't want it to be shown
    result << semantic_submenu_for(elements.first[1])
    result << '</ul>'
    result
  end

  private
  def semantic_submenu_for (elements)
    result = ''
    return '' if elements.nil?
    elements.each do |k,v|
      if v.empty?
        result << "<li class='menu_subitem'><a class='indexLink' id='#{k.to_name_s('+')}' href='/boxView?method=filter&type=#{k.to_name_s('+')}'>#{k.to_name_s('+')}</a></li>"
      else
        result << "<li class='menu_item'><a class='menu collapsed' href='#'>#{k.to_name_s('+')}</a>"
        result << "<ul style='display: none;'>"
        result << semantic_submenu_for(v)
        result << '</ul>'
        result << '</li>'
      end
    end
    result
  end


end
