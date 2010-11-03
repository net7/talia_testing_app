module TaliaCore
  module FakeAnnotations
    def populate_fake_annotations(n=10)
      return true unless @fake_annotations.nil?
      @fake_annotations = []
      (1..n).each do |i|
        annotation = {
          :uri        => "http://example.org/notes/#{i}",
          :metadata   => generate_metadata(i),
          :fragments  => generate_fragments(i),
          :statements => generate_statements(i)
        }
        @fake_annotations << annotation
      end
      true
    end

    def generate_resource(uri)
      index = uri.scan(/\d+$/)[0].to_i
      {
       :uri                  => "http://example.org/resources/#{index}",
       :types                => generate_resource_types(index),
       :format               => "[format #{index}????]",
       :location             => "[location????]",
       :label                => {:en => "Label #{index}", :it => "Etichetta #{index}"},
       :description          => {:en => "Description #{index}", :it => "Descrizione #{index}"},
       :knowledgeStatements  => generate_statements(index),
       :annotationStatements => generate_statements(index)
      }
    end

    def generate_resource_types(index)
      result = []
      (1..(index.modulo 5)).each do |j|
        temp = (index+j).modulo 10
        result << "http://example.org/types/#{temp}"
      end
      result
    end

    def generate_metadata(index)
      {
        :title   => {:en => "Title #{index}", :it => "titolo #{index}"},
        :comment => {:en => "Hello, I am comment nb #{index}", :it => "Ciao sono il commento numero #{index}"},
        :author  => {:uri => "http://example.org/authors/#{index}", :label => "Author#{index} Author#{index}son"},
      }
    end

    def generate_fragments(index)
      fragments = []
      (1..index).each do |j|
        fragments << generate_fragment(index, j)
      end
      fragments
    end
    
    def generate_fragment(index1, index2)
      {
        :uri                => "http://example.org/fragments/#{index1}#{index2}",
        :format             => generate_fragment_format(index1),
        :coordinates        => generate_fragment_coordinates(index1),
        :appears_in         => generate_fragment_associations(index1, index2),
        :is_part_of         => "http://example.org/resources/#{(index1+index2).to_s}"
      }
    end

    def generate_fragment_associations(index1, index2)
      associations = []
      (1..(index1+index2)).each do |k|
        associations << {:uri => "http://example.org/resources/#{(k.modulo index1+index2).to_s}"}
      end
      associations
    end

    def generate_fragment_format(index)
      formats = ['polygons', 'SVG', 'mediaTime', 'xpointer']
      formats[index.modulo formats.size]
    end
    
    def generate_fragment_coordinates(index)
      coordinates = [
                     "Image fragment coordinates #{index}",
                     "SVG coordinates #{index}",
                     "mediaTime coordinates #{index}",
                     "xpointer coordinates #{index}"
                    ]
      coordinates[index.modulo coordinates.size]
    end
    
    def generate_statements(index)
      statements = []
      (1..index*2).each do |j|
        statement = [
                     generate_statement_subject(index, j),
                     generate_statement_predicate(index, j),
                     generate_statement_object(index, j)
                    ]
        statements << statement
      end
      statements
    end

    def generate_statement_subject(index1, index2)
      subjects = [
                  {:uri => "http://example.org/resources/#{index1}#{index2}", :format => "uri"},
                  {:uri => "http://example.org/resources/#{index1}#{index2}", :format => "uri"},
                  {:uri => "http://example.org/resources/#{index1}#{index2}", :format => "uri"},
                  {:uri => "http://example.org/fragments/#{index2}#{index1}", :format => "imageFragment"},
                  {:uri => "http://example.org/fragments/#{index2}#{index1}", :format => "SVG"},
                  {:uri => "http://example.org/fragments/#{index2}#{index1}", :format => "mediaTime"}
      ]
      subjects[index2.modulo subjects.size]
    end
    
    def generate_statement_predicate(index1, index2)
      {:uri => "http://example.org/predicates/#{index1}#{index2}", :format => "uri"}
    end
    
    def generate_statement_object(index1, index2)
      objects = [
                 {:uri => nil, :format => "literal", :value => "literal #{index1}#{index2}"},
                 {:uri => "http://example.org/resources/#{(index1+index2).to_s}", :format => "uri"},
                 {:uri => "http://example.org/fragments/#{index2}#{index1}", :format => "imageFragment"},
                 {:uri => nil, :format => "literal", :value => "literal #{index1}#{index2}"},
                 {:uri => "http://example.org/fragments/#{index2}#{index1}", :format => "imageFragment"},
                 {:uri => nil, :format => "literal", :value => "literal #{index1}#{index2}"}
               ]
      objects[index2.modulo objects.size]
    end
  end
end
