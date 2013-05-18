Bundler.require(:default)

require 'rubygems'
require 'bundler'
require 'sass/plugin/rack'
require './simple_vo'

Sass::Plugin.options[:template_location] = 'public/stylesheets'
Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

use Rack::Coffee, root: 'public', urls: '/javascripts'

run SimpleVO
