class FileWorker < Workling::Base

  def attach_file(options)
    logger.debug("\033[35m\033[4m\033[1mFileWorker\033[0m Begin to process #{options.inspect}")
    source = TaliaSource.find(options[:source_uri])
    mime_type = options.delete(:mime_type)
    location = options.delete(:location)
    source.attach_files(:url => options[:file], :options => { :mime_type => mime_type, :location => location })
    source.save!
    logger.info("\033[35m\033[4m\033[1mFileWorker\033[0m Successfully attached file (#{options.inspect})")
  rescue Exception => e
    logger.error("\033[35m\033[4m\033[1mFileeWorker\033[0m Could not attach the file with #{options.inspect}: #{e.message}")
    e.backtrace.each { |msg| logger.debug msg }
    source.save!
  end

  def web_import(options)
    logger.debug("\033[35m\033[4m\033[1mFileWorker\033[0m Begin to process import file #{options[:file_name]}")
    puts options.inspect
    ENV['xml'] = options[:file_name]
    importer = TaliaUtil::ImportJobHelper.new(logger, TaliaUtil::BarProgressor)
    importer.do_import
    logger.info("\033[35m\033[4m\033[1mFileWorker\033[0m Successfully attached file (#{options[:file_name]})")
  rescue Exception => e
    logger.error("\033[35m\033[4m\033[1mFileeWorker\033[0m Could not attach the file with #{options[:file_name]}: #{e.message}")
    e.backtrace.each { |msg| logger.debug msg }
  end

end