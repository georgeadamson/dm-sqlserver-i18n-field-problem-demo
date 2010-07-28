
  desc "Print all classes that include DataMapper::Resource."
  task :print_dm_resources => :merb_env do
    DataMapper::Resource.descendants.each do |resource|
      puts resource
    end
  end
