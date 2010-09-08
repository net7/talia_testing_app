module RdfProperties
  
  def rdf_property(shortcut, property, options = {})
    options.to_options!
    type = (options.delete(:type) || :string)
    singular_property shortcut, property, options
    declare_attr_type shortcut, type
  end
  
end