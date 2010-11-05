module RdfProperties
  
  def rdf_property(shortcut, property, options = {})
    options.to_options!
    type = (options[:type] || :string)
    unless type.is_a?(Class)
      options.delete(:type)
    end
    singular_property shortcut, property, options
    declare_attr_type shortcut, type
  end
  
end