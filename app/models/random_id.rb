module RandomId
  
  # Creates a random id string
  def self.random_id
    rand Time.now.to_i
  end
  
  def random_id
    RandomId.random_id
  end
  
end