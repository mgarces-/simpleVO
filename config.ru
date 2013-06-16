require 'rubygems'
require 'bundler'

Bundler.require(:default, ENV['RACK_ENV'].to_s)

require 'sass/plugin/rack'
require './vo_app'

Sass::Plugin.options[:template_location] = '/assets/stylesheets'
Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

use Rack::Coffee, {
  :root => File.dirname(__FILE__) + '/assets',
  :urls => '/javascripts',
  :output_path => '/public/javascripts/'
}

run VOApp
