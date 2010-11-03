class Admin::ImportController < ApplicationController
  
  hobo_controller
  
  def index
  end
  
  def upload_import
    #    TaliaCore::ActiveSource.create_from_xml(params[:import_file].read)
    FileWorker.async_web_import(:file_name => params[:import_file].path)
    @import_text = "<h2>Data was successfully imported!</h2>"

  end
  
end