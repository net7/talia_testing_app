class Work < Book
  hobo_model # Don't put anything above this

  singular_property :archive_number, N::SCHOP.archive_number
  multi_property :hubscher_catalog, N::SCHOP.hubscher_catalog
  multi_property :authors, N::SCHOP.has_author, :type => TaliaCore::ActiveSource
  singular_property :name, N::SCHOP.title
  singular_property :publisher, N::SCHOP.publisher
  singular_property :publishing_date, N::SCHOP.publishing_date

end
