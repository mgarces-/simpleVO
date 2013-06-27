require 'sinatra'
require 'slim'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'
require 'rest_client'

class VOApp < Sinatra::Base
    
  get '/' do
    slim :index
  end
  
  # Proxy to Sesame Web Service
  get '/proxySesame' do
    requested_catalog = RestClient.get "http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/SNV?"+params.keys[0]
    
    content_type 'content/xml'
    requested_catalog
  end
  
  # Proxy to VO Archive Web Service
  get '/search' do
    votable = RestClient.get "https://almascience.nrao.edu/aq/search\?source_name_sesame\=m87\&radius\=0:10:00\&scan_intent-asu\=\=\*TARGET\*\&viewFormat\=asdm\&download\=true"
    
    content_type 'type/votable+xml'
    votable
  end
  
  
  
end