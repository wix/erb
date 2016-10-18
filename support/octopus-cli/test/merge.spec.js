'use strict';
const expect = require('chai').expect,
  maybeMerge = require('../lib/merge');

describe('merge', () => {

  it('should update to value from source object', () => {
    const dest = {foo: 'bar'};
    const source = {foo: 'baz'};

    expect(maybeMerge(dest, source)).to.deep.equal({foo: 'baz'});
  });

  it('should not add elements with keys in source that do not exist in dest', () => {
    const dest = {foo: 'bar'};
    const source = {fuz: 'baz'};

    expect(maybeMerge(dest, source)).to.deep.equal({foo: 'bar'});
  });

  it('should deep update to value from source object', () => {
    const dest = {foo: {foo: 'bar'}};
    const source = {foo: {foo: 'baz'}};

    expect(maybeMerge(dest, source)).to.deep.equal({foo: {foo: 'baz'}});
  });

  it('should deep update multiple values from source object', () => {
    const dest = {foo: {foo: 'bar', another: 1}};
    const source = {foo: {foo: 'baz', another: 2}};

    expect(maybeMerge(dest, source)).to.deep.equal({foo: {foo: 'baz', another: 2}});
  });

  it.skip('should merge arrays', () => {

  });
});