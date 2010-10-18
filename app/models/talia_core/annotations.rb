module TaliaCore
  class Annotations
    include TaliaUtil::UriHelper
    include FakeAnnotations

    def initialize(n=10)
      populate_fake_annotations n
    end

    def get_all
      @fake_annotations
    end

    # limit=nil, start=0
    def get_fragments(uri, options={})
      options.to_options!
      resource = generate_resource uri

      result = {
        :requested => {
          :uri => uri,
          :format => resource[:format],
          :location => resource[:location]
        },
        :limit => options[:limit],
        :start => options[:start],
        :fragments => []
      }

      @fake_annotations.each do |a|
        a[:fragments].each do |f|
          result[:fragments] << f if f[:is_part_of] == uri
        end
      end
      result[:total] = result[:fragments].size
      limited_result result, options
    end

    # limit=nil, start=0
    def get_fragment_coordinates(uri)
      @fake_annotations.each do |a|
        a[:fragments].each do |f|
          return f if f[:uri] == uri
        end
      end
      {}
    end

    # limit=nil, start=0, statements=false, annotationMetadata=true,
    # langList, includeFragments=false
    def get_annotations_involving_resource(uri, options={})
    end

    # limit=nil, start=0, statements=false, annotationMetadata=true,
    # langList, includeFragments=false
    def get_annotations_created_on_resource(uri, options={})
    end

    def get_resource_properties(uri, names=['label', 'description'])
      resource = generate_resource uri
      result = {
        :requested => {:uri => uri, :format => resource[:format], :location => resource[:location]},
        :properties => []
      }
      names.each do |name|
        if[resource[name.to_sym]]
          result[:properties] << {
            :name => name,
            :values => resource[name.to_sym]
          }
        end
      end
      result
    end

    def get_resource_description(uri)
      generate_resource uri
    end    

    def get_repository_description(repository_id)
      {}
    end

    private
      def limited_result(result, options={})
        options[:limit].blank? ? result : result.slice(options[:start].to_i, options[:limit])
      end
    # end private
  end
end
