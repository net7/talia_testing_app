xml.instruct!

xml.urlset(:xmlns => 'http://www.sitemaps.org/schemas/sitemap/0.9', 'xmlns:sc' => 'http://sw.deri.org/2007/07/sitemapextension/scschema.xsd') do
#  @ontologies.each do |ontology|
#    xml.sc :dataset do
#      xml.sc :datasetLabel, ontology.titleize
#      xml.sc :datasetURI, url_for(:action => 'show', :id => ontology, :only_path => false)
#    end
#  end
  # demo hack TODO: remove this!
  xml.sc :dataset do
    xml.sc :datasetLabel, "Islamic Art - Annotation Ontology"
    xml.sc :datasetURI, "http://dbin.org/swickynotes/murucaska/islamic_art_ontology.owl"
  end

end