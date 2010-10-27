class Book < TaliaCore::Collection

    def pages
    pages = []
    self.elements.each do |page|
      pages << page.becomes(Page)
    end
    pages
  end

end