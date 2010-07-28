class Foobar
  include DataMapper::Resource
  
  property :id, Serial

  property :name, String

end

# Foobar.auto_migrate!		# Warning: Running this will clear the table!