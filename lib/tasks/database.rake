namespace :db do
 
  # USAGE: jruby -X-C -S rake db:bootstrap
 
  desc 'Bootstrap the database with default data'
  task :bootstrap => ['db:automigrate'] do
  #  begin
  #    gem 'fastercsv', '~>1.4.0'
  #    require 'fastercsv'
  #  rescue LoadError
  #    puts 'Please install the FasterCSV gem to use db:bootstrap'
  #    exit
  #  end
  #
  #  default_data_dir = File.expand_path(File.join(File.dirname(__FILE__), '..', '..', 'db', 'default'))
  #
  #  FasterCSV.foreach(default_data_dir + '/operating_systems.csv') do |row|
  #    os_name = row[0]
  #    os_vendor = row[1]
  #    Locomotive::OperatingSystem.create(:name => os_name, :vendor_name => os_vendor)
  #  end
  #
  #  FasterCSV.foreach(default_data_dir + '/roles.csv') do |row|
  #    name = row[0]
  #    Locomotive::Role.create(:name => name)
  #  end
  #
  #  Locomotive::User.create(:login => 'admin',
  #              :email => 'admin@admin.me',
  #              :password => 'nedap',
  #              :password_confirmation => 'nedap')

	require 'csv'
	@folderPath = File.expand_path( File.join( File.dirname(__FILE__), "..", "db-seed-data" ) )

	# Helper for importing simple tables consisting of only id and name (and optional orderBy) columns:
	def importSimpleLookupTable(model, filename=nil)

		filename = model.name + ".csv" if filename.nil?
		hasOrderColumn = model.new.respond_to?("order_by")
		print " Importing:", filename

		CSV.open(@folderPath / filename, "r").each do |row|
			newRow = {}
			if row.length > 1
				newRow[:id] = row[0]
				newRow[:name] = row[1]
				newRow[:order_by] = row[2] if row.length > 2 && hasOrderColumn
			else
				newRow[:name] = row[0]
			end
			model.create(newRow)
		end
  
	end


	importSimpleLookupTable( Photo )
	importSimpleLookupTable( MailingZone )
	importSimpleLookupTable( WorldRegion )
	importSimpleLookupTable( TripState )
	importSimpleLookupTable( TripType )
	importSimpleLookupTable( TripElementMiscType )
	importSimpleLookupTable( ClientType )
	importSimpleLookupTable( ClientSource )
	importSimpleLookupTable( ClientMarketing )



	print " Importing:", "Country"  # COUNTRYID,COUNTRYNAME,Inclusions,Exclusions,CountryNotes,WorldRegionID,ConsultantID
	CSV.open(@folderPath / "country.csv", "r").each do |row|	

		country = Country.new(
			:id => row[0],
			:name => row[1],
			:world_region_id => row[2]
		)
		if country.name == "United Kingdom"
		    country.code = "UK"
			country.mailing_zone_id = 1	# UK
		end
		country.save
	end


	print " Importing:", "CountryCode" 	# Lookup 2-letter code for each Country: COUNTRYCODE,CountryName
	CSV.open(@folderPath / "CountryCode.csv", "r").each do |row|	
		country = Country.first( :name => row[1] )
		if country
		    country.code = row[0]
		    country.save
		end
	end


	print " Importing:", "Airport"	# AirportID,AirportName,bUK,CompanyID,AirportCode,AirportTax
	CSV.open(@folderPath / "Airport.csv", "r").each do |row|	
		airport = Airport.create(
		    :id => row[0],
		    :name => row[1],
			:country => row[2]=="1" ? Country.first(:code=>"UK") : nil,
		    :company_id => row[3],
		    :code => row[4],
		    :tax => row[5]
		)
	end


	print " Importing:", "TripElementType"
	CSV.open(@folderPath / "TripElementType.csv", "r").each do |row|	
		elementType = TripElementType.create(
		    :id => row[0],
		    :name => row[1],
		    :code => row[2],
		    :supplierTypeName => row[3],
		    :isLinkedSupplier => row[4],
		    :orderBy => row[5]
		)
	end
	
	
	print " Importing:", "Company"  # COMPANYID,COMPANYNAME,CompanyName,OCMem,InvoicePrefix,LogoImage,ImagesFolder,DueDays,ccsup,FileBookingFee,BrochureFollowupDays,DefaultTripDeposit,IsActive,BaseCountryName,DefaultCurrency,DefaultCurrencySymbol
	CSV.open(@folderPath / "company.csv", "r").each do |row|	

		company = Company.create(
			:id => row[0],
			:name => row[1],
			:shortName => row[2],
			:initials => row[3],
			:invoicePrefix => row[4],
			:logoUrl => row[5],
			:imagesFolder => row[6],
			:dueDays => row[7],
			:ccSup => row[8],
			:bookingFee => row[9],
			:brochureFollowupDays => row[10],
			:defaultDeposit => row[11],
			:isActive => row[12],
		    :country => Country.first(:code=>"UK") || Country.first || nil
		)
	end


	print " Importing:", "User"
	CSV.open(@folderPath / "User.csv", "r").each do |row|	
		User.create(
			:forename => row[0],
			:name => row[1],
			:login => row[2],
			:email => row[3],
			:password => row[4],
			:password_confirmation => row[5]
		)
	end


	print " Importing:", "Supplier"
	CSV.open(@folderPath / "Supplier.csv", "r").each do |row|	
		Supplier.create(
			:id => row[0],
			:name => row[1],
			:type => TripElementType.get( row[2] )
		)
	end

 
 
	print " Importing:", "Client"	# ClientID,ContactID,Title,Forename,Surname,Salutation,Addressee,FullName,AddressLine1,AddressLine2,AddressLine3,AddressLine4,AddressLine5,AddressLine6,Postcode,HomeTelephone,WorkTelephone,HomeFax,WorkFax,Mobile,EMail,OnlineAccountUid,OnlineAccountPwd,IsOnlineAccountEnabled,MailingZoneID,SourceID,ClientTypeID,TopicOfInterestID,PrimaryAreaOfInterestRef,LeadClass,CompanyID,AdditionalMarketing,NoEmailMarketing,HasTravelled,DateOfEntry,InputBy,WebSourceReferrer,WebSourceSearchEngine,WebSourceKeywords,WebSourcePaidLink,LastModification,LastModificationOn
	
	Client.create( :id=>1, :title => "Mr", :forename => "George", :name => "Adamson", :salutation => "Mr Adamson", :addressee => "Mr G Adamson", :known_as => "George", :address1 => "Nice House", :address2 => "Somewhere", :address3 => "Posh", :address4 => "Nice village", :address5 => "In the country", :postcode => "GL1 234" )
	Client.create( :id=>2, :address_client_id => 1, :title => "Mrs", :forename => "Kate", :name => "Adamson", :salutation => "Mrs Adamson", :addressee => "Mrs K Adamson", :known_as => "Kate", :address1 => "Nice House", :address2 => "Somewhere", :address3 => "Posh", :address4 => "Nice village", :address5 => "In the country", :postcode => "GL1 234" )
  	Client.create( :id=>3, :title => "Mr", :forename => "John", :name => "Smith", :salutation => "Mr Smith", :addressee => "Mr J Smith", :known_as => "Johnny", :address1 => "Little Cottage", :address2 => "Somewhere", :address3 => "Posh", :address4 => "Nice village", :address5 => "In the country", :postcode => "GL2 345" )
	
	CSV.open(@folderPath / "Client.csv", "r").each do |row|	
		Client.create(
			:id 		=> row[0],
			:title 		=> row[2],
			:forename 	=> row[3],
			:name 		=> row[4],
			:salutation => row[5],
			:addressee	=> row[6],
			:known_as 	=> row[3],
			:address1	=> row[8],
			:address2	=> row[9],
			:address3	=> row[10],
			:address4	=> row[11],
			:address5	=> row[12],
			#:country	=> row[13],
			:postcode	=> row[14],
			:tel_home	=> row[15],
			:tel_work	=> row[16],
			:tel_mobile1	=> row[19],
			:email1		=> row[20]
		)
	end  
  
	print " Importing:", "Trip"
	trip = Trip.new(
		:name => "Test tripA"
	)
	#trip.countries << Country.get(1)
	#trip.countries << Country.create( :id=>1000, :name=>"test" )
	#trip.countries.new( :id=>1000, :name=>"test" )
	trip.save 
  
	tripB = Trip.create( :name => "Test tripB" )
	Trip.create( :name => "Test tripB(v2)", :version_of_trip => tripB )
	Trip.create( :name => "Test tripB(v3)", :version_of_trip => tripB )
 
  
	print " Importing:", "TripClient"
	tripClient = TripClient.create( :trip => Trip.get(1), :client => Client.get(1) )
	tripClient = TripClient.create( :trip => Trip.get(1), :client => Client.get(2) )
	tripClient = TripClient.create( :trip => Trip.get(1), :client => Client.get(3) )
	tripClient = TripClient.create( :trip => Trip.get(2), :client => Client.get(1) )
	tripClient = TripClient.create( :trip => Trip.get(3), :client => Client.get(1) )
	tripClient = TripClient.create( :trip => Trip.get(4), :client => Client.get(1) )
  
  
	print " Importing:", "TripElement"
	tripElement = TripElement.new(
		:name => "Test trip1",
		:id => 1
	)
	tripElement.save
	
	
	print " Assigning photos to countries"
	#photo = Photo.first.countries << Country.first
	#photo.save
  
  
  
	print " Importing:", "UserClient"	# Clients recently-worked-on by a User
	userClient = UserClient.create(
		:user => User.get(1),
		:client => Client.get(1),
		:isOpen => true,
		:isSelected => true
	)
	
	
	
	print " All done "
  
  end
 
  desc 'Populate the database with example data'
  task :populate => ['db:bootstrap']
 
end