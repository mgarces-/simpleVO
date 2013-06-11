require 'spec_helper'
require_relative '../voApp'


def app
  Sinatra::Application
end

describe 'VOApp' do  
  it "should load the home page" do
    get '/'
    last_response.should be_ok
  end
end