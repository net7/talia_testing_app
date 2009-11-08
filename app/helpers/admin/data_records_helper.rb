module Admin::DataRecordsHelper

  def source_form_column(record, input_name)
    # collection_select(:record, :source_id, TaliaCore::ActiveSource.all, :id, :uri, { :object => record }, { :name => input_name})
    record.reload unless(record.source)
    text_field_with_auto_complete :record, :short_uri, :name => input_name, :class => 'type-input text-input', :object => record.source
  end

end
