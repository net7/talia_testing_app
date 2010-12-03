module SemanticTemplateHelper



  # Returns the first matching template for the given source.
  #
  # * If the source has RDF types, it will try to find the first template
  #   that matches one of the RDF types. If one is found is it returned.
  # * Otherwise, it will look for a default template matching the source's
  #   runtime class.
  # * If no other template is found, this will return the default template name
  def template_for(source, view=nil)
    template_view=(view)
    source.types.each do |type|
      if(template = template_map[type.uri.to_s.downcase])
        return template
      end
    end
    template = template_map[source.class.name.demodulize]
    template ? template : "semantic_templates/default/default"
  end

  def template_map
    self.class.template_map
  end

  class << self

    def template_map
      return @template_map if(@template_map && (ActiveSupport::Dependencies.mechanism != :require))
      @template_map = {}
      Dir["#{template_path}/*"].each do |dir|
        next unless(File.directory?(dir) && File.basename(dir) != 'default')
        map_templates_in(dir)
      end
      map_default_templates
      @template_map
    end

    def template_view(view)
      @template_view = 
        if view.nil? 
          'sources'
        else
          view
        end
    end

    def template_path
      @template_path ||= File.join(RAILS_ROOT, 'app', 'views', @template_view, 'semantic_templates')
    end

    def source_types
      return @source_types if(@source_types)
      @source_types = ActiveRDF::Query.new(N::URI).select(:type).distinct.where(:source, N::RDF.type, :type).execute
      @source_types
    end

    private

    # Creates a hash that can be used for looking up the correct semantic
    # template for a source. This scans the template directory and connects
    # the templates to the right RDF types
    def map_templates_in(dir)
      namespace = File.basename(dir)
      namesp_object = N::Namespace[namespace]
      TaliaCore.logger.warn("WARNING: Template files in #{dir} are never used, no namespace: #{namespace}.") unless(namesp_object)
      return unless(namesp_object)
      Dir["#{dir}/*"].each do |template|
        next unless(File.file?(template))
        template = template_basename(template)
        @template_map[(namesp_object + template).to_s.downcase] = "semantic_templates/#{namespace}/#{template}"
      end
    end
  
    # Map the "default" templates to runtime types
    def map_default_templates
      Dir["#{template_path}/default/*"].each do |templ|
        templ_name = template_basename(templ)
        next unless(File.file?(templ) && templ_name != 'default' )
        @template_map[templ_name.camelize] = "semantic_templates/default/#{templ_name}"
      end
    end
  
    # Get the "basename" of a template
    def template_basename(template_file)
      base = File.basename(template_file)
      base.gsub(/\..*\Z/, '')
    end

  end
  

end
