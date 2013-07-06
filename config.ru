require 'rubygems'
require 'bundler'

Bundler.require(:default, ENV['RACK_ENV'].to_s)

require 'sass/plugin/rack'
require './vo_app'

Sass::Plugin.options[:template_location] = '/assets/stylesheets'
Sass::Plugin.options[:css_location] = "public/stylesheets"
Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

use Rack::Coffee, {
  :root => File.dirname(__FILE__) + '/assets',
  :urls => '/javascripts',
  :output_path => '/public/javascripts/'
}

configure :development, :test do
  VOApp.set :alma_endpoint   => 'https://almascience.nrao.edu/aq/search?',
            :sesame_endpoint => 'http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/SNV?'
end

run VOApp
