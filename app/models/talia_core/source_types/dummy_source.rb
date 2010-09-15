module TaliaCore
  module SourceTypes
    class DummySource < Source
      # BY RIK
      # TODO: check what we should destroy and when
      def attach_files(files)
        files = [ files ] unless(files.is_a?(Array))
        files.each do |file|
          file.to_options!
          filename = file[:url]
          assit(filename)
          options = file[:options] || {}
          # BEGIN BY RIK
          talia_file = TaliaFile.new
          talia_file.assign_random_id
          talia_file[N::RDFS.label] << File.basename(filename)
          records = TaliaCore::DataTypes::FileRecord.create_from_url(filename, options)
          records.each do |rec|
            talia_file.data_records << rec
          end
          talia_file[N::TALIA.isFileOf] = self
          self[N::TALIA.hasFile] << talia_file
          # talia_file.save!
          # END BY RIK
        end
      end
    end
  end
end
