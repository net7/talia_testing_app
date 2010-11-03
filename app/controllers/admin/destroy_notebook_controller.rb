class Admin::DestroyNotebookController < ApplicationController

  hobo_controller

  def index
  end

  def perform_destroy
    if !current_user.administrator?
      redirect_to user_login_path
    end
    Swicky::Notebook.find_all.each{|notebook| notebook.delete}
  end
  
end