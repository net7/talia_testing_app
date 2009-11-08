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

  def auto_complete_for_record_short_uri
    if(s_uri = params[:record][:source])
      s_uri_parts = s_uri.split(':')
      options = { :limit => 10 }
      @records = if(s_uri.include?('://'))
        TaliaCore::ActiveSource.find_by_partial_uri(s_uri, options)
      elsif(s_uri_parts.size == 2)
        TaliaCore::ActiveSource.find_by_partial_local(s_uri_parts.first, s_uri_parts.last, options)
      else
        TaliaCore::ActiveSource.find_by_uri_token(s_uri, options)
      end

      render :inline => "<%= content_tag(:ul, @records.map { |rec| content_tag(:li, h(N::URI.new(rec.uri).to_name_s)) }) %>"
    else
      render :inline => ''
    end
  end

  
end
