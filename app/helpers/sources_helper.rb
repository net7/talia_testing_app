module SourcesHelper

  # Link to the index
  def index_link
    link_to 'index', :action => 'index'
  end

  # Checks if the current filter points to the given type
  def current_filter?(ctype)
    (ctype.to_name_s('+') == params[:filter])
  end

  # Links to filter for the given type
  def filter_link_for(ctype)
    link_to ctype.to_name_s, :action => 'index', :filter => ctype.to_name_s('+')
  end

  # Gets the title for a source
  def title_for(source)
    (source[N::DCNS.title].first || N::URI.new(source.uri).local_name)
  end

  # Nested list for the subclasses. This must take a block that renders the
  # portion of HTML that goes inside each element item (usually a link)
  def subclass_list(&block)
    raise(ArgumentError, "No rendering block given") unless(block)
    result = "<ul>\n"
    elements = N::SourceClass.used_subclass_hierarchy
    elements.each { |klass, children| result << subclass_list_for(klass, children, &block) }
    result << "</ul>\n"
    result
  end

  def semantic_target(element)
    if(element.respond_to?(:uri))
      link_to(N::URI.new(element.uri).to_name_s, element.uri.to_s)
    else
      element
    end
  end


  private

  def subclass_list_for(element, children, &block)
    result = ''
    result << '<li>' << block.call(element) << "\n"
    if(!children.empty?)
      result << "<ul>\n"
      children.each { |child, progeny| result << subclass_list_for(child, progeny, &block) }
      result << "</ul>\n"
    end
    result << "</li>\n"
    result
  end

end
