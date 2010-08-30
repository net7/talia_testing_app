require 'guid'

class SchopenhauerReader < TaliaCore::ActiveSourceParts::Xml::GenericReader

  # Match the XML tags called "book", creating a new source for
  # each of them
  element :book do |book|
    # Match each "attribute" tag
    nested :attribute do
      # Read the predicate name(s) from "predicate" tag(s)
      predicate = from_element(:predicate)
      add predicate, from_element(:value)
    end
  end

  element :index_element do
    @current.attributes["uri"] ||= Guid.new
    add 'type', TaliaCore::BookIndexSection
    add 'index_section_number', from_element(:position)
    add 'index_section_title', from_element(:title)
    add 'index_section_starting_page', from_element(:start_page)
    add 'index_section_ending_page', from_element(:end_page)
    add_rel N::SCHOP.index_of, N::LOCAL + from_element(:book)
  end

  element :page do
    add 'uri', from_element(:uri)
    add 'type', TaliaCore::Page
    add 'name', from_element(:name)
    add 'position', from_element(:position)
    add_rel  N::DCT.isPartOf, N::LOCAL + from_element(:book)
  end

  element :facsimile do
    # Use the content of the "file" tag as a URI/filename for loading a data
    # file
    @current.attributes["uri"] ||= Guid.new
    add 'type', TaliaCore::Facsimile
    add_rel N::DCT.isFormatOf, N::LOCAL + from_element(:page)
    add_file all_elements(:file)
  end
  
end