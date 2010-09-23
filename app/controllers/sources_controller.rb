class SourcesController < ApplicationController
  include TaliaCore
  
  before_filter :set_swicky_mode
  before_filter :setup_format, :only => [ 'show' ]

  PER_PAGE = 10
  
  # GET /sources
  # GET /sources.xml
  def index
    @rdf_types ||= self.class.source_types

    conditions = { :prefetch_relations => true, :include => :data_records, :order => "uri"}

    if(filter = params[:filter])
      @filter = N::URI.make_uri(filter, '+')
      uris = ActiveRDF::Query.new(N::URI).select(:source).where(:source, N::RDF.type, @filter).execute
      conditions.merge!(:conditions => { :uri => uris.collect { |ur| ur.to_s } })
    end
    if(will_paginate?)
      #     @sources = TaliaCore::ActiveSource.paginate(conditions.merge(:page => params[:page]))
      @sources = TaliaSource.paginate(conditions.merge(:page => params[:page]))
    else
      #      @sources = TaliaCore::ActiveSource.find(:all, conditions)
      @sources = TaliaSource.find(:all, conditions)
    end



    @conditions = conditions
  end

  # GET /sources/1
  # GET /sources/1.xml
  def show
    #TODO: is this used anymore ?
    check_source_or_redirect

    respond_to do |format|
      format.xml { render :text => @source.to_xml }
      format.rdf { render :text => @source.to_rdf }
      format.html { render }
    end
  end

  # GET /sources/1/name
  def show_attribute
    headers['Content-Type'] = Mime::TEXT
    attribute = TaliaCore::Source.find(params[:source_id])[params[:attribute]]
    status = '404 Not Found' if attribute.nil?
    render :text => attribute.to_s, :status => status
  end

  # GET /sources/1/foaf/friend
  def show_rdf_predicate
    headers['Content-Type'] = Mime::TEXT
    predicates = TaliaCore::Source.find(params[:id]).predicate(params[:namespace], params[:predicate])
    if predicates.nil?
      # This is a workaround: when predicates is nil it tries to render a template with the name of this method.
      predicates = ''
      status = '404 Not Found'
    end
    render :text => predicates, :status => status
  end
  

  # Semantic dispatch. This method will try to auto-handle URLs that are not otherwise
  # caught and try to handle them.
  #
  # This method is designed with the Linked Open Data standard in mind: depending on the 
  # requested format, as determined either by HTTP_ACCEPT header or :format, this action will issue a 
  # "HTTP/1.1 303 See Other" response pointing to a url specific to the determined format. E.g.:
  # http://localhost:3000/data/Whatever will render data in rdf format
  # http://localhost:3000/page/Whatever will render data in html format
  # http://localhost:3000/xml/Whatever will render data in xml format
  # The last one is not specified by LOD, but we also have xml format and it looks good this way.
  # The actual URLs we will be redirected to will be determined in config/routes.rb, of course, 
  # and they will have to point to one of #dispatch_html, #dispatch_rdf or #dispatch_xml methods.
  #
  # LOD reference: http://www4.wiwiss.fu-berlin.de/bizer/pub/LinkedDataTutorial/
  def dispatch
    check_source_or_redirect
    ActionController::Base.use_accept_header = true
    @requested_fragmet = params[:fragment]
    case request.format
    when 'xml' then redirect_to :status => 303, :action => 'dispatch_xml',  :dispatch_uri => params[:dispatch_uri]
    when 'rdf' then redirect_to :status => 303, :action => 'dispatch_rdf',  :dispatch_uri => params[:dispatch_uri]
    else            redirect_to :status => 303, :action => 'dispatch_html', :dispatch_uri => params[:dispatch_uri]
    end
  end

  # This action will display the view for a source forcing output format to HTML, unless the 
  # requested URI does not exist, in which case it will just render an empty page.
  #
  # If the source exists, all of its  relations will be automaticaly prefetched when it's loaded.
  #
  # The dispatch also supports callbacks in the controller: If you have a source with
  # type dcns:name, it will try to call the method #dncs_name (if defined) before 
  # rendering the source.
  def dispatch_html
    # If we come here, it means that we want HTML, no matter what :format says
    request.format = 'html'
    response.content_type = Mime::HTML
    #    if source
    check_source_or_redirect
    callback
    render :action => template_for(@source)
    #    else
    #      render :text => ''
    #    end
  end

  # This action will display the view for a source forcing output format to RDF, unless the 
  # requested URI does not exist, in which case it will just render an empty page.
  #
  # If the source exists, all of its  relations will be automaticaly prefetched when it's loaded.
  #
  # The dispatch also supports callbacks in the controller: If you have a source with
  # type dcns:name, it will try to call the method #dncs_name (if defined) before 
  # rendering the source.
  def dispatch_rdf
    # If we come here, it means that we want RDF, no matter what :format says
    request.format = 'rdf'
    response.content_type = Mime::RDF
    #    if source
    check_source_or_redirect
    callback
    render :text => @source.to_rdf
    #    else
    #      render :text => ''
    #    end
  end

  # This action will display the view for a source forcing output format to XML, unless the 
  # requested URI does not exist, in which case it will just render an empty page.
  #
  # If the source exists, all of its  relations will be automaticaly prefetched when it's loaded.
  #
  # The dispatch also supports callbacks in the controller: If you have a source with
  # type dcns:name, it will try to call the method #dncs_name (if defined) before 
  # rendering the source.
  def dispatch_xml
    # If we come here, it means that we want XML, no matter what :format says
    request.format = 'xml'
    response.content_type = Mime::XML
    #    if source
    check_source_or_redirect
    callback
    render :text => @source.to_xml
    #    else
    #      render :text => ''
    #    end
  end

  # Autocompletion actions

  def auto_complete_for_uri
    if(s_uri = params[:record][:source])
      s_uri_parts = s_uri.split(':')
      options = { :limit => 10 }
      @records = if(s_uri.include?('://'))
        #        TaliaCore::ActiveSource.find_by_partial_uri(s_uri, options)
        TaliaCore::Source.find_by_partial_uri(s_uri, options)
      elsif(s_uri_parts.size == 2)
        #        TaliaCore::ActiveSource.find_by_partial_local(s_uri_parts.first, s_uri_parts.last, options)
        TaliaCore::Source.find_by_partial_local(s_uri_parts.first, s_uri_parts.last, options)
      else
        #        TaliaCore::ActiveSource.find_by_uri_token(s_uri, options)
        TaliaCore::Source.find_by_uri_token(s_uri, options)
      end

      render :inline => "<%= content_tag(:ul, @records.map { |rec| content_tag(:li, h(N::URI.new(rec.uri).to_name_s)) }) %>"
    else
      render :inline => ''
    end
  end
  
  private

  def set_swicky_mode
    @swicky_mode = request.user_agent.index("annotation-client-") == 0
  end

  def check_source_or_redirect
    return true if @source
    if !ActiveSource.exists?(params[:dispatch_uri])
      source_uri = N::LOCAL + params[:dispatch_uri]
      qry = ActiveRDF::Query.new(N::URI).select(:file, :page).distinct
      qry.where(source_uri, N::RDF.type, N::SWICKY.ImageFragment)
      qry.where(source_uri, N::DISCOVERY.isPartOf, :file)
      qry.where(source_uri, N::SWICKY.appearsIn, :page)
      fragment, page = qry.execute.first
      if fragment
        redirect_to page + '&fragment=' + fragment and return
      else
        raise(ActiveRecord::RecordNotFound)
      end
    else
      @source = TaliaCore::Source.find params[:dispatch_uri], :prefetch_relations => true
    end
  end

  def callback
    @types = @source.types
    @types.each do |type|
      caller = type.to_name_s('_')
      self.send(caller) if(self.respond_to?(caller))
    end
  end

  # Hack around routing limitation: We use the @ instead of the dot as a delimiter
  def setup_format
    split_id = params[:id].split('@')
    assit(split_id.size <= 2)
    params[:id] = split_id.first
    params[:format] = (split_id.size > 1) ? split_id.last : 'html'
  end
  
  # Indicates if pagination is available.
  def will_paginate?
    return @will_paginate if(@will_paginate != nil)
    return true if(defined?(WillPaginate))
    begin
      require 'rubygems'
      require 'will_paginate'
      @will_paginate = true
    rescue MissingSourceFile
      logger.warn('will_paginate cannot be found, pagination is not available')
      @will_paginate = false
    end
    @will_paginate
  end

  # Returns the first matching template for the given source.
  #
  # * If the source has RDF types, it will try to find the first template
  #   that matches one of the RDF types. If one is found is it returned.
  # * Otherwise, it will look for a default template matching the source's
  #   runtime class.
  # * If no other template is found, this will return the default template name
  def template_for(source)
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

    def template_path
      @template_path ||= File.join(RAILS_ROOT, 'app', 'views', 'sources', 'semantic_templates')
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
