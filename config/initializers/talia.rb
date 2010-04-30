require 'talia_core'

TLoad::setup_load_path

TaliaCore::Initializer.environment = ENV['RAILS_ENV']
TaliaCore::Initializer.run("talia_core")

TaliaCore::DataTypes::MimeMapping.add_mapping(:jpeg, TaliaCore::DataTypes::ImageData, :create_iip)
TaliaCore::DataTypes::MimeMapping.add_mapping(:tiff, TaliaCore::DataTypes::ImageData, :create_iip)

TaliaCore::SITE_NAME = TaliaCore::CONFIG['site_name'] || 'Discovery Source'