/**
 * Finds all indexes in an array that are equal to a tring or match a
 * regular expression.
 * 
 * @param searchStr  Search string or regular expression
 * @return The matched indexes as an array or false if no index matches
 */
Array.prototype.find = function(searchStr) { 
  var returnArray = [], i, l = this.length;
  if (typeof(searchStr) == "object") { 
    for (i=0; i<l; i++)  
      if (searchStr.test(this[i])) returnArray.push(i); 
  } else {
    for (i=0; i<l; i++)  
      if (this[i] == searchStr) returnArray.push(i);
  }
  if (returnArray.length == 0) return null;
  else return returnArray; 
};

/**
 * Finds all indexes in an array that are equal to a string or match a
 * regular expression.
 * 
 * @param searchStr  Search string or regular expression
 * @return The first matched index or -1 if no index matches
 */
Array.prototype.findFirst = function(searchStr) { 
  var i, l = this.length;
  if (typeof(searchStr) == "object") { 
    for (i=0; i<l; i++)  
      if (searchStr.test(this[i])) return i; 
  } else {
    for (i=0; i<l; i++)  
      if (this[i] == searchStr) return i;
  }
  return -1;
};

/**
 * Finds all indexes in an array whose beginning is identical to a string.
 * 
 * @param searchStr  Search string 
 * @return The first matched index or -1 if no index matches
 */
Array.prototype.findFirstPartial = function(searchStr) { 
  var i, l = this.length, s = searchStr.length;
  for (i=0; i<l; i++)  
    if (this[i].slice(0, s) == searchStr) return i;
  return -1;
};

/**
 * Compare two arrays.
 *
 * @param  testArr The reference array to compare with.
 * @return A boolean value (true or false) depending on the result of the
 *         comparison.
 */
Array.prototype.compare = function(testArr) {
  if (this.length != testArr.length) return false;
  for (var i=0; i<testArr.length; i++) {
    if (this[i].compare) {
      if (!this[i].compare(testArr[i])) return false;
    }
    if (this[i] !== testArr[i]) return false;
  }
  return true;
};

/** 
 * Return all unique elements of an unsorted array.  Note that for
 * sorted array it is more efficient to use Array.prototype.sortUnique.
 */
Array.prototype.unique = function() {
  var n, l=this.length, v, r = [];
  for (n=0; n<l; n++) {
    v = this[n];
    if (r.indexOf(v) < 0) r.push(v);
  }
  return r;
};

/** 
 * Return all unique elements of a sorted array.  For long arrays, it
 * it probably more efficient to sort them first and to use this
 * function rather than the standard Array.prototype.unique one.
 */
Array.prototype.sortUnique = function() {
  var n, l=this.length, v, w, r = [];
  if (l == 0) return r;
  w = this[0];
  r = [w];
  for (n=1; n<l; n++) {
    v = this[n];
    if (v != w) r.push(v);
    w = v;
  }
  return r;
};

/**
 * Appends several values to an array only if they are not already in.
 *
 * @param  values The values to add
 * @return        The new modified array  
 */
Array.prototype.concatUnique = function(values) {
  var n, l=values.length, v, r = this.slice();
  for (n=0; n<l; n++) {
    v = values[n];
    if (typeof(v) == "string") {
      if (this.indexOf(v) < 0) r.push(v);
    } else {
      var found = false, m;
      for (m=0; m<r.length; m++) 
	if (r[m].compare(v)) found = true;
      if (! found) r.push(v);
    }
  }
  return r;
};

/**
 * Returns all permutations of the values of an array.
 */
Array.prototype.permutations = function() {
  var l = this.length, h, ps, result = [], n, m, p;
  if (l == 0) return [];
  else if (l == 1) return [this];
  ps = this.slice(1).permutations();
  h = ps.length;
  for (n=0; n<l; n++) {
    for (m=0; m<h; m++) {
      p = ps[m];
      result.push(p.slice(0, n).concat([this[0]]).concat(p.slice(n)));
    }
  }
  return result;
};

Array.prototype.permutate = function(perm) {
  var l=perm.length, n, result = [];
  for (n=0; n<l; n++) result.push(this[perm[n]]);
  return result;
};

Array.prototype.inversePermutation = function() {
  
};

/* Prototypes */

//This prototype is provided by the Mozilla foundation and 
//is distributed under the MIT license. 
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license 
if (!Array.prototype.map) 
{ 
  Array.prototype.map = function(fun /*, thisp*/) 
  { 
    var len = this.length; 
    if (typeof fun != "function") 
      throw new TypeError(); 
    var res = new Array(len); 
    var thisp = arguments[1]; 
    for (var i = 0; i < len; i++) 
    { 
      if (i in this) 
        res[i] = fun.call(thisp, this[i], i, this); 
    } 
    return res; 
  }; 
} 

//This prototype is provided by the Mozilla foundation and 
//is distributed under the MIT license. 
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license 
if (!Array.prototype.some) 
{ 
  Array.prototype.some = function(fun /*, thisp*/) 
  { 
    var len = this.length; 
    if (typeof fun != "function") 
      throw new TypeError(); 
    var thisp = arguments[1]; 
    for (var i = 0; i < len; i++) 
    { 
      if (i in this && 
          fun.call(thisp, this[i], i, this)) 
        return true; 
    } 
    return false; 
  };
}

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

//This prototype is provided by the Mozilla foundation and
//is distributed under the MIT license.
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}


//This prototype is provided by the Mozilla foundation and 
//is distributed under the MIT license. 
//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license 

if (!Array.prototype.forEach) 
{ 
  Array.prototype.forEach = function(fun /*, thisp*/) 
  { 
    var len = this.length; 
    if (typeof fun != "function") 
      throw new TypeError(); 
    var thisp = arguments[1]; 
    for (var i = 0; i < len; i++) 
    { 
      if (i in this) 
        fun.call(thisp, this[i], i, this); 
    } 
  }; 
} 
