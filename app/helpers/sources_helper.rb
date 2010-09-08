module SourcesHelper

  # Link to the index
  def index_link
    link_to 'Index', :action => 'index'
  end

  #Links to collections
  def collections_links
    links = []
    @source.collections.each do |c|
      links << [c.uri.to_s, c.title.to_s]
    end
    links
  end

  # About parameter with the uri of the current source (if the is a current source,
  # blank string otherwise)
  def source_about
    @source ? (' about="' << @source.uri.to_s << '"') : ''
  end

  # Checks if the current filter points to the given type
  def current_filter?(ctype)
    (ctype.to_name_s('+') == params[:filter])
  end

  # Links to filter for the given type
  def filter_link_for(ctype)
    #    if (ctype == N::RDFS.Resource)
    #      link_to 'Resource', :action => 'index', :filter => ctype.to_name_s('+')
    #    else
    link_to label_for(ctype), :action => 'index', :filter => ctype.to_name_s('+')
    #    end
  end

  # returns the google map key, found in the talia_core.yml configuration file
  def googlemap_key
    TaliaCore::CONFIG['googlemap_key']
  end

  def label_for(element)
    potential_labels = ActiveRDF::Query.new(N::URI).select(:label).where(element.to_uri, N::RDFS.label, :label).execute
    if(potential_labels.blank?)
      element.to_uri.local_name
    else
      property = nil
      potential_labels.each do |label|
        prop_string = TaliaCore::PropertyString.parse(label)
        if(prop_string.lang == I18n.locale.to_s)
          property = prop_string
          break;
        elsif(prop_string.lang == I18n.default_locale)
          property = prop_string
        elsif(prop_string.lang.blank? && property.blank?)
          property = prop_string
        end
      end
      property
    end
  end

  # Gets the title for a source
  def title_for(source)
    if source[N::DCNS.title].is_a? TaliaCore::SemanticCollectionWrapper and !source[N::DCNS.title].first.nil?
      source[N::DCNS.title].values_with_lang(I18n.locale.to_s).first
    elsif source[N::RDF.label].is_a? TaliaCore::SemanticCollectionWrapper and !source[N::RDF.label].first.nil?
      source[N::RDF.label].values_with_lang(I18n.locale.to_s).first
    elsif source[N::RDFS.label].is_a? TaliaCore::SemanticCollectionWrapper and !source[N::RDFS.label].first.nil?
      source[N::RDFS.label].values_with_lang(I18n.locale.to_s).first
    elsif source[N::DCNS.title].is_a? TaliaCore::SemanticCollectionWrapper and !source[N::DCNS.title].first.nil?
      source[N::DCNS.title].first
    else
      source[N::DCNS.title]
    end
    

    #    result = case TaliaCore::SemanticCollectionWrapper
    #    when source[N::DCNS.title].is_a?
    #      source[N::DCNS.title].values_with_lang(I18n.locale.to_s).first
    #    when source[N::RDF.label].is_a?
    #      source[N::RDF.label].values_with_lang(I18n.locale.to_s).first
    #    when source[N::RDFS.label].is_a?
    #      source[N::RDFS.label].values_with_lang(I18n.locale.to_s).first
    #    when source[N::DCNS.title].is_a?
    #      source[N::DCNS.title].first
    #    else source[N::DCNS.title]
    #    end
    #    result
    #    result = source[N::DCNS.title].values_with_lang(I18n.locale.to_s).first if (source[N::DCNS.title].is_a? TaliaCore::SemanticCollectionWrapper)
    #    result = source[N::RDF.label].values_with_lang(I18n.locale.to_s).first if (result.nil? and source[N::RDF.label].is_a? TaliaCore::SemanticCollectionWrapper)
    #    result = source[N::RDFS.label].values_with_lang(I18n.locale.to_s).first if (result.nil? and source[N::RDFS.label].is_a? TaliaCore::SemanticCollectionWrapper)
    #    result = source[N::DCNS.title].first if (result.nil? and source[N::DCNS.title].is_a? TaliaCore::SemanticCollectionWrapper)
    #    #    result = N::URI.new(source.uri).local_name.titleize if result.nil?
    #    result = source[N::DCNS.title]
    #    result
  end

  

  # Creates a link to an external resources (warns that you are leaving the site)
  def external_link_to(element, predicate)
    # We check if this is in the list of defined links to deal with in different ways

    #TODO: for the demo we only deal with owl:SameAs
    #extend it to use a set of configured predicates

    if (predicate == N::OWL.SameAs.to_s)

    end

    # this is just an external link
    link_to("#{element.uri} (external link)", element.uri.to_s, {:target => "_blank"})
  end

  # If the element is a resource or an uri-like element, create a link to that element (if it's just a string, it
  # is just passed through).
  #
  # If the element is in the "local" namespace, the helper will automatically create a correct URI, even if the
  # current app doesn't run on the "local" domain. Otherwise it will use the URI itself for the link URI.
  def semantic_target(element, predicate)
    if(element.respond_to?(:uri))
      #      uri = element.to_uri
      #      if(uri.local?)
      #        link_to(uri.to_name_s, :controller => 'sources', :action => 'dispatch', :dispatch_uri => uri.local_name)
      #      elsif(predicate == N::RDF.type.to_s)
      #        link_to(uri.to_name_s, :controller => 'sources', :params => {:filter => uri.to_name_s('+')})
      #      else
      #        external_link_to(element, predicate)
      #      end
      uri = element.to_uri
      if(uri.local?)
        link_to(title_for(TaliaCore::ActiveSource.find(uri.to_s)), :controller => 'sources', :action => 'dispatch', :dispatch_uri => uri.local_name)
      elsif(predicate == N::RDF.type.to_s)
        link_to(uri.to_name_s, :controller => 'sources', :params => {:filter => uri.to_name_s('+')})
      else
        external_link_to(element, predicate)
      end

    else
      element
    end
  end



  def type_images(types)
    @type_map ||= {
      N::TALIA.Source => 'source',
      N::FOAF.Group => 'group',
      N::LUCCADOM.epoch => 'period',
      N::LUCCADOM.building => 'building',
      N::LUCCADOM.museum => 'image',
      N::LUCCADOM.epoch => 'period',
      N::LUCCADOM.document => 'document',
      N::LUCCADOM.artwork => 'image',
      N::LUCCADOM.place => 'map',
      N::LUCCADOM.city => 'map',
      N::FOAF.Person => 'person',
      N::LUCCADOM.church => 'building',
      N::DEMO.Calif => 'caliph',
      N::DEMO.Caliph => 'caliph',
      N::DEMO.Person => 'person',
      N::DEMO.Artist => 'person',
      N::DEMO.Religious_Figure => 'church',
      N::DEMO.Empire => 'building',
      #      N::DEMO.Event => '',
      #      N::DEMO.Fresco => '',
      #      N::DEMO.Artistic_medium => '',
      #      N::DEMO.Period => '',
      #      N::DEMO.Book => '',
      N::DEMO.City => 'city',
      #      N::DEMO.Place => '',
      N::DEMO.Mosque => 'mosque',
      N::DEMO.Sanctuary => 'sanctuary'

    }
    result = ''
    types.each do |t|
      image = @type_map[t] || 'source'
      name = t.local_name.titleize

      result << link_to(image_tag("demo/#{image}.png", :alt => name, :title => name),
        :action => 'index', :filter => t.to_name_s('+')
      ) unless ((t == N::TALIA.Source) || (t == N::TALIA.DummySource) || (t==N::TALIA.ActiveSource))
    end
    result
  end

  def type_images_medium(types)
    @type_map ||= {
      N::TALIA.Source => 'source',
      N::FOAF.Group => 'group',
      N::LUCCADOM.epoch => 'period',
      N::LUCCADOM.building => 'building',
      N::LUCCADOM.museum => 'museum',
      N::LUCCADOM.epoch => 'period',
      N::LUCCADOM.document => 'document',
      N::LUCCADOM.artwork => 'artwork',
      N::LUCCADOM.place => 'map',
      N::LUCCADOM.city => 'map',
      N::FOAF.Person => 'person',
      N::LUCCADOM.church => 'building',
      N::LUCCADOM.institution => 'institution',
      N::DEMO.Calif => 'caliph',
      N::DEMO.Caliph => 'caliph',
      N::DEMO.Person => 'person',
      N::DEMO.Artist => 'person',
      N::DEMO.Religious_Figure => 'church',
      N::DEMO.Empire => 'building',
      #      N::DEMO.Event => '',
      #      N::DEMO.Fresco => '',
      #      N::DEMO.Artistic_medium => '',
      #      N::DEMO.Period => '',
      #      N::DEMO.Book => '',
      N::DEMO.City => 'city',
      #      N::DEMO.Place => '',
      N::DEMO.Mosque => 'mosque',
      N::DEMO.Sanctuary => 'sanctuary'
    }
    result = ''
    types.each do |t|
      image = @type_map[t] || 'source'
      name = t.local_name.titleize
      result << link_to(image_tag("demo/types_medium/#{image}.png", :alt => name, :title => name, :width => "64px"),
        :action => 'index', :filter => t.to_name_s('+')
      ) unless ((t == N::TALIA.Source) || (t == N::TALIA.DummySource) || (t==N::TALIA.ActiveSource))
    end
    result
  end

  def data_icons(source)
    result = ''
    data_records = source.data_records
    data_records.each do |rec|
      link_data = data_record_options(rec)
      result << link_to(
        image_tag("demo/#{link_data.first}.png", :alt => rec.location, :title => rec.location),
        { :controller => 'source_data',
          :action => 'show',
          :id => rec.id },
        link_data.last
        # we have both imagedata and iipdata of the images, we only show the IipData one
        # as it will show the thumbnails (instead of very large images, which make no sense
        # in the overlay)
      ) unless ( rec.is_a?(TaliaCore::DataTypes::ImageData) && data_record_has_an_iip_related(source, rec))
      #          ( source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', rec.location) ||
      #            # when tiffs are uploaded, the ImageData object has a different extension (png), check if there's a .tif IipData
      #            # TODO: it's dangerous as two different files with .tif and .png extension are loaded, this ignore the png one...
      #            source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(rec.location, File.extname(rec.location)) + ".tif") ||
      #            source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(rec.location, File.extname(rec.location)) + ".tiff")
      #        ))
      #                ) unless ( rec.is_a?(TaliaCore::DataTypes::ImageData) && !rec.mime.include?('image/png'))
    end

    result
  end

  def data_record_has_an_iip_related(source, rec)
    source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', rec.location) ||
      # when tiffs are uploaded, the ImageData object has a different extension (png), check if there's a .tif IipData
    # TODO: it's dangerous as two different files with .tif and .png extension are loaded, this ignore the png one...
    source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(rec.location, File.extname(rec.location)) + ".tif") ||
      source.data_records.find_by_type_and_location('TaliaCore::DataTypes::IipData', File.basename(rec.location, File.extname(rec.location)) + ".tiff")

  end

  def data_records_contain_objects_of_type?(data_records, type)
    data_records.each do |dr|
      return true if dr.is_a?(type)
    end
    return false
  end

  private

  def data_record_options(record)
    if(record.mime.include?('image/'))
      ['image', {:class => 'cbox_image'}]
    elsif(record.mime.include?('text/'))
      ['text', {:class =>'cbox_inline' }]
    elsif(record.mime == 'application/xml')
      ['text', {:class => 'cbox_inline'}]
    else
      ['gear', {}]
    end
  end

end
