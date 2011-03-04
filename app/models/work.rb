class Work < Book
  hobo_model # Don't put anything above this

  include StandardPermissions
  has_rdf_type N::SCHOP.Work

  after_create :set_title_from_name
  

  singular_property :ub_frankfurt_archive_number, N::SCHOP.ub_frankfurt_archive_number
  multi_property :hubscher_catalog_number, N::SCHOP.hubscher_catalog_number
  multi_property :author, N::SCHOP.has_author, :type => TaliaCore::ActiveSource
  singular_property :name, N::SCHOP.title
  singular_property :subtitle, N::SCHOP.subtitle
  singular_property :edition_number, N::SCHOP.edition_number
  singular_property :volume, N::SCHOP.volume
  singular_property :series_or_journal, N::SCHOP.series_or_journal
  singular_property :editor, N::SCHOP.editor
  singular_property :publisher, N::SCHOP.publisher
  singular_property :publishing_place, N::SCHOP.publishing_place
  singular_property :publishing_date, N::SCHOP.publishing_date
  singular_property :pp, N::SCHOP.pp
  singular_property :dimensions, N::SCHOP.size
  singular_property :external_link, N::SCHOP.external_link

  private

  def set_title_from_name
    self.title = self.name
  end

end
