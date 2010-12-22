class Admin::OaiController < ApplicationController
  hobo_controller

  def index
    @klasses = TaliaCore::ActiveSource.types.map do |klass|
      klass if klass and klass.respond_to? :oai? and klass.oai?
    end.compact
  end

  def edit_default
    @all_fields = TaliaCore::Oai::SourceOaiFields.describe
    @all_predicates = TaliaCore::SemanticRelation.all_predicates
    @fields = TaliaCore::Oai::SourceOaiFields.for :'_all'
  end

  def update_default
    @record = TaliaCore::Oai::SourceOaiFields.find_by_klass '_all'
    params[:_all].each do |name, value|
      @record[name] = value
    end
    @record.save!
    redirect_to :action => 'edit_default'
  end

  def guess_default
    @all_fields = TaliaCore::Oai::SourceOaiFields.describe
    @all_predicates = TaliaCore::SemanticRelation.all_predicates
    @fields = TaliaCore::Oai::SourceOaiFields.guess_default_fields
    render :template => 'admin/oai/edit_default'
  end

  def edit 
    @all_fields = TaliaCore::Oai::SourceOaiFields.describe
    @klass = get_klass
    @all_predicates = @klass.all_predicates
    @fields = @klass.oai_fields
  end

  def update
    @klass = get_klass
    @record = TaliaCore::Oai::SourceOaiFields.find_by_klass @klass.to_s
    params[@klass.to_s].each do |name, value|
      @record[name] = value
    end
    @record.save!
    redirect_to "/admin/oai/edit?klass=#{@klass}"
  end

  def guess
    @klass = get_klass
    @all_fields = TaliaCore::Oai::SourceOaiFields.describe
    @all_predicates = @klass.all_predicates
    @fields = @klass.guess_oai_fields
    render :template => 'admin/oai/edit'
  end

  private

    def get_klass
      begin
        klass = eval(params[:klass])
        unless klass.oai?
          flash[:error] = "Class cannot be used for OAI"
          redirect_to '/admin/oai/index' and return
        end
      rescue
        flash[:error] = "Invalid class"
        redirect_to '/admin/oai/index' and return
      end
      klass
    end
end
