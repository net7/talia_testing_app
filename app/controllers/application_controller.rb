# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base

  helper :all # include all helpers, all the time
  protect_from_forgery # See ActionController::RequestForgeryProtection for details

  before_filter :set_locale
  def set_locale
    I18n.locale = params[:locale]
  end

  def default_url_options(options={})
    { :locale => I18n.locale } 
  end


  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password
end
