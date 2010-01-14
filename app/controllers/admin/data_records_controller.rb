class Admin::DataRecordsController < ApplicationController
  require_role 'admin'
  layout 'admin'

  def self.active_scaffold_controller_for(klass)
    return Admin::SourcesController if(klass == TaliaCore::ActiveSource)
    super
  end

  active_scaffold 'TaliaCore::DataTypes::DataRecord'

  def update
    exists = false
    if(source = params[:record][:source])
      if(TaliaCore::ActiveSource.exists?(source))
        exists = true
      else
        source = N::URI.make_uri(source).to_s rescue nil
        if(TaliaCore::ActiveSource.exists?(source))
          exists = true
        else
          source = N::LOCAL + source
          exists = TaliaCore::ActiveSource.exists?(source)
        end
      end
    end
    source = nil unless(exists)
    # raise(ActiveRecord::RecordInvalid, 'Illegal source given') unless(exists)
    params[:record][:source] = source
    super
  end

  
end
