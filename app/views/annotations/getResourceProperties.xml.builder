xml.instruct!
xml.result {
  xml.properties {
    requested = @result[:requested]
    xml.requestedURI(requested[:uri], :resourceFormat => requested[:format], :location => requested[:location])
    @result[:properties].each do |property|
      xml.values (:name => property[:name]) {
        if property.is_a? String
          xml.value property[:values]
        elsif property[:values].is_a? Hash
          property[:values].each {|lang, value| xml.value value, :lang => lang}
        elsif property[:values].is_a? Array
          property[:values].each {|value| xml.value value}
        end
      }
    end
  }
}
