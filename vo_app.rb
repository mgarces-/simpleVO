require 'sinatra'
require 'slim'
require 'rest_client'
# require 'sinatra/flash'
# require 'sinatra/redirect_with_flash'



class VOApp < Sinatra::Base
    
  get '/' do
    slim :index
  end
  
  # Proxy to Sesame Web Service
  get '/proxySesame' do
    source_name = params.keys[0]
    
    content_type 'content/xml'
    RestClient.get settings.sesame_endpoint+source_name
  end
  
  # Proxy to VO Archive Web Service
  get '/search' do
    query_string = params.to_a.map{|x| "#{x[0]}=#{x[1]}"}.join("&")
    
    content_type 'type/votable+xml'
    RestClient.get settings.alma_endpoint+query_string
  end
end



