require 'spec_helper'
require_relative '../voApp'


def app
  Sinatra::Application
end

describe 'VOApp' do  
  it "should load the home page" do
    get '/'
    last_response.should be_ok
  end
  
  it "should have right content in home page" do
    get '/'
    last_response.body.should == 'Dummy Virtual Observatory'
  end
  
  # it 'should pass the test' do
 #    1.should == 1
 #  end
end