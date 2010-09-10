class OaiController < ApplicationController
  def index
    # Remove controller and action from the options.  Rails adds them automatically.
    options = params.delete_if { |k,v| %w{controller action}.include?(k) }

    if options.has_key? 'set'
      response = OAI::Provider::Response::Error.new(TaliaOaiProvider, OAI::SetException.new).to_xml
    else
      provider = TaliaOaiProvider.new
      response =  provider.process_request(options)
    end
    render :text => response, :content_type => 'text/xml'
  end

  # Don't need i18n here
  def set_locale
  end

  def default_url_options(options={})
    {}
  end
end
