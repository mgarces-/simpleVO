class SimpleVO < Sinatra::Base
  get '/' do
    haml :vo
  end
  
  post '/search' do
    @hello = 'world'
    haml :vo
  end
    
end
