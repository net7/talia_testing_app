require "base64"
class BoxViewController < ApplicationController
  include TaliaCore

  layout nil

  NO_ERRORS = 0
  ERROR_DB_NOT_RESPONDING = 1
  ERROR_INTERNAL = 2
  ERROR_UNKNOWN_METHOD = 10
  ERROR_UNKNOWN_PARAMETER = 11
  ERROR_MISSING_PARAMETER = 12
  ERROR_INVALID_PARAMETER = 13
  ERROR_UNKNOWN_LANGUAGE = 20
  ERROR_UNKNOWN_EXCEPTION = 99

  # GET /boxView/
  def index
    @title = "boxed navigation"
    @small_title = "Boxed navigation Demo"
  end

  # GET /boxView/dispatch?method=XX
  #
  # the frontend sends back ajax requests, which are meant to be dispatched
  # based on get parameters.
  def dispatch
    error_code = NO_ERRORS

    case params[:method]
    when 'getIntro'
      html = render_to_string :intro
      data = {'box' => "welcome"}
    when 'getMenu'
      render_menu and return
    when 'getSource'
      render_source and return
    when 'filter'
      render_filter and return
    else
      error_code = ERROR_UNKNOWN_METHOD
      html = "Unable to fulfil the request! (Unknown method: #{params[:method]}"
    end

    render_json(error_code, html, data)
  end

  # Display the left side menu
  def render_menu
    @elements = N::SourceClass.subclass_hierarchy { |sc| sc.used? && (sc.to_uri.namespace != :owl) && (sc.to_uri.namespace != :rdfs) && (sc.to_uri.namespace != :rdf) && (sc.to_uri.namespace != :talia)} 

    html = render_to_string :menu
    data = ''
    render_json(0, html, data)
  end

  # Display a list of items, of the given RDF type
  def render_filter
    filter = params[:type]

    qry = ActiveRDF::Query.new.select(:t)
    qry.where(:t, N::RDF.type, N::URI.make_uri(filter, '+'))
    @elements = qry.execute

    html = render_to_string :item_list
    data = {'box' => filter.split('+').last.pluralize}
    render_json(0, html, data)
  end

  # A source has been requested.  
  # We deal with it here, and display an appropriate box
  def render_source
    source_uri = Base64.decode64(params[:resource])
    @source = TaliaCore::ActiveSource.find(source_uri)
    
    types = ActiveRDF::Query.new(N::URI).select(:type).distinct.where(@source, N::RDF.type, :type).execute
    if  N::DEMO.Person.in? types
      html = render_to_string :person
    elsif N::DEMO.City.in? types
      html = render_to_string :city
    else
      html = render_to_string :source
    end
    data = {'box' => TaliaCore::ActiveSource.find(source_uri).uri.to_uri.local_name.to_s.gsub('_', ' ')}

    render_json(0, html, data)
  end


  private

  # Serves the data in the format required by the javascript driving the User Interface
  def render_json(error, html, data)
    # javascript script "error.js" will complain if we pass a real json object as we could
    # by using the following code (aka the correct way to pass json)
    render :json => {'error' => error,
      'html' => html,
      'data' => data
    }

    # hence we render a string

    #    json_data = {'error' => error,
    #      'html' => html,
    #      'data' => data
    #    }
    #
    #    render :inline => json_data.to_json('html')

  end


end
