require 'rubygems'

require 'dm-core'
require 'dm-migrations'
$KCODE = 'u'
DataMapper.setup(:default, 'sqlite:test')

class A
  include DataMapper::Resource
  
  property :id, Serial
  
  property :name, String
  
end
A.auto_migrate!
p A.create(:name=> "Américas")