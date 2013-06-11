require 'sinatra'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'
require 'rest_client'

class VOApp < Sinatra::Base
  get '/' do
    slim :vo
  end
  
  get '/search' do
    votable = RestClient.get params[:url]
    
    content_type 'type/votable+xml'
    votable
  end
    
end