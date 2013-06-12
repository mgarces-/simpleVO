require 'spec_helper'
require_relative '../vo_app'

describe 'VO Application' do	
  def app
   VOApp 
  end
    
	it "should load the home page" do
	  get '/' 
	  last_response.should be_ok
	end  
end
