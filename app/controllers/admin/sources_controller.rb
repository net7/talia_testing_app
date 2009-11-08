class Admin::SourcesController < ApplicationController
  require_role 'admin'
  layout 'admin'

  def self.active_scaffold_controller_for(klass)
    return Admin::DataRecordsController if(klass == TaliaCore::DataTypes::DataRecord)
    super
  end

  active_scaffold 'TaliaCore::ActiveSource' do |config|
    config.columns = [:uri, :type, :data_records]
  end

end
