function ParseResult(){
  this.values = {};
  this.raw = '';
  this.hasBinding = false;
  this.includesNonBindings = false;
}

ParseResult.prototype.getValue = function(scope){
  var prop = this.props()[0];
  return scope.read(prop).value;
}

ParseResult.prototype.getStringValue = function(scope){
  var asc = Object.keys(this.values).sort(function(a, b) {
    return +a > +b ? 1 : -1;
  })
  var out = this.raw;
  var i, value;
  while(asc.length) {
    i = asc.pop();
    value = scope.read(this.values[i]).value;
    if(value != null) {
      out = out.substr(0, i) + value + out.substr(i);
    }
  }
  return out;
};
import { values as collectValues } from './util.js';

ParseResult.prototype.compute = function(model){
  var useString = this.includesNonBindings || this.count() > 1;
  return useString
    ? this.getStringValue.bind(this, model)
    : this.getValue.bind(this, model);
};

ParseResult.prototype.props = function(){
  return collectValues(this.values);
};

ParseResult.prototype.count = function(){
  return this.hasBinding === false ? 0 : Object.keys(this.values).length;
};

ParseResult.prototype.throwIfMultiple = function(msg){
  if(this.count() > 1) {
    msg = msg || 'Only a single binding is allowed in this context.';
    throw new Error(msg);
  }
};

function parse(str){
  var i = 0,
    len = str.length,
    result = new ParseResult(),
    inBinding = false,
    lastChar = '',
    pos = 0,
    char;

  while(i < len) {
    lastChar = char;
    char = str[i];

    if(!inBinding) {
      if(char === '{') {
        if(lastChar === '{') {
          result.hasBinding = true;
          pos = result.raw.length;
          if(result.values[pos] != null) {
            pos++;
          }
          result.values[pos] = '';
          inBinding = true;
        }

        i++;
        continue;
      } else if(lastChar === '{') {
        result.raw += lastChar;
      }
      result.raw += char;
    } else {
      if(char === '}') {
        if(lastChar === '}') {
          inBinding = false;
        }
        i++;
        continue;
      }
      result.values[pos] += char;
    }

    i++;
  }

  result.includesNonBindings = result.raw.length > 0;
  return result;
}

export default parse;
