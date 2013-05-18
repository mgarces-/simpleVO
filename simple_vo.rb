class SimpleVO < Sinatra::Base
  get '/' do
    slim :vo
  end
  
  post '/search' do
    # query over Several VO's (TAP)
    
    slim :vo
  end
    
end
