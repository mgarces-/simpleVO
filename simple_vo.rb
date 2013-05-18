class SimpleVO < Sinatra::Base
  get '/' do
    haml :vo
  end  
end
