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
  
  it "should recieve a VOTable" do
    get '/search?source_name_sesame=m87&radius=0:10:00&scan_intent-asu==*TARGET*&viewFormat=asdm&download=true'
    last_response.header['Content-Type'].should include 'type/votable+xml'
  end

  
end
