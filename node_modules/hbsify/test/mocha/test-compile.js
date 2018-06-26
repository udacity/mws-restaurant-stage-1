var chai = require('chai');
var expect = chai.expect;
var $ = require('../../node_modules/jquery/dist/jquery');

describe('hbsify', function() {
  before(function() {
    this.template = require('./test-template.hbs');
  });

  it('should be a function', function() {
    var hbsify = require('../../index.js');
    expect(typeof hbsify).to.eql('function');
  });

  it('should create a template function', function() {
    expect(typeof this.template).to.eql('function');
  });

  it('should be okay when called with an object', function() {
    expect(this.template({})).to.be.ok;
  });

  it('should render when after being browserified', function(done) {
    var rendered = this.template({test: 'hello test'});
    expect(rendered).to.eql('<h1>hello test</h1>\n'); 
    done();
  });
});
