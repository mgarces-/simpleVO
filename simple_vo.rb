require 'rest_client'

class SimpleVO < Sinatra::Base
  get '/' do
    slim :vo
  end
  
  get '/search' do
    votable = RestClient.get params[:url]
    
    content_type 'text/xml'
    votable
  end
    
end
