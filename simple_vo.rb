class SimpleVO < Sinatra::Base
  get '/' do
    slim :vo
  end
  
  # get '/search' do
  #   content_type :json 
  #   {:xmlpath=>'example_input.xml',:xml=>}.to_json
  # end
    
end
