require 'talia_core'

TLoad::setup_load_path

TaliaCore::Initializer.environment = ENV['RAILS_ENV']
TaliaCore::Initializer.run("talia_core")

TaliaCore::DataTypes::MimeMapping.add_mapping(:jpeg, TaliaCore::DataTypes::ImageData, :create_iip)
TaliaCore::DataTypes::MimeMapping.add_mapping(:tiff, TaliaCore::DataTypes::ImageData, :create_iip)

TaliaCore::SITE_NAME = TaliaCore::CONFIG['site_name'] || 'Discovery Source'

begin
  require 'oai'
rescue LoadError
  puts "ERROR: You have enabled the Talia OAI interface, but the OAI library was not found."
  puts "Please do 'gem install oai_talia' to fix this. (Gem is hosted on gemcutter.org)"
  puts 
  raise
end

class TaliaOaiProvider < OAI::Provider::Base
  repository_name TaliaCore::CONFIG['oai']['repository_name']
  repository_url N::LOCAL.oai.to_s
  record_prefix TaliaCore::CONFIG['oai']['prefix']
  admin_email TaliaCore::CONFIG['admin_email']
  source_model TaliaCore::Oai::ActiveSourceModel.new
end
