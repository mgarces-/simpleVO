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
    ws_url = "http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/SNV?"
    source_name = params.keys[0]
    
    content_type 'content/xml'
    RestClient.get ws_url+source_name
  end
  
  # Proxy to VO Archive Web Service
  get '/search' do
    
    ws_url = "https://almascience.nrao.edu/aq/search?"
    query_string = params.to_a.map{|x| "#{x[0]}=#{x[1]}"}.join("&")
    
    content_type 'type/votable+xml'
    RestClient.get ws_url+query_string
  end
end



