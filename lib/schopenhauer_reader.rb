require 'guid'

class SchopenhauerReader < TaliaCore::ActiveSourceParts::Xml::GenericReader

  # Match the XML tags called "book", creating a new source for
  # each of them
  element :book do |book|
    # Match each "attribute" tag
    nested :attribute do
      # Read the predicate name(s) from "predicate" tag(s)
      predicate = from_element(:predicate)
      add predicate, all_elements(:value)
      add_rel predicate, all_elements(:object)
    end
  end

  element :index_element do
    @current.attributes["uri"] ||= Guid.new
    add 'type', BookIndexSection
    add 'number', from_element(:position)
    add 'title', from_element(:title)
    add 'starting_page', from_element(:start_page)
    add 'ending_page', from_element(:end_page)
    add_rel N::SCHOP.index_of, N::LOCAL + from_element(:book)
#    add 'book', from_element(:book)
  end

  element :page do
    add 'uri', from_element(:uri)
    add 'type', Page
    add 'name', from_element(:name)
    add 'position', from_element(:position)
    add_rel  N::DCT.isPartOf, N::LOCAL + from_element(:book)
#  add_rel  'dct:isPartOf, from_element(:book)
  end

  element :facsimile do
    # Use the content of the "file" tag as a URI/filename for loading a data
    # file
    @current.attributes["uri"] ||= Guid.new
    add 'type', Facsimile
    add_rel N::DCT.isFormatOf, N::LOCAL + from_element(:page)
#     add_rel :page , N::LOCAL + from_element(:page)

    add_file all_elements(:file)
  end
  
end
