require 'rest_client'

class SimpleVO < Sinatra::Base
  get '/' do
    slim :vo
  end
  
  get '/search' do
    votable = RestClient.get 'https://almascience.nrao.edu/aq/search?source_name_sesame=m87&radius=0:10:00&scan_intent-asu==*TARGET*&viewFormat=asdm&download=true'
    content_type 'text/xml'
    votable
  end
    
end
