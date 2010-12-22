class CreateSourceOaiFields < ActiveRecord::Migration
  def self.up
    create_table :source_oai_fields do |t|
      t.timestamps
      t.string :klass, :null => false
      t.string :title
      t.string :creator
      t.string :subject
      t.string :description
      t.string :date
      t.string :type
      t.string :identifier
    end
    
    add_index :source_oai_fields, :klass, :unique => true
  end

  def self.down
    drop_table :source_oai_fields
  end
end
