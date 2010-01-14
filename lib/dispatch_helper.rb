class DispatchHelper
  
  class << self
    
    def template_path
      @template_path ||= File.join(RAILS_ROOT, 'app', 'views', 'semantic_templates')
    end
    
    def template_for(source)
      source.types.each do |type|
        if(template = template_map[type.uri.to_s])
          return template
        end
      end
    end
    
    private
    
    def map_templates_in(dir)
      namespace = N::Namespace[File.basename(dir)]
      namsp_object = N::Namespace[namespace]
      TaliaCore.logger.warn("WARNING: Template files in #{dir} are never used, no namespace: #{namespace}.") unless(namesp_object)
      return unless(namesp_object)
      Dir["#{dir}/*"].each do |template|
        next unless(File.file?(template))
        template = File.basename(template, File.extname(template))
        @template_map[(namsp_object + template).to_s] = "#{semantic_templates}/#{namespace}/#{template}"
      end
    end
    
    def template_map
      return @template_map if(@template_map && (Dependencies.mechanism != :require))
      @template_map = {}
      Dir["#{template_path}/*"].each do |dir|
        next unless(File.dir?(dir))
        map_templates_in(dir)
      end
      @template_map
    end
    
  end
  
end