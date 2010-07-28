# Go to http://wiki.merbivore.com/pages/init-rb
  
$KCODE    = 'u'    # Equivalent to the jruby -Ku switch. Does not seem to make a difference :(
#ENV['TZ'] = 'UTC' # This affects times in logs etc but does not fix DataMapper date field timezone problem.
  
require 'config/dependencies.rb'
 
use_orm :datamapper
use_test :rspec
use_template_engine :erb

# Ensure merb knows about our custom modules in the /lib folder:
Merb.push_path(:lib, Merb.root / 'lib', '**/*.rb')

# Tell merb about css mimetypes: (Necessary for the dynamically generated timeline_styles)
Merb.add_mime_type :css, :to_css, %w[text/css]	#, "Content-Encoding" => "gzip"		# gzip seems to break the output!



Merb::Config.use do |c|

  c[:use_mutex]      = false
  c[:session_store]  = 'datamapper'	# can also be 'cookie', 'memory', 'memcache', 'container', 'datamapper'
  c[:session_expiry] = 1209600			# Seconds: 1209600 = 2weeks

  # cookie session store configuration
  c[:session_secret_key] = '016283bfb73ac35d7c55b4bfedd3814864c035fd' # required for cookie session store
  c[:session_id_key]     = '_crm_session_id'									        # cookie session id key, defaults to "_session_id"
  c[:kernel_dependencies] = false
  
end

Merb::BootLoader.before_app_loads do
  # This will get executed after dependencies have been loaded but before your app's classes have loaded.
end

Merb::BootLoader.after_app_loads do
  # This will get executed after your app's classes have been loaded.
  #DataObjects::Mysql.logger = DataObjects::Logger.new('log/dm.log', 0)
  #DataObjects::Sqlite3.logger = DataObjects::Logger.new(Merb.log_file, 0) 
  DataObjects::Sqlserver.logger = DataObjects::Logger.new('log/sql.log', 0) 
end

Extlib::Inflection.plural_word 'status', 'statuses' # This does not seem to fix DataMapper "TripStatu" problem :(
