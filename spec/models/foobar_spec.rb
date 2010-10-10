# encoding: utf-8

require File.join( File.dirname(__FILE__), '..', "spec_helper" )

# To run this: jruby -X-C -S rake spec SPEC=spec/models/foobar_spec.rb


describe Foobar do

  before :each do
    @foobar = Foobar.new(valid_foobar_attributes)
  end

  it "should be valid" do
    @foobar.should be_valid
  end

  it "should set and get fields with foreign language characters" do
    @foobar = Foobar.new( valid_foobar_attributes )
    @foobar.save.should be_true
    @foobar.reload
    @foobar.name.should == valid_foobar_attributes[:name]  # This line fails
  end

end



def valid_foobar_attributes
  {
    :name => 'Américas'
  }
end