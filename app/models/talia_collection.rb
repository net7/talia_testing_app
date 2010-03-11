class TaliaCollection < ActiveRecord::Base
  hobo_model # Don't put anything above this
  
  self.inheritance_column = 'foo'
  
  fields do
    uri :string
  end
  
  declare_attr_type :name, :string
  attr_writer :real_collection
  
  set_table_name "active_sources"
  
  def name=(name)
    self.uri = (N::LOCAL + name).to_s
  end
  
  def name
    self.uri.nil? ? nil : self.uri.to_uri.local_name
  end
  
  def create_permitted?
    acting_user.administrator?
  end
  
  def update_permitted?
    acting_user.administrator?
  end
  
  def view_permitted?(field)
    true
  end
  
  def self.new(*args)
    new_thing = super(*args)
    new_thing[:type] = "TaliaCore::Collection"
    new_thing
  end
  
  def self.find(*args)
    puts args.inspect
    result = TaliaCore::Collection.find(*args)
    if(result.is_a?(Array))
      result.collect { |s| from_real_collection(s) }
    else
      from_real_collection(result)
    end
  end
  
  def self.count(*args)
    TaliaCore::Collection.count(*args)
  end
  
  def to_uri
    self.uri.to_uri
  end
  
  
  def real_collection
    @real_collection ||= TaliaCore::Collection.new(self.uri)
  end
  
  private
  
  def self.from_real_collection(real_collection)
    collection = TaliaCollection.send(:instantiate, real_collection.attributes)
    collection.real_collection = real_collection
    collection
  end
  
end