class Admin::ImportController < ApplicationController
  
  hobo_controller
  
  def index
  end
  
  def upload_import
    TaliaCore::ActiveSource.create_from_xml(params[:import_file].read)
  end
  
end