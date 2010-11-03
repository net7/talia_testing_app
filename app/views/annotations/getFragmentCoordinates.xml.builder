xml.instruct!
xml.result {
  xml.fragments {
    xml.requestedURI(@result[:uri], :resourceFormat => @result[:format])
    xml.fragmentCoordinates(@result[:coordinates])
  }
}
