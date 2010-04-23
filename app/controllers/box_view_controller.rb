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
    @small_title = "sottotitolo"
  end

  # GET /boxView/dispatch?method=XX
  #
  # the frontend sends back ajax requests, which are meant to be dispatched
  # based on get parameters.
  def dispatch
    error_code = NO_ERRORS

    case params['method']
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
      html = "Unable to fulfil the request! (Unknown method: #{params['method']}"
    end

    render_json(error_code, html, data)
  end

  # You get redirected here if you've asked for getMenu in the dispatcher action
  def render_menu
    @elements = N::SourceClass.subclass_hierarchy { |sc| sc.used? && (sc.to_uri.namespace != :owl) && (sc.to_uri.namespace != :rdfs) && (sc.to_uri.namespace != :rdf) && (sc.to_uri.namespace != :talia)} 

    html = render_to_string :menu
    data = ''

    render_json(0, html, data)
  end

  # display a list of items, of the given RDF type
  def render_filter
    @elements = TaliaCore::ActiveSource.find(:all, :find_through => [N::RDF.type, N::URI.make_uri(params[:type], '+')])

    html = render_to_string :item_list
    data = {'box' => (params[:type]).split('+').last.pluralize}
    render_json(0, html, data)

  end

  def render_source
    html = render_to_string :source
    data = ''
    render_json(0, html, data)
    
  end

  private
  def render_json(error, html, data)
    render :json => {'error' => error,
      'html' => html,
      'data' => data
    }
  end


end
