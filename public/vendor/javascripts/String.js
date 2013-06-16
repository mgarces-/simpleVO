String.prototype.htmlEntities = function () { 
  return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

String.prototype.isGlob = 
  function () {
    return this.match(/[\[*?]/) != null;
  };


String.prototype.unEscape = 
  function () {
    var i=0, n=this.length, res='', escape=false, s='' + this;

    while (i < n) {
      var c = s[i];
      i++;
      if (! escape && c == '\\') {
	escape = true;
	continue;
      }
      res += c;
      escape = false;
    }
    return res;
  };


String.prototype.escape = 
  function (blacklist) {
    var i=0, n=this.length, res='', escape=false, s=this+'';

    if (! blacklist) blacklist = "^$.*+?()|{}[]\\";
    while (i < n) {
      var c = s[i];
      i++;
      if (! escape && c == '\\') {
	escape = true;
	continue;
      }
      if (blacklist.indexOf(c) >= 0) res += "\\";
      res += c;
      escape = false;
    }
    return res;
  };


String.prototype.globToRegexp = 
  function () {
    var i=0, n=this.length, res='', escape = false, s='' + this;

    while (i < n) {
      var c = s[i];
      i++;
      if (! escape) {
	if (c == '\\') {
	  escape = true;
	  continue;
	}
	if (c == '*') res += '.*';
	else if (c == '?') res += '.';
	else if (c == '[') {
          var j=i;
          if (j < n && s[j] == '^') j++;
          if (j < n && s[j] == ']') j++;
          while (j < n && s[j] != ']') j++;
          if (j >= n) res += '\\[';
          else {
            var stuff=this.slice(i,j).replace('\\', '\\\\');
            i = j + 1;
            res += '[' + stuff + ']';
          }
	} else escape = true;
      }
      if (escape) {
	if (((c < 'A') || (c > 'Z')) && ((c < 'a') || (c > 'z')) && 
	    ((c < '0') || (c > '9'))) res += '\\';
	res += c;
	escape = false;
      }
    }
    return res;
  };


String.prototype.globToSQL = 
  function () {
    var i=0, n=this.length, res='', escape = false, s='' + this;

    while (i < n) {
      var c = s[i];
      i++;
      if (! escape) {
	if (c == '\\') {
	  escape = true;
	  continue;
	}
	if (c == '*') res += '%';
	else if (c == '?') res += '_';
	else if (c == '[') {
          var j=i;
          if (j < n && s[j] == '^') j++;
          if (j < n && s[j] == ']') j++;
          while (j < n && s[j] != ']') j++;
          if (j >= n) res += '[';
          else {
            var stuff=this.slice(i,j);
            i = j + 1;
            res += '[' + stuff + ']';
          }
	} else escape = true;
      }
      if (escape) {
	if (c == '_' || c == '%' || c == '[' || c == ']') res += '[' + c + ']';
	else if (c == "'") res += "''";
	else if (c >= 'A' && c <= 'Z') res += '[' + c + c.toLowerCase() + ']';
	else if (c >= 'a' && c <= 'z') res += '[' + c.toUpperCase() + c + ']';
	else res += c;
	escape = false;
      }
    }
    return res;
  };


String.prototype.retrace = 
  function (words) {
    var i, ls = words.length, l, p0 = 0, p1, res = [], s = this, t;
    
    for (i=0; i<ls; i++) {
      p1 = s.indexOf(words[i]);
      t = s.slice(0, p1);
      l = words[i].length;
      res.push([p0 + p1, p0 + p1 + l, words[i]]);
      p0 += p1 + l;
      s = s.slice(p1 + l);
    }
    return res;
  };

