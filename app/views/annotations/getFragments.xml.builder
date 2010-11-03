xml.instruct!
xml.result {
  xml.limit @result[:limit]
  xml.start @result[:start]
  xml.total @result[:total]
  xml.fragments {
    requested = @result[:requested]
    xml.requestedURI(requested[:uri], :location => requested[:location], :resourceFormat => requested[:format])
    @result[:fragments].each do |fragment|
      xml.uri(fragment[:uri], :resourceFormat => fragment[:format])
    end
  }
}