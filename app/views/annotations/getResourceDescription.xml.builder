xml.instruct!
xml.result {
  xml.description {
    xml.uri @result[:uri]
    @result[:types].each {|type| xml.type type}
    @result[:label].each {|lang, value| xml.label value, :lang => lang}
    @result[:description].each {|lang, value| xml.description value, :lang => lang}
    xml.statements {
      @result[:knowledgeStatements].each do |statement|
        xml.knowledgeStatement {
          xml.subject statement[0][:uri] || statement[0][:value], :format => statement[0][:format]
          xml.object  statement[1][:uri], :format => statement[1][:format]
          xml.object  statement[2][:uri] || statement[2][:value], :format => statement[2][:format]
        }
      end
      @result[:annotationStatements].each do |statement|
        xml.annotationStatement {
          xml.subject statement[0][:uri] || statement[0][:value], :format => statement[0][:format]
          xml.object  statement[1][:uri], :format => statement[1][:format]
          xml.object  statement[2][:uri] || statement[2][:value], :format => statement[2][:format]
        }
      end
    }
  }
}
