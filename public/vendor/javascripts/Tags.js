/**
 * Kevin's extend function (extended with virtual inheritance!)
 *
 * This function is used to derive a subclass from a parent class.
 *
 * @param subclass   The derived class
 * @param superclass The original, parent class
 *
 * @example
 * subclass = function() { ... };
 * classExtend(subclass, superclass);
 * subclass.prototype.method() { return this.superclass.method() + 1; }
 */
classExtend = function(subclass, superclass) {
  var f = function() {};
  f.prototype = superclass.prototype;
  subclass.prototype = new f();
  subclass.prototype.constructor = subclass;
  subclass.superclass = superclass.prototype;
  if (superclass.prototype.constructor == Object.prototype.constructor) {
    superclass.prototype.constructor = superclass;
  }
  subclass.prototype.parent = function (superclass, method) {
    var t = this;
    return function () {
      return superclass.prototype[method].apply(t, arguments);
    };
  };
};

sesameCache = {"": [0,0,0]};
sesameCache['m31'] = [10.684625, 41.269278, 1, "S", "LIN"];
sesameCache['abell 2122'] = [10.684625, 41.269278, 1, "S", "LIN"];
sesameCache["xxx"] = [0, 0, 0, "", ""];
sesameErrors = {};
sesameWarnings = {};

sesameResolver = function (name, updaterfunction) {
  var res = sesameCache[name];
  if (res) {
    if (res[2] == -1) sesameWarnings[name] = true;
    else if (res[2] == 0) sesameErrors[name] = true;
    return res;
  } else {
    var host, resolver, opt, url, nmatches; 
    sesameCache[name] = [0.0, 0.0, -1, "", ""];
    sesameWarnings[name] = true;

    host = "/hst/sesame/";
    url = host + "/SNV?" + name;
    
    $.ajax({url: url,
            type: "GET",
            dataType: "xml",
            success: function (data) {
              delete sesameWarnings[name];
	      nmatches = 1;
              if ($($(data).find('jradeg')).length > 0) {
		$(data).find('INFO').each(function () {
                  if ($(this).text().match(/multiple/i)) {
		    var m = $(this).text().match(/[0-9]+/);
		    if (m) nmatches = parseInt(m[0]);
		    else nmatches = 2;
		  }
	      });
		$(data).find('Resolver').each(function () {
                  resolver = $(this).attr("name")[0];
	        });
		sesameCache[name] = 
		  [parseFloat($($(data).find('jradeg')[0]).text()),
		   parseFloat($($(data).find('jdedeg')[0]).text()),
		   nmatches, resolver, $($(data).find('otype')[0]).text()];
	      } else {
		sesameErrors[name] = true;
		sesameCache[name] = [0.0, 0.0, 0, "", ""];
	      }
	      updaterfunction();
	   },
           error: function(XMLHTTPRequest, textStatus, errorThrown) {
             sesameErrors[name] = true;
	     sesameCache[name]  = [0.0, 0.0, 0, "", ""];
             updaterfunction();
           }}
          );   

    return sesameCache[name];
  }
};


getPage = function (url) {
  // the file to be read
  pageURL = new java.net.URL(url);

  // step 1, open the URL
  var openConnection = pageURL.openConnection;
  theConnection = openConnection();

  // step 2, connect to server
  var t=theConnection.connect;
  t();

  // step 3, read the file using HTTP protocol
  var getContent = theConnection.getContent;
  var theURLStream = getContent();

  // step 4, get an handle and fetch the content length
  var readStream = theURLStream.read;
  var gcl = theConnection.getContentLength;
  gcLen = gcl();

  // and finally, read into a variable
  theText ="";
  for (i = 1; i <gcLen; i++) {
   theText += new java.lang.Character(readStream());
   }

  // for demonstration
  alert(theText);
};

/********************************************************************/

Token = function (tag, operator, value, pos1, pos2, pos3, cont) {
  this.tag   = tag || "";
  this.op    = operator || "";
  this.value = value;
  this.pos1  = pos1;
  this.pos2  = pos2;
  this.pos3  = pos3;
  this.cont  = cont || false;
};

Token.prototype.compare = function (token) {
  return ((this.tag   == token.tag ) &&
          (this.op    == token.op  ) &&
          (this.value == token.value));
};

Token.prototype.copy = function () {
  return new Token(this.tag, this.op, this.value, 
		   this.pos1, this.pos2, this.pos3);
};

/********************************************************************/

DataTag = function (tag, operator, value, errors) {
  this.tag    = tag || "";
  this.op     = operator || "";
  this.value  = value;
  this.errors = errors || [];
};

/********************************************************************/

tags = [];
tagdict = {};
tagsmain = [];

/**
 * An abstract Tag
 * 
 * This implements an abstract Tag class, progenitor of all tags.
 *
 * @param SQLname  The name used by getSQLText to produce the SQL code for the
 *                 specific tag.  In this translation, the codes use also the
 *                 operator and the value entered with the token.  If SQLname
 *                 is an empty string, then no SQL code is produced
 * @param names    An array of accepted names for the token.  The first element
 *                 of the array is the standard name, used also by
 *                 getText.
 */
Tag = function (SQLname, names) {
  this.SQLname = SQLname || "";
  this.names = names || [];
  if (names) {
    for (var i=0; i<names.length; i++) 
      if (tags.indexOf(names[i]) < 0) {
	tags.push(names[i]);
	tagdict[names[i]] = [this];
	if (i == 0) tagsmain.push(names[i]);
      } else {
	tagdict[names[i]].push(this);
      }
  }
  this.operators = ["", "=", "!="];
  this.acceptminus = true;	// true: - is recognized as a neg. operator
  this.translation = {};	// translation dictionary
  this.multiwords = false;	// true: value can be composed of many words
  this.separator = " ";		// possible SQL separators for multiwords
  this.forceable = false;	// true: tag implies a match
  this.target = false;		// true: target-like tag (always matches)
  this.reset();
};

Tag.inverse = {
  "=": "!=",
  "!=": "=",
  ">": "<=",
  ">=": "<",
  "<": ">=",
  "<=": ">"
};

Tag.prototype = {

  colorCodes: {
    "tag": "9932CC",
    "op": "000000",
    "value": "2E8B57",
    "quote": "0000FF"
  },

  /**
   * Resets the stored values of a tag.
   *
   * Since tag verification is incremental, a new start for a tag verification
   * requires this function to be called.  This function is also by default
   * called by all constructurs of the derived classes.
   */
  reset: function(keepData) {
    if (! keepData) this.data = new DataTag();
  },

  /**
   * Verifies if list of token is valid and sets the relevant object variables.
   *
   * @param tokens A list of strings or objects in the format
   *              {tag: "...", op: "...", value: "..."}.  If strings are used
   *              then both tag and op are taken to be "".
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  verify: function (tokens) {
    var n, l = tokens.length, words = [], operator, tag, tokens1, res;
    this.clearErrors();
    if (l == 0) {
      this.matchpos = [];
      return this.match(words);
    }
    tokens1 = tokens.slice();
    tokens1[0] = tokens[0].copy();
    tag = tokens1[0].tag || "";
    operator = tokens1[0].op || "=";
    words[0] = tokens1[0].value;
    if (tag[0] == "-") {
      tag = tokens1[0].tag = tag.slice(1);
      operator = tokens1[0].op = Tag.inverse[operator];
    }
    if (this.acceptminus && words[0][0] == "-") {
      words[0] = tokens1[0].value = words[0].slice(1);
      operator = tokens1[0].op = Tag.inverse[operator];
    }
    if ((! this.names) || (! tag) || this.names.indexOf(tag) >= 0) {
      if (this.operators.indexOf(tokens1[0].op) < 0) {
	this.addError(tokens1[0].pos2, tokens1[0].op, "wrong operator");
	return [false, false];
      }
      if (words[0][0] == '"' || words[0][0] == "'") {
	if (l == 1) {
	  var word0 = words[0], trace;
	  if (word0[0] == word0[words[0].length-1])
	    word0 = word0.slice(1,-1);
	  else
	    word0 = word0.slice(1);
	  words = word0.split(/[ \t\r\n]+/);
	  trace = word0.retrace(words);
	  if (!this.multiwords && words.length > 1) {
	    this.addError(tokens1[0].pos3 + trace[1][0] + 1, 
			  words[1], "unexpected word");
	    return [false, false];
	  }
	  if (this.forceable && tag && this.names) {
	    res = words.join(" ");
	    if (res.length > 0) {
	      if (res[0] == "^") res = res.slice(1);
	      if (res[res.length - 1] == "$") res = res.slice(0, res.length-1);
	    }
	    this.setData(new DataTag(tag, operator, res));
	    return [true, false];
	  } else {
	    this.matchpos = [trace[0][0] + 1];
	    this.setData(new DataTag(tag, operator, ""));
	    if (!this.multiwords) {
	      if (words[0].length > 0) {
		if (words[0][0] == "^") words[0] = words[0].slice(1);
		if (words[0][words[0].length - 1] == "$") 
		  words[0] = words[0].slice(0, words[0].length-1);
		this.matchpos = [tokens1[0].pos3];
		return [this.match(words)[0], false];
	      } else {
		this.addError(tokens1[0].pos3, "''", "empty value");
		return [false, false];
	      }
	    } else {
	      for (n=1; n<words.length; n++) 
		this.matchpos.push(trace[n][0] + 1);
	    }
	  }
	} else {
	  this.addError(tokens1[1].pos3, tokens1[1].value, 
			"word past a quoted string");
	  return [false, false];
	}
      }
      if (words[0] == "") {
	if (operator == "=" && tokens1[0].op == "") operator = "";
	this.setData(new DataTag(tag, operator, ""));
	if (tag) {
	  this.clearErrors();
	  return [true, true];
	} else {
	  this.clearErrors();
	  // @@@ this.addError(tokens1[0].pos3, "", "empty value"); 
	  // @@@ return [false, false];
	  return [true, true];
	}
      }
      this.matchpos = [tokens1[0].pos3];
      for (n=1; n<l; n++) {  
	var value;
	value = tokens1[n].value;
        if (tokens1[n].tag && ! tokens1[n].cont) {
	  this.addError(tokens1[n].pos1, tokens1[n].tag, "new keyword found");
	  return [false, false];
	}
        if (tokens1[n].op && ! tokens1[n].cont) {
	  this.addError(tokens1[n].pos2, tokens1[n].op, "new operator found");
	  return [false, false];
	}
	if (value == "") {
	  this.addError(tokens1[n].pos3, "", "empty value");
	  return [false, false];
	}
	if (value[0] == '"' || value[0] == "'") {
	  this.addError(tokens1[n].pos3, value, "quoted value found");
	  return [false, false];
	}
	if (value[0] == "-") {
	  this.addError(tokens1[n].pos3, value, "negation operator found");
	  return [false, false];
	}
	if (value[0] == "^") {
	  this.addError(tokens1[n].pos3, value, "^ sign found");
	  return [false, false];
	}
	if (value[value.length-1] == "$" && n != l-1) {
	  this.addError(tokens1[n].pos3, value, "$ sign found");
	  return [false, false];
	}
	words.push(value);
	this.matchpos.push(tokens1[n].pos3);
      }

      if (!this.multiwords) {
	if (l > 1) {
	  this.addError(tokens1[1].pos3, words[1], "unexpected word");
	  return [false, false];
	}
	if (words[0].length > 0) {
	  if (words[0][0] == "^") words[0] = words[0].slice(1);
	  if (words[0][words[0].length - 1] == "$") 
	    words[0] = words[0].slice(0, words[0].length-1);
	}
      }
      this.setData(new DataTag(tag, operator, ""));
      res = this.match(words);
      if (words[words.length-1][words[words.length-1].length-1] == "$")
	res[1] = false;
      if (! res[0] && this.forceable && l == 1 && tag && this.names) {
	this.setData(new DataTag(tag, operator, words.join(" ")));
	this.clearErrors();
	return [true, res[1]];
      } else return res;
    } else {
      if (tags.indexOf(tag) < 0) 
	this.addError(tokens1[0].pos1, tokens1[0].tag, "wrong keyword");
      return [false, false];
    }
  },

 /**
   * Verifies if a set of words can be interpreted as a specific tag.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  match: function (words) {
    this.setValue(words.join(" "));
    return [words.length > 0, true];
  },

  autocomp: function (tokens) {
    var n, l = tokens.length, words = [], operator, tag, tokens1, res, 
      minus = "", quote1 = "", quote2 = "";
    if (l == 0) return this.complete([]);
    tokens1 = tokens.slice();
    tokens1[0] = tokens[0].copy();
    tag = tokens1[0].tag || "";
    operator = tokens1[0].op || "=";
    words[0] = tokens1[0].value;
    if (tag[0] == "-") {
      tag = tokens1[0].tag = tag.slice(1);
      operator = tokens1[0].op = Tag.inverse[operator];
    }
    if (this.acceptminus && words[0][0] == "-") {
      minus = "-";
      words[0] = tokens1[0].value = words[0].slice(1);
      operator = tokens1[0].op = Tag.inverse[operator];
    }
    if ((! this.names) || (! tag) || this.names.indexOf(tag) >= 0) {
      if (this.operators.indexOf(tokens1[0].op) < 0) return [];
      if (words[0][0] == '"' || words[0][0] == "'") {
	if (l == 1) {
	  var word0 = words[0], trace;
	  quote1 = quote2 = words[0][0];
	  if (word0[0] == word0[words[0].length-1])
	    word0 = word0.slice(1,-1);
	  else
	    word0 = word0.slice(1);
	  words = word0.split(/[ \t\r\n]+/);
	  trace = word0.retrace(words);
	  if (words.length > 1) {
	    quote1 = "";
	    minus = "";
	  }
	  if (!this.multiwords && words.length > 1) return [];
	} else return [];
      }
      if (words[0] == "") {
	if (operator == "=" && tokens1[0].op == "") operator = "";
	if (operator == "" && tag != "") return this.operators;
	this.setData(new DataTag(tag, operator, ""));
	res = this.complete([""]).map(function (w) { 
		return (w[0] == "#") ? "#" + minus + quote1 + w.slice(1) 
			             : minus + quote1 + w; });
	return res;
      }
      if (l > 1) minus = "";
      for (n=1; n<l; n++) {  
	var value;
	value = tokens1[n].value;
        if (((tokens1[n].tag || tokens1[n].op) && ! tokens1[n].cont) ||
	    value[0] == "'" || value[0] == '"' || value[0] == "-" || 
	    value[0] == "^" || (value[value.length-1] == "$" && n != l-1)) 
	  return [];
	words.push(value);
      }
      if (!this.multiwords) {
	if (l > 1) return [];
	if (words[0].length > 0) {
	  if (words[0][0] == "^") words[0] = words[0].slice(1);
	  if (words[0][words[0].length - 1] == "$") 
	    words[0] = words[0].slice(0, words[0].length-1);
	}
      }
      if (words[words.length-1][words[words.length-1].length-1] == "$")
	return [];
      this.setData(new DataTag(tag, operator, ""));
      res = this.complete(words).map(function (w) { 
		return (w[0] == "#") ? "#" + minus + quote1 + w.slice(1) 
			             : minus + quote1 + w; });
      return res;
    } else return [];
  },

  complete: function (words) {
    return [];
  },

  colorize: function (text, style) {
    return '<font color="#' + this.colorCodes[style] + '">' + text + '</font>';
  },

  getName: function (mode) {
    if (mode == "SQL") return this.SQLname;
    else return this.names[0];
  },

  setData: function (data) {
    this.data = data;
  },

  getData: function () {
    return this.data;
  },

  getDataCopy: function () {
    var d = this.getData();
    return new DataTag(d.tag, d.op, d.value, d.errors);
  },

  setValue: function (value) {
    var d = this.getData();
    d.value = value;
    this.setData(d);
  },

  getValue: function (mode, value) {
    var v = (value != null) ? value : this.getData().value, r;
    if (mode == null) return v;
    if (v === null || typeof(v) == "undefined") return "";
    r = v.toString();
    if (mode == "SQL") {
      if (this.translation) r = this.translation[r] || r.globToSQL();
      else r = r.globToSQL();
    } else r = r.escape('"');
    return r;
  },

  clearErrors: function () {
    var d = this.getData();
    d.errors = [];
    this.setData(d);
  },

  addError: function (position, word, error) {
    var d = this.getData();
    d.errors.push([position, word, error]);
    this.setData(d);
  },

  addErrorMatch: function (position, word, error) {
    this.addError(this.matchpos[position], word, error);
  },

  setErrors: function (errors) {
    var d = this.getData();
    d.errors = errors.slice();
    this.setData(d);
  },

  getErrors: function () {
    var d = this.getData();
    return d.errors;
  },

  mergeErrors: function () {
    var es = getErrors(), e, pmin = Number.POSITIVE_INFINITY, 
      phrase = "", tmp, messages = [], n, i;
    for (n=0; n<es.length; n++) {
      e = es[n];
      if (e[0] < pmin) {
	tmp = e[1];
	for (i=e[0] + e[1].length; i<pmin; i++) tmp += " ";
	phrase = tmp.slice(0, pmin - e[0]) + phrase;
	pmin = e[0];
      } else {
	tmp = "";
	for (i=pmin + phrase.length; i<e[0]; i++) tmp += " ";
	phrase = phrase.slice(0, e[0]) + tmp + e[1];
      }
      if (messages.indexOf(e[2]) < 0) messages.push(e[2]);
    }
    if (messages.length == 0) this.clearErrors();
    else if (message.length <= 3) 
      this.setErrors([pmin, phrase, messages.join(" or ")]);
    else 
      this.setErrors([pmin, phrase, "unrecognized value"]);
  },

  getText: function (mode) {
    var name = this.getName(mode), sep;
    if (this.separator.length == 1 && "%_[]".indexOf(this.separator) < 0)
      sep = this.separator;
    else
      sep = "[" + this.separator + "]";
    if (name) {
      var d = this.getData(), v, res, logop;
      if (d.value === null) return "";
      if (mode == "SQL") {
	v = this.getValue(null, d.value);
	if (d.op == "=") {
	  name += " LIKE ";
	  logop = " OR ";
	} else if (d.op == "!=") {
	  name += " NOT LIKE ";
	  logop = " AND ";
	} else return "";
	if (v[0] == "^") {
	  if (v.length > 1 && v[v.length-1] == "$")
	    res = [this.getValue(mode, v.slice(1, v.length-1))];
	  else {
	    res = [this.getValue(mode, v.slice(1))];
	    if (this.multiwords && res[0].length > 0 && 
		res[0][res[0].length-1] != "%") 
	      res = [res[0], res[0] + sep + "%"];
	  }
	} else {
	  if (v.length > 0 && v[v.length-1] == "$") {
	    res = [this.getValue(mode, v.slice(0, v.length-1))];
	    if (this.multiwords && res[0].length > 0 && res[0][0] != "%") 
	      res = [res[0], "%" + sep + res[0]];
	  } else {
	    res = [this.getValue(mode, v.slice(0, v.length))];
	    if (this.multiwords && res[0].length > 0) {
	      if (res[0][0] != "%" && res[0][res[0].length-1] != "%")
		res = [res[0], "%" + sep + res[0], res[0] + sep + "%", 
		       "%" + sep + res[0] + sep + "%"];
	      else if (res[0][0] != "%") 
	        res = [res[0], "%" + sep + res[0]];
	      else if (res[0][res[0].length-1] != "%")
	        res = [res[0], res[0] + sep + "%"];
	    }
	  }
	}
	return "(" + res.map(function (x) { return name + "'" + x + "'"; }).join(logop) + ")";
      } else if (mode == "HTML") {
	v = this.getValue(mode, d.value);
	if (v != "") {
          if (v.indexOf(" ") >= 0 || tags.indexOf(v) >= 0) 
	    v = this.colorize('"' + v + '"', "quote");
	  else v = this.colorize(v, "value");
          return this.colorize(name, "tag") + this.colorize(d.op, "op") + v;
	} else {
	  if (d.tag || d.op) 
	    return this.colorize(name, "tag") + this.colorize(d.op, "op");
	  else return "";
	}
      } else {
	v = this.getValue(mode, d.value);
	if (v != "") {
          if (v.indexOf(" ") >= 0 || tags.indexOf(v) >= 0) v = '"' + v + '"';
          return name + d.op + v;
	} else {
	  if (d.tag || d.op) return name + d.op;
	  else return "";
	}
      }
    } else return "";
  }

};

/********************************************************************/

/**
 * The simplest possible tag, the null tag.
 * <p>
 * This tag matches a null text (zero words).
 */
TagNull = function (SQLname, names) {
  this.parent(Tag, "constructor")(SQLname, names);
};

classExtend(TagNull, Tag);

TagNull.prototype.match =
  /**
   * Verifies that the list of words is empty.
   */
  function (words) {
    if (words.length == 0) return [true, false];
    else {
      this.addErrorMatch(1, words[1], "unexpected word");
      return [false, false];
    }
  };

/********************************************************************/

/**
 * The second simplest possible tag, the any-word tag.
 * <p>
 * This tag implements simple any-word consumer: it accepts any single word.
 */
TagAnyWord = function (SQLname, names) {
  this.parent(Tag, "constructor")(SQLname, names);
};

classExtend(TagAnyWord, Tag);

TagAnyWord.prototype.reset =
  function (keepData) {
    this.parent(Tag, "reset")(keepData);
    this.setValue(true);
  };

TagAnyWord.prototype.match =
  /**
   * Verifies that the list of words is composed by a single word, and accept
   * it.
   */
  function(words) {
    if (words.length == 1) {
      this.setValue(words[0]);
      return [true, false];
    } else if (words.length == 0) {
      this.setValue(null);
      return [false, true];
    } else {
      this.addErrorMatch(1, words[1], "unexpected word");
      return [false, false];      
    }
  };

/********************************************************************/

/**
 * The third simplest possible tag, a fixed word tag.
 * <p>
 * This tag implements a checker for a fixed word.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param word    The accepted word
 */
TagWord = function (SQLname, names, word) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.word = word;
};

classExtend(TagWord, Tag);

TagWord.prototype.match =
  /**
   * Verifies that the list of words is empty.
   */
  function(words) {
    var word0;
    if (words.length == 1 && (word0 = words[0].unEscape()) == this.word) {
      this.setValue(word0);
      return [true, false];
    }
    if (words.length == 0) {
      this.setValue(null);
      return [false, true];
    } else if (words.length == 1) {
      this.addErrorMatch(0, words[0], "wrong word entered");
    } else this.addErrorMatch(1, words[1], "unexpected word");
    return [false, false];
  };

TagAnyWord.prototype.complete =
  function (words) {
    if (words.length == 1 && this.word.slice(0, words[0].length) == words[0]) 
      return [this.word];
    else return [];
  };


/********************************************************************/

/**
 * An abstract class for numeric tags.
 * <p>
 * This class is the progenitor of all numeric tags.  It provides a few standard
 * members and a method, checkRange, to check that a number is within the
 * allowed range.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param sign    The sign of the number.  Can be true, false, or "optional"
 *                Note that a strict sign check is only performed for no-tagged
 *                values; when a tag is present, the sign is always taken as
 *                "optional" for the match, but if sign=false and a sign is 
 *                entered an error is generated.
 * @param min     The minimum allowed value or null if no minimum is present.
 * @param max     The maximum allowed value or null if no maximum is present.
 */
TagNumeric = function (SQLname, names, sign, min, max) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.operators = ["", "=", "!=", "<", ">", "<=", ">="];
  this.sign = (sign === true || sign === false) ? sign : "optional";
  this.min = min;
  this.max = max;
  this.acceptminus = false;
};

classExtend(TagNumeric, Tag);

TagNumeric.prototype.colorCodes = {
  "tag": "9932CC",
  "op": "000000",
  "value": "4682B4"
};

TagNumeric.prototype.checkRange =
  /*
  /**
   * Check that a numeric value is within the allowed range.
   *
   * @param value The test value
   * @return A boolean value indicating whether the value is in the range
   */
  function (value, word) {
    if (! ((this.min != null && value < this.min) ||
           (this.max != null && value > this.max))) {
      return true;
    } else {
      if (this.min != null && this.max != null)
        this.addErrorMatch(0, word, "out of range [" +
          this.min + ", " + this.max + "]");
      else if (this.min != null)
        this.addErrorMatch(0, word, "smaller than minimum [" + this.min + "]");
      else if (this.max != null)
        this.addErrorMatch(0, word, "larger than maximum [" + this.max + "]");
      return false;
    }
    return false;
  };

TagNumeric.prototype.getValue =
  function(mode, value) {
    var v = (value != null) ? value : this.getData().value, s1, s2, sign, m;
    if (mode == null) return v;
    if (mode == "SQL") return v.toString();
    else {
      if (v == "") return v;
      if (this.sign == true && v > 0) sign = '+';
      else sign = '';
      s1 = v.toString();
      s2 = v.toPrecision(8);
      if (s2.length < s1.length) s1 = s2;
      m = s1.match(/(^[-+]?[0-9]*(\.?[0-9]*[1-9])?)0*([eEdD][-+]?[0-9]+)?$/);
      if (m) return sign + m[1] + (m[3] || "");
      m = s1.match(/(^[-+]?[0-9]*)(\.0*)?([eEdD][-+]?[0-9]+)?$/);
      if (m) return sign + m[1] + (m[3] || "");
      return sign + s1;
    }
  };

TagNumeric.prototype.getText =
  function (mode) {
    var SQLname = this.getName("SQL");
    if (SQLname) {
      var d = this.getData(), v = this.getValue(mode, d.value), op = d.op,
        name = this.getName(mode);
      if (mode == "SQL" && op == "!=") op = "<>";
      if (mode != "HTML") return name + op + v;
      else return this.colorize(name, "tag") + this.colorize(d.op, "op") +
	this.colorize(v, "value");
    } else return "";
  };

/********************************************************************/

/**
 * A numeric tag.
 * <p>
 * A class to check for simple numeric types (both integers and reals).
 * The class is directly derived from TagNumeric, and has a similar interface.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param sign    The sign of the number.  Can be true, false, or "optional"
 *                Note that a strict sign check is only performed for no-tagged
 *                values; when a tag is present, the sign is always taken as
 *                "optional" for the match, but if sign=false and a sign is 
 *                entered an error is generated.
 * @param fmt     The number format: "int" or "flt"
 * @param min     The minimum allowed value or null if no minimum is present.
 * @param max     The maximum allowed value or null if no maximum is present.
 */
TagNumber = function (SQLname, names, sign, fmt, min, max) {
  this.parent(TagNumeric, "constructor")(SQLname, names, sign, min, max);
  this.fmt = (fmt == "int") ? "int" : "flt";
  if (this.fmt == "int") {
    if (sign === false) this.regexp = this.re_int1;
    else if (sign === true) this.regexp = this.re_int2;
    else this.regexp = this.re_int3;
    this.tagregexp = this.re_int3;
  } else {
    if (sign === false) this.regexp = this.re_flt1;
    else if (sign === true) this.regexp = this.re_flt2;
    else this.regexp = this.re_flt3;
    this.tagregexp = this.re_flt3;
  }
};

classExtend(TagNumber, TagNumeric);

TagNumber.prototype.re_int1 = /^\d+$/;
TagNumber.prototype.re_int2 = /^[-+]\d+$/;
TagNumber.prototype.re_int3 = /^[-+]?\d+$/;
TagNumber.prototype.re_flt1 = /^\d+(\.\d+)?(e[-+]?\d*)?$/;
TagNumber.prototype.re_flt2 = /^[-+]\d+(\.\d+)?(e[-+]?\d*)?$/;
TagNumber.prototype.re_flt3 = /^[-+]?\d+(\.\d+)?(e[-+]?\d*)?$/;

TagNumber.prototype.match =
  /**
   * Verifies if a set of words can be interpreted as a number.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    if (words.length == 1) {
      var m, value;
      if (this.getData().tag) m = words[0].match(this.tagregexp);
      else m = words[0].match(this.regexp);
      if (m) {
        if (this.fmt == 'int') value = parseInt(words[0]);
        else value = parseFloat(words[0]);
	this.setValue(value);
	if (this.sign == false && value < 0) {
	  this.addErrorMatch(0, words[0], "sign not allowed");
	  return [false, false];
	} else return [this.checkRange(value, words[0]), false];
      } else {
	this.addErrorMatch(0, words[0], "malformed number");
	return [false, false];
      }
    }
    if (words.length == 0) {
      this.setValue(null);
      return [false, true];
    } else {
      this.addErrorMatch(1, words[1], "unexpected word");
      return [false, false];
    }
  };

TagNumber.prototype.complete =
  function (words) {
    var res;
    if (words.length > 1) return [];
    if (words.length == 1 && words[0]) {
      var m;
      if (this.getData().tag) m = (words[0] + "0").match(this.tagregexp);
      else m = (words[0] + "0").match(this.regexp);
      if (!m) return [];
    }
    return [((this.sign) ? "#signed " : "#") + 
	    ((this.fmt == "int") ? "integer#" : "float number#")];
  };

/********************************************************************/

/**
 * An angle (or RA-like) tag.
 * <p>
 * A class to check for angles (or, more generally, for sessagesimal,
 * column-separated values).  Accepted formats are aa:bb:cc.ddd, aa:bb.ccc,
 * and aa.bbb.
 * The class is directly derived from TagNumeric, and has a similar interface.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param sign    The sign of the number.  Can be true, false, or "optional"
 *                Note that a strict sign check is only performed for no-tagged
 *                values; when a tag is present, the sign is always taken as
 *                "optional".
 * @param hours   If true, the entered value is taken to be in hours and
 *                multiplied by 15 to have it in degrees
 * @param min     The minimum allowed value or null if no minimum is present.
 * @param max     The maximum allowed value or null if no maximum is present.
 */
TagAngle = function (SQLname, names, sign, hours, min, max) {
  this.hours = hours;
  this.parent(TagNumeric, "constructor")(SQLname, names, sign, min, max);
};

classExtend(TagAngle, TagNumeric);

TagAngle.prototype.regexp = /^\d+(\.\d+)?$/;

TagAngle.prototype.match =
  /**
   * Verifies if a set of words can be interpreted as an angle.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var p = 0, values, value, tag = this.getData().tag;
    if (words.length == 1) {
      p = 0;
      if (words[0][0] == "+" || words[0][0] == "-") {
        if (this.sign) p += 1;
        else {
	  this.addErrorMatch(0, words[0], "sign not allowed");
	  return [false, false];
	}
      } else if (this.sign === true && tag == "") {
	this.addErrorMatch(0, words[0], "missing sign");
	return [false, false];
      }
      if (words[0].length > p) {
        values = words[0].slice(p).split(":");
        if ((values.length > 3) || (! values[0].match(this.regexp)) ||
            (values.length < 3 && tag == "")) {
	  this.addErrorMatch(0, words[0], "malformed angle");
	  return [false, false];
	}
        value = parseFloat(values[0]);
        if (values.length > 1) {
          if ((values[0].indexOf(".") >= 0) || 
	    (! values[1].match(this.regexp))) {
	    this.addErrorMatch(0, words[0], "malformed angle");
	    return [false, false];
	  }
          value += parseFloat(values[1]) / 60.0;
        }
        if (values.length > 2) {
          if ((values[1].indexOf(".") >= 0) || 
	    (! values[2].match(this.regexp))) {
	    this.addErrorMatch(0, words[0], "malformed angle");
	    return [false, false];
	  }
          value += parseFloat(values[2]) / 3600.0;
        }
        if (p == 1 && words[0][0] == "-") value = -value;
        if (this.hours) this.setValue(value * 15);
	else this.setValue(value);
        return [this.checkRange(value, words[0]), false];
      } else {
	this.addErrorMatch(0, words[0], "malformed angle");
	return [false, false];
      }
    } else {
      if (words.length == 0) {
	this.setValue(null);
	return [false, true];
      } else {
	this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
  };

TagAngle.prototype.complete =
  function (words) {
    var p, values, tag = this.getData().tag, s;
    
    if (words.length > 1) return [];
    s = (this.sign) ? "dd" : "ddd";
    s = (this.hours) ? ["hh:mm:ss[.fff]", "hh:mm[.fff]", "hh[.fff]"] : 
      [s + ":mm:ss[.fff]", s + ":mm[.fff]", s + "[.fff]"];

    if (words.length == 1) {
      p = 0;
      if (words[0][0] == "+" || words[0][0] == "-") {
        if (this.sign) p += 1;
	else return [];
      } else if (this.sign === true && tag == "" && words[0]) return [];
      if (words[0].length > p) {
        values = words[0].slice(p).split(":");
        if ((values.length > 3) || 
	  (values[0] && ! values[0].match(this.regexp)))
          return [];
        if ((values.length > 1) &&
          ((values[0].indexOf(".") >= 0) || 
	   (values[1] && ! values[1].match(this.regexp)))) return [];
        if ((values.length > 2) &&
          ((values[1].indexOf(".") >= 0) || 
	   (values[2] && ! values[2].match(this.regexp)))) return [];
      } 
    } 
    if (!tag) {
      if (this.sign == true) return ['#&plusmn;' + s[0] + '#'];
      else if (this.sign == 'optional') return ['#[&plusmn;]' + s[0] + '#'];
      else return ['#' + s[0] + '#'];
    } else {
      if (!this.sign) return ['#' + s[0] + ', ' + s[1] + ', or ' + s[2] + '#'];
      else return ['#[&plusmn;]' + s[0] + ', [&plusmn;]' + s[1] + 
		   ', or [&plusmn;]' + s[2] + '#'];
    }
  };

TagAngle.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value, w, s, sign;
    if (mode == null) return v;
    if (mode == "SQL") return v.toString();
    else {
      if (v == "") return v;
      if (this.hours) v /= 15.0;
      if (v < 0) sign = '-';
      else if (v > 0 && this.sign == true) sign = '+';
      else sign = '';
      v = Math.abs(v) + 0.005 / 3600;
      w = Math.floor(v);
      s = w.toString();
      v = (v - w) * 60.0;
      w = Math.floor(v);
      s += ':' + (w < 10 ? '0' : '') + w.toString();
      v = (v - w) * 60.0;
      w = Math.floor(v);
      s += ':' + (w < 10 ? '0' : '') + w.toString();
      v = (v - w) * 100.0;
      w = Math.floor(v);
      s += '.' + (w < 10 ? '0' : '') + w.toString();
      if (s == '0:00:00.00') sign = '';
      return sign + s;
    }
  };


/********************************************************************/

/**
 * A date tag.
 * <p>
 * A class to check for dates in the format YYYY-MM-DD.
 * The class is directly derived from TagNumeric, and has a similar interface.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param min     The minimum allowed date or null if no minimum is present.
 * @param max     The maximum allowed date or null if no maximum is present.
 */
TagDate = function (SQLname, names, min, max) {
  if (min) min = parseInt(min.split("-").join(""));
  if (max) max = parseInt(max.split("-").join(""));
  this.parent(TagNumeric, "constructor")(SQLname, names, false, min, max);
  this.acceptminus = true;
};

classExtend(TagDate, TagNumeric);

TagDate.prototype.regexp = /^\d\d\d\d-\d\d?-\d\d?$/;
TagDate.prototype.compregexp = /^\d*$/;

TagDate.prototype.match =
  /**
   * Verifies if a set of words can be interpreted as a date.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var values, value;
    if (words.length == 1) {
      if (! words[0].match(this.regexp)) {
	this.addErrorMatch(0, words[0], "malformed date");
	return [false, false];
      }
      values = words[0].split("-");
      value = new Date(values[0], values[1] - 1, values[2]);
      this.setValue(value);
      return [this.checkRange(value, words[0]), false];
    } else {
      if (words.length == 0) {
	this.setValue(null);
	return [false, true];
      } else {
	this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
  };

TagDate.prototype.complete =
  function (words) {
    var values;
    if (words.length > 1) return [];
    if (words.length == 1) {
      values = words[0].split("-");
      if (values.length > 3) return [];
      if (! values[0].match(this.compregexp) || values[0].length > 4 ||
	  (values.length >= 2 && (! values[1].match(this.compregexp) || 
				  values[1].length > 2)) ||
	  (values.length >= 3 && (! values[2].match(this.compregexp) || 
				  values[2].length > 2))) return [];
    }
    return ['#yyyy-mm-dd#'];
  };

TagDate.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value, r = "";
    if (v == "") return v;
    r += v.getFullYear() + "-"; 
    if (v.getMonth() + 1 < 10) r += "0";
    r += v.getMonth() + 1 + "-";
    if (v.getDate() < 10) r += "0";
    r += v.getDate();
    if (mode == "SQL") return "'" + r + " 00:00:00'";
    else return r;
  };

TagDate.prototype.getValueTomorrow = 
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value, r = "";
    v = new Date(v.valueOf() + 1000*3600*24);
    return this.getValue(mode, v);    
  };

TagDate.prototype.getText =
  function (mode) {
    var SQLname = this.getName("SQL");
    if (mode == "SQL" && SQLname) {
      var d = this.getData(), v, op = d.op, name = this.getName(mode);
      if (op == ">=" || op == "<") 
	v = this.getValue(mode, d.value);
      else if (op == ">" || op == "<=") 
        v = this.getValueTomorrow(mode, d.value);
      else {
	v = name + ">=" + this.getValue(mode, d.value) + " and " + 
	    name + "<" + this.getValueTomorrow(mode, d.value);
	if (op == "!=") return "NOT (" + v + ")";
	else return v;
      }
      return name + op + v;
    } else return this.parent(TagNumeric, "getText")(mode);
  };


/********************************************************************/

/**
 * A tag for a dimensional quantity.
 * <p>
 * A class to check for numeric types followed by units.  The unit is a simple
 * word from a list of valid units.  Units are compulsory, except when a tag
 * specification is in force and a default unit is specified.
 * The class is directly derived from TagNumeric, and has a similar interface.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param sign    The sign of the number.  Can be true, false, or "optional"
 *                Note that a strict sign check is only performed for no-tagged
 *                values; when a tag is present, the sign is always taken as
 *                "optional".
 * @param units   A dictionary-like list of units: keys are the unit names, and
 *                values are the units multiplication factors.
 * @param defunit An optional default unit.  If not specified, the unit must
 *                always be present, even when a tag specification is used.
 * @param min     The minimum allowed value or null if no minimum is present.
 * @param max     The maximum allowed value or null if no maximum is present.
 */
TagNumUnit = function (SQLname, names, sign, units, deftagunit, defunit,
		       min, max) {
  this.parent(TagNumeric, "constructor")(SQLname, names, sign, min, max);
  this.units = units || {};
  this.deftagunit = deftagunit;
  this.defunit = defunit;
};

classExtend(TagNumUnit, TagNumeric);

TagNumUnit.prototype.regexp = /^\d+(\.\d+)?(e[-+]?\d+)?/;

TagNumUnit.prototype.match =
  /**
   * Verifies if a set of words can be interpreted as a date.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var p = 0, m, value, unit, tag = this.getData().tag;
    if (words.length == 1) {
      if (words[0][0] == "+" || words[0][0] == "-") {
        if (this.sign) p += 1;
        else {
	  this.addErrorMatch(0, words[0], "sign not allowed");
	  return [false, false];
	}
      } else if (this.sign == true && tag == "") {
	this.addErrorMatch(0, words[0], "missing sign");
	return [false, false];
      }
      if (words[0].length > p) {
        m = this.regexp.exec(words[0].slice(p));
        if (!m) {
	  this.addErrorMatch(0, words[0], "malformed number");
	  return [false, false];
	}
        p += m[0].length;
        value = parseFloat(m[0]);
        if (p == words[0].length) {
	  if (tag && this.deftagunit) {
            this.setValue(value * this.units[this.deftagunit]);
            return [true, false];
	  } else if (tag == "" && this.defunit) {
            this.setValue(value * this.units[this.defunit]);
            return [true, false];
          } else {
	    this.addErrorMatch(0, words[0], "missing unit");
	    return [false, false];
	  }
        } else {
          unit = words[0].slice(p);
          if (unit in this.units) {
            this.setValue(value * this.units[unit]);
            return [true, false];
          } else {
	    if (unit == "") this.addErrorMatch(0, words[0], "missing unit");
	    else this.addErrorMatch(0, words[0], "wrong unit");
	    return [false, false];
	  }
        }
      } else {
	this.addErrorMatch(0, words[0], "malformed number");
	return [false, false];
      }
    } else {
      if (words.length == 0) {
	this.setValue(null);
	return [false, true];
      } else {
	this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
  };

TagNumUnit.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value, 
      unit = this.defunit || this.deftagunit;
    if (mode != null && mode != "SQL") {
      if (unit) v /= this.units[unit];
      var s = this.parent(TagNumeric, "getValue")(mode, v);
      if (unit) s += unit;
      return s;
    } else return this.parent(TagNumeric, "getValue")(mode, value);
  };

TagNumUnit.prototype.complete =
  function (words) {
    var p = 0, m, unit, curunit, tag = this.getData().tag, res = [];
    if (words.length > 1) return [];
    if (words.length == 1) {
      if (words[0][0] == "+" || words[0][0] == "-") {
        if (this.sign) p += 1;
	else return [];
      } else if (this.sign == true && tag == "" && words[0]) return [];
      if (words[0].length > p) {
	var value;
        m = this.regexp.exec(words[0].slice(p));
        if (!m) return [];
        p += m[0].length;
	value = words[0].slice(0, p);
        unit = words[0].slice(p);
	for (curunit in this.units) {
	  if (curunit.slice(0, unit.length) == unit) 
	    res.push(value + curunit);
	}
	return res;
      }
    }
    if (tag) return ["#value[unit]#"];
    else return ["#value with unit#"];
  };

/********************************************************************/

/**
 * A single-word regular-expression controlled tag.
 * <p>
 * This tag implements a simple regular-expression verifier for tags whose
 * values are composed by single words.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param regexp  The regular expression used to match the tag
 */
TagRegexp = function (SQLname, names, regexp) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.regexp = regexp;
  this.re_match = null;
  this.forceable = true;
};

classExtend(TagRegexp, Tag);

TagRegexp.prototype.match =
  /**
   * Verifies if a set of words can be interpreted as a date.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var word0;
    if (words.length == 1) {
      word0 = words[0].unEscape();
      this.re_match = word0.match(this.regexp);
    } else this.re_match = false;
    if (this.re_match) {
      this.setValue(word0);
      return [true, false];
    } else {
      if (words.length == 0) {
	this.setValue(null);
	return [false, true];
      } else {
	if (words.length == 1)
	  this.addErrorMatch(0, words[0], 
			     "value does not have the required format");
	else
	  this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
  };

/********************************************************************/

/**
 * A single-word tag from a set of allowed values.
 * <p>
 * This tag implements a simple set-based verifier for tags whose
 * values are composed by single words.  The word is accepted if it belongs
 * to the set or, when globbing is enabled, when it can potentially expand
 * to one of the set words.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param values  A string array with the allowed, recognized values
 * @param noglob  If true then globbing in the values is disabled
 */
TagSimpleSet = function (SQLname, names, values, noglob) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.values = values;
  this.noglob = noglob;
  this.forceable = true;
};

classExtend(TagSimpleSet, Tag);

TagSimpleSet.prototype.match =
  /**
   * Verifies if a word belong to the values set or can match words in the set.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var regex, res;
    if (words.length == 1) {
      if ((! this.noglob) && (words[0].isGlob())) {
        regex = new RegExp("^" + words[0].globToRegexp() + "$");
        res = this.values.filter(function (w) {
          return regex.test(w);
        });
        if (res.length > 0) {
          this.setValue(words[0]);
          return [true, false];
        } else {
	  this.addErrorMatch(0, words[0], "no match with known values");
	  return [false, false];
	}
      } else {
        if (this.values.indexOf(words[0]) >= 0) {
          this.setValue(words[0]);
          return [true, false];
        } else {
	  this.addErrorMatch(0, words[0], "no match with known values");
	  return [false, false];
	}
      }
    } else {
      if (words.length == 0) {
	this.setValue(null);
	return [false, true];
      } else {
	this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
  };

TagSimpleSet.prototype.complete = 
  function (words) {
    var res;
    if (words.length == 1) {
      if ((! this.noglob) && (words[0].isGlob())) {
        var regex = new RegExp("^" + words[0].globToRegexp());
        res = this.values.filter(function (w) {
          return regex.test(w);
        });
      } else {
	var len = words[0].length;
	res = this.values.filter(function (w) {
          return w.slice(0, len) == words[0];
        });
      }
      return res;
    } else return [];
  };

/********************************************************************/

/**
 * A single reserved-word tag from a set of known reserved words.
 * <p>
 *
 * @param values  A string array with the allowed, recognized values
 */
TagReserved = function (values) {
  this.parent(TagSimpleSet, "constructor")("", [], values, true);
};

classExtend(TagReserved, TagSimpleSet);

TagReserved.prototype.colorCodes = {
  "notop": "BC8F8F",
  "logop": "BC8F8F",
  "(": "000000",
  ")": "000000"
};

TagReserved.prototype.getText = function (mode) {
  if (mode != "HTML") return this.getValue(mode);
  else {
    var v = this.getValue(mode);
    if (v == "(") return this.colorize(v, "(");
    else if (v == ")") return this.colorize(v, ")");
    else if (v == "not") return this.colorize(v, "notop");
    else return this.colorize(v, "logop");
  }
};

TagReserved.prototype.getValue = function (mode, value) {
  var v = (value != null) ? value : this.getData().value, r;
  if (mode == null) return v;
  if (v === null) return "";
  r = v.toString();
  if (mode == "SQL" && this.translation) r = this.translation[r] || r;
  return r;
};

TagReserved.prototype.getErrors = function () {
  return [];
}

/********************************************************************/

/**
 * A flag or boolean tag.
 * <p>
 *
 * @param dict  A dictionary with the SQL values as keys, and with the
 *              recognized words as values (possibly as an array).  As
 *              an example, dict could be something like
 *              {"[Yy]": ["yes", "y", "ok"], "[Nn]": ["no", "n"]}. 
 * 
 */
TagFlag = function (SQLname, names, dict) {
  var key, values = [], value, translation = {}, textTranslation = {};
  if (dict == null) 
    dict = {"[Yy]": ["yes", "y", "ok", "true"], "[Nn]": ["no", "n", "false"]};
  if (dict instanceof Object) {
    for (key in dict) {
      value = dict[key];
      if (value instanceof Array) {
	values = values.concat(value);
	for (var i=0; i<value.length; i++) {
	  translation[value[i]] = key;
	  textTranslation[value[i]] = value[0];
	}
      } else {
	values.push(value);
	translation[value] = key;
      }
    }
  } else if (dict instanceof Array) values.concat(dict);
  this.parent(TagSimpleSet, "constructor")(SQLname, names, values, true);
  this.translation = translation;
  this.textTranslation = textTranslation;
};

classExtend(TagFlag, TagSimpleSet);

TagFlag.prototype.getValue = function (mode, value) {
  var v = (value != null) ? value : this.getData().value;
  if (mode == null || mode == "SQL" || (! this.textTranslation))
    return this.parent(TagSimpleSet, "getValue")(mode, value);
  else return this.textTranslation[v] || v;
};

/********************************************************************/

/**
 * The third simplest possible tag, the any-phrase tag.
 * <p>
 * This tag implements simple many-word consumer: it accepts any sequence of 
 * word.
 */
TagAnyPhrase = function (SQLname, names, forceQuotes, min, max) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.min = min || 1;
  this.max = max || Number.POSITIVE_INFINITY;
  this.forceQuotes = forceQuotes;
  this.multiwords = true;
};

classExtend(TagAnyPhrase, Tag);

TagAnyPhrase.prototype.reset =
  function (keepData) {
    this.parent(Tag, "reset")(keepData);
    this.setValue(true);
  };

TagAnyPhrase.prototype.verify = 
  function (tokens) {
    var l = tokens.length;
    if (l <= 1 || (! this.forceQuotes)) 
      return this.parent(Tag, "verify")(tokens);
    else {
      this.clearErrors();
      this.addError(tokens[0].pos3, tokens[0].value, "missing quotes");
      return [false, false];
    }
  };

TagAnyPhrase.prototype.match =
  /**
   * Verifies that the list of words is composed by a single word, and accept
   * it.
   */
  function(words) {
    var l = words.length;
    if (l >= this.min && l <= this.max) {
      this.setValue(words.join(" "));
      return [true, l < this.max];
    }
    if (l < this.max) {
      if (l > 0) this.setValue(words.join(" "));
      else this.setValue(null);
      return [false, true];
    } else {
      this.addErrorMatch(this.max, words[this.max], "unexpected word");
      return [false, false];
    }
  };

/********************************************************************/

/**
 * A tag to match multiple words from a set of allowed values.
 * <p>
 * This tag implements a set-based verifier for tags whose
 * values are composed by multiple words.  The words are accepted if they
 * all belongs to the same group; globbing can be also used.  The order used to
 * enter the words does not matter (cf. TagPhrase instead).
 * <p>
 * Note that the verifier associated with this class is incremental: multiple
 * calls with increasingly longer sets of words will use the previous result and
 * be thus significantly faster.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param values   An array with the allowed groups.  A group is an array of
 *                 string words, so values is an array of arrays of single words.
 * @param matchAll If true then all words in a group must be present in order to
 *                 consider a tag complete
 * @param noglob   If true then globbing in the values is disabled.
 */
TagSet = function (SQLname, names, values, matchAll, noglob) {
  this.values = values.map(function (v) { return v.split(/[ \t\n\r]+/); });
  this.parent(Tag, "constructor")(SQLname, names);
  this.matchAll = matchAll;
  this.noglob = noglob;
  this.forceable = true;
  this.multiwords = true;
};

classExtend(TagSet, Tag);

TagSet.prototype.reset =
  /**
   * Resets the status of the tag.  This is called automatically by the
   * constructor and by the verifier, as needed.
   */
  function (keepData) {
    this.parent(Tag, "reset")(keepData);
    this.lastvalues = this.values;
    this.lastwords = [];
    this.lastpresent = [];
    for (var n=0; n<this.values.length; n++) this.lastpresent[n] = true;
  };

TagSet.prototype.match =
  /**
   * Verifies if list of words belong to a single group within the alloed ones
   * for this tag.  Order is insignificant here.  This verifier is incremental:
   * the last query and the relevant results are saved and used in case a
   * longer query is made using the same initial words.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var l = words.length, o = 0, v, par, fin,
     ensurefirst, ensurelast, lastpresent;

    if (l == 0) {
      this.setValue(null);
      return [false, true];
    }

    if (this.lastwords.compare(words.slice(0, this.lastwords.length)))
      o = this.lastwords.length;
    else this.reset(true);
     
    for (var n=o; n<l && this.lastvalues.length > 0; n++) {
      var nlv = [], w, fn;
      v = words[n];
      if (v.length > 0 && v[0] == "^") {
	ensurefirst = true;
	v = v.slice(1);
      } else ensurefirst = false;
      if (v.length > 0 && v[v.length-1] == "$") {
	ensurelast = true;
	v = v.slice(0, v.length-1);
      } else ensurelast = false;
      if ((this.noglob) || (! v.isGlob())) {
	w = v;
	fn = "indexOf";
      } else {
	w = new RegExp("^" + v.globToRegexp() + "$");
	fn = "findFirst";
      }
      lastpresent = this.lastpresent;
      this.lastvalues.forEach(
	function (e, i) {
	  var idx = e[fn](w), tmp;
	  if (idx >= 0 && 
	      (ensurefirst == false || idx == 0) &&
	      (ensurelast == false || (idx == e.length-1 && lastpresent[i]))) {
	    if (idx == e.length-1) lastpresent[i] = false;
	    tmp = e.slice();
	    tmp.splice(idx, 1);
	    nlv.push(tmp);
	  }
	});
      this.lastpresent = lastpresent;
      this.lastvalues = nlv;
    }
 
    this.lastwords = words.slice();

    if (this.matchAll)
      fin = this.lastvalues.filter(function (e) { return e.length == 0; });
    else
      fin = this.lastvalues;
    par = this.lastvalues.filter(function (e) { return e.length > 0; });

    if (fin.length > 0 || par.length > 0) {
      this.setValue(words.join(" "));
      return [fin.length > 0, par.length > 0];
    } else {
      this.addErrorMatch(0, words[0], "no match with known values");
      return [false, false];
    }      
  };

TagSet.prototype.complete =
  function (words) {
    var l = words.length, o = 0, n, v, par, fin, ensurefirst, ensurelast, 
      lastpresent, lastvalues = this.values;

    if (l == 0) return [];

    lastpresent = [];
    for (n=0; n<this.values.length; n++) this.lastpresent[n] = true;

    for (n=o; n<l && this.values.length > 0; n++) {
      var nlv = [], nlw = [], w, fn;
      v = words[n];
      if (v.length > 0 && v[0] == "^") {
	ensurefirst = true;
	v = v.slice(1);
      } else ensurefirst = false;
      if (v.length > 0 && v[v.length-1] == "$") {
	ensurelast = true;
	v = v.slice(0, v.length-1);
      } else ensurelast = false;
      if ((this.noglob) || (! v.isGlob())) {
	w = v;
	fn = (n < l-1) ? "indexOf" : "findFirstPartial";
      } else {
	w = new RegExp("^" + v.globToRegexp() + ((n < l-1) ? "$" : ""));
	fn = "findFirst";
      }
      lastvalues.forEach(
	function (e, i) {
	  var idx = e[fn](w), tmp;
	  if (idx >= 0 && 
	      (ensurefirst == false || idx == 0) &&
	      (ensurelast == false || (idx == e.length-1 && lastpresent[i]))) {
	    if (idx == e.length-1) lastpresent[i] = false;
	    tmp = e.slice();
	    nlw.push(tmp.splice(idx, 1)[0]);
	    nlv.push(tmp);
	  }
	});
      lastvalues = nlv;
    }
    nlw.sort();
    return nlw.sortUnique();
  };


TagSet.prototype.getText = function (mode) {
    var name = this.getName(mode);
    if (name) {
      var d = this.getData(), v = d.value, 
        res = [], logop, w;
      if (v === null) return "";
      if (mode == "SQL") {
	w = this.getValue(mode, v).split(/[ \t\n\r]+/);
	if (w.length < 2) return this.parent(Tag, "getText")(mode);
	for (var i=0; i<w.length; i++) {
	  d.value = w[i];
	  res.push(this.parent(Tag, "getText")(mode));
	}
	d.value = v;
	if (d.op == "=") logop = ") AND ("; 
	else if (d.op == "!=") logop = ") OR (";
	else return "";
	return "(" + res.join(logop) + ")";
      } else return this.parent(Tag, "getText")(mode);
    } else return "";
};

/********************************************************************/

/**
 * A tag to match multiple words from phrases.
 * <p>
 * This tag implements a set-based verifier for tags whose
 * values are composed by multiple words.  The words are accepted if they
 * all belongs to the same group and are entered in the correct order;
 * globbing can be also used.  The order used to
 * enter the words does matter here (cf. TagSet instead).
 * <p>
 * Note that the verifier associated with this class is incremental: multiple
 * calls with increasingly longer sets of words will use the previous result and
 * be thus significantly faster.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param values   An array with the allowed groups.  A group is an array of
 *                 string words, so values is an array of arrays of single words.
 * @param matchAll If true then all words in a group must be present in order to
 *                 consider a tag complete
 * @param noglob   If true then globbing in the values is disabled.
 */
TagPhrase = function (SQLname, names, values, matchStart, matchEnd, noglob) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.values = values;
  this.matchStart = matchStart;
  this.matchEnd = matchEnd;
  this.noglob = noglob;
  this.forceable = true;
  this.multiwords = true;
};

classExtend(TagPhrase, Tag);

TagPhrase.prototype.match =
  /**
   * Verifies if list of words belong to a single group within the alloed ones
   * for this tag.  Order is insignificant here.  This verifier is incremental:
   * the last query and the relevant results are saved and used in case a
   * longer query is made using the same initial words.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var line = words.join(" "), prefix, postfix, r1, r2,
      par=false, fin=false;

    prefix = this.matchStart ? "^" : "\\b";
    postfix = this.matchEnd ? "$" : "\\b";
    if (line == "") {
      if (words.length == 0) this.setValue(null);
      else this.setValue("");
      return [false, true];
    }
    if (line.length > 0 && line[0] == "^") {
      line = line.slice(1);
      prefix = "^";
    }
    if (line.length > 0 && line[line.length-1] == "$") {
      line = line.slice(0, line.length-1);
      postfix = "$";
    } 
    if (this.noglob) line = prefix + line.escape();
    else line = prefix + line.globToRegexp();

    r1 = new RegExp(line + "\\b");
    r2 = new RegExp(line + "$");
    this.values.forEach(
      function (e) { 
	if (r1.test(e)) {
	  if (r2.test(e)) {
	    fin = true;
	    par = par || false;
	  } else {
	    fin = fin || (postfix != "$");
	    par = true;
	  }
	}
      });

    if (fin || par) this.setValue(words.join(" "));
    if (fin == false && par == false) 
      this.addErrorMatch(0, words[0], "no match with known values");
    return [fin, par];
  };

TagPhrase.prototype.complete =
  function (words) {
    var line, last, prefix, postfix, r, res;

    if (words.length == 0) return [];

    prefix = this.matchStart ? "^" : "\\b";
    postfix = this.matchEnd ? "$" : "\\b";
    line = words.slice(0,-1).join(" ");
    last = words[words.length - 1];
    if (line.length > 0 && line[0] == "^") {
      line = line.slice(1);
      prefix = "^";
    } else if (words.length == 1 && last.length > 0 && last[0] == "^") {
      last = last.slice(1);
      prefix = "^";
    }
    if (this.noglob) {
      line = line.escape();
      last = last.escape();
    } else {
      line = line.globToRegexp();
      last = last.globToRegexp();
    }
    if (line.length > 0) line = line + " ";
    line = prefix + line + '(' + last;
    if (last.length == 0 || last[last.length-1] != "$") line = line + '\\S*)';
    else line = line + '\\S)';

    res = [];
    r = new RegExp(line);
    this.values.forEach(
      function (e) {
	var m = e.match(r);
	if (m) res.push(m[1]);
      });
    res.sort();
    return res.sortUnique();
  };


TagPhrase.prototype.getText = function (mode) {
  var name = this.getName(mode);
  if (name) {
    var d = this.getData(), v = d.value, w = v, res;
    if (v === null) return "";
    if (mode == "SQL") {
      if (this.noglob) v = v.escape();
      // if (this.matchStart && v[0] != "^") v = "^" + v;
      // if (this.matchEnd && (v.length == 0 || v[v.length-1] != "$")) v += "$";
      d.value = v;
      res = this.parent(Tag, "getText")(mode);
      d.value = w;
      return res;
    } else return this.parent(Tag, "getText")(mode);
  } else return "";
};

/********************************************************************/

/**
 * A tag to match multiple words in different orders.
 * <p>
 * This tag implements a set-based verifier for tags whose
 * values are composed by multiple words.  The words are accepted if they
 * all belongs to the same group and are entered in one of the allowed 
 * orders;  globbing can be also used.  The order used to enter the
 * words does matter here for the input (cf. TagSet instead); however, in
 * contrast with TagPhrase, the generated output (SQL in particular) depends
 * on the original order only.
 * <p>
 * Note that the verifier associated with this class is incremental: multiple
 * calls with increasingly longer sets of words will use the previous result and
 * be thus significantly faster.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param values   An array with the allowed groups.  A group is an array of
 *                 string words, so values is an array of arrays of single words.
 * @param matchAll If true then all words in a group must be present in order to
 *                 consider a tag complete
 * @param noglob   If true then globbing in the values is disabled.
 */
TagPerm = function (SQLname, names, values, perms, 
		    matchStart, matchEnd, noglob) {
  var walues = [];
  this.parent(Tag, "constructor")(SQLname, names);
  this.perms = perms | [[0], [0,1], [1,0], [0,1,2], [1,2,0]];
  this.matchStart = matchStart;
  this.matchEnd = matchEnd;
  this.noglob = noglob;
  this.forceable = true;
  this.multiwords = true;
  values.forEach(
    function (e) {
      var f, i, j, p, w;
      if (typeof(e[0]) == "string") {
	f = e;
	p = this.perms;
      } else {
	f = e[0];
	p = e[1];
      }
      for (i=0; i<p.length; i++) {
	w = [];
	for (j=0; j<p[i].length; j++)
	  w.push(f[p[i][j]]);
	walues.push([w.join(" "), f.length, p[i]]);
      }
    });
  this.values = walues;
};

classExtend(TagPerm, Tag);

TagPerm.prototype.match =
  /**
   * Verifies if list of words belong to a single group within the alloed ones
   * for this tag.  Order is insignificant here.  This verifier is incremental:
   * the last query and the relevant results are saved and used in case a
   * longer query is made using the same initial words.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    var line = words.join(" "), prefix, postfix, r1, r2,
      par=[], fin=[], len = line.length;

    prefix = this.matchStart;
    postfix = this.matchEnd;
    if (line == "") {
      if (words.length == 0) this.setValue(null);
      else this.setValue("");
      return [false, true];
    }
    if (len > 0 && line[0] == "^") {
      line = line.slice(1);
      prefix = true;
      len -= 1;
    }
    if (line.length > 0 && line[line.length-1] == "$") {
      line = line.slice(0, line.length-1);
      postfix = true;
      len -= 1;
    } 
    if (this.noglob || (! line.isGlob())) {
      this.values.forEach(
	function (e) {
	  if ((!prefix  || e[2][0] == 0) && 
  	      (!postfix || e[2][e[2].length-1] == e[1] - 1)) {
	    if (e[0] == line) {
	      fin.push([e[1], e[2]]);
	    } else if ((e[0].slice(0, len) == line) &&
		       (" ,;:.!$/".indexOf(e[0][len]) >= 0)) {
	      par.push([e[1], e[2]]);
	    }
	  }
	});
    } else {
      line = "^" + line.globToRegexp();
      r1 = new RegExp(line + "\\b");
      r2 = new RegExp(line + "$");
      this.values.forEach(
	function (e) {
	  if ((!prefix  || e[2][0] == 0) && 
	      (!postfix || e[2][e[2].length-1] == e[1] - 1)) {
	    if (r1.test(e[0])) {
	      if (r2.test(e[0])) {
		fin.push([e[1], e[2]]);
	      } else {
		par.push([e[1], e[2]]);
	      }
	    }
	  }
	});
    }

    if (fin.length > 0)
      this.setValue([words, fin]);
    else if (par.length > 0)
      this.setValue([words, par]);
    else
      this.addErrorMatch(0, words[0], "no match with known values");
    return [fin.length > 0, par.length > 0];
  };

TagPerm.prototype.complete =
  function (words) {
    var line, last, prefix, postfix, r, res;

    if (words.length == 0) return [];

    prefix = this.matchStart;
    postfix = this.matchEnd;
    line = words.slice(0,-1).join(" ");
    last = words[words.length - 1];
    if (line.length > 0 && line[0] == "^") {
      line = line.slice(1);
      prefix = true;
    }
    if (line.length > 0 && line[line.length-1] == "$") {
      line = line.slice(0, line.length-1);
      postfix = true;
    } 
    if (this.noglob) {
      line = line.escape();
      last = last.escape();
    } else {
      line = line.globToRegexp();
      last = last.globToRegexp();
    }
    if (line.length > 0) line = line + " ";
    line = "^" + line + '(' + last;
    if (last.length == 0 || last[last.length-1] != "$") line = line + '\\S*)';
    else line = line + '\\S)';

    res = [];
    r = new RegExp(line);
    this.values.forEach(
      function (e) {
	if ((!prefix  || e[2][0] == 0) && 
	    (!postfix || e[2][e[2].length-1] == e[1] - 1)) {
	  var m = e[0].match(r);
	  if (m) res.push(m[1]);
	}
      });
    res.sort();
    return res.sortUnique();
  };

TagPerm.prototype.getDataCopy = 
  function() {
    var d = this.getData(), v = d.value;
    if (typeof(v) == "string")
      return this.parent(Tag, "getDataCopy")();
    else {
      var v1 = v[1], w = [], w1 = [], i, j;
      w.push(v[0].slice());
      for (i=0; i<v1.length; i++) 
	w1.push([v1[i][0], v1[i][1].slice()]);
      w.push(w1);
      return new DataTag(d.tag, d.op, w, d.errors);  
    }
  };

TagPerm.prototype.getText = 
  function (mode) {
    var name = this.getName(mode);
    if (name) {
      var d = this.getData(), v = d.value, res, n;
      if (v === null) return "";
      if (mode == "SQL") {
	if (typeof(v) == "string") {
	  if (this.noglob) d.value = d.value.escape();
	  res = this.parent(Tag, "getText")(mode);
	  d.value = v;
	  return res;
	} else {
	  var w, ws;
	  res = [];
	  for (w=0; w<v[1].length; w++) {
	    ws = [];
	    for (n=0; n<v[1][w][0]; n++) ws[n] = "*";
	    for (n=0; n<v[1][w][1].length; n++) 
	      ws[v[1][w][1][n]] = (this.noglob) ? v[0][n].escape() : v[0][n];
	    d.value = ws.join(" ");
	    if (d.value[0] != "^") d.value = "^" + d.value;
	    if (d.value.slice(-1) != "$") d.value = d.value + "$";
	    res.push(this.parent(Tag, "getText")(mode));
	  }
	  d.value = v;
	  if (res.length == 1) return res[0];
	  else return "(" + res.join(" or ") + ")";
	}
	// if (this.matchStart && v[0] != "^") v = "^" + v;
	// if (this.matchEnd && (v.length == 0 || v[v.length-1] != "$")) v += "$";
      } else {
	if (typeof(v) == "string") 
	  return this.parent(Tag, "getText")(mode);
	d = this.getDataCopy();
	this.setValue(d.value[0].join(" "));
	res = this.parent(Tag, "getText")(mode);
	this.setValue(d.value);
	return res;
      }
    } else return "";
  };

/********************************************************************/

/**
 * A tag to parse target names.
 * <p>
 * This tag recognizes taget names using a simple scheme.  It scans for
 * words, and stop as soon as one word is a possible starting word for another
 * token.  This is implemented by always returning [true, true] in the verifier
 * unless a new possible word start is found.  This method, clearly, requires
 * that this tags knows about all other possible tags.
 *
 * @param SQLname The name of the database column to use for the SQL
 *                translation
 * @param names   A list of accepted tag names
 * @param tags    An array with all possible alternative tags, used to stop the
 *                match
 */
TagTarget = function (SQLname, names, tags) {
  this.parent(Tag, "constructor")(SQLname, names);
  this.tags = [];
  for (var t=2; t<arguments.length; t++) {
    if (arguments[t] instanceof Array) 
      this.tags = this.tags.concat(arguments[t]);
    else
      this.tags.push(arguments[t]);
  }
  this.multiwords = true;
  this.forceable = true;
  this.target = true;
};

classExtend(TagTarget, Tag);

TagTarget.prototype.colorCodes = {
  "tag": "9932CC",
  "op": "000000",
  "value": "2E8B57",
  "quote": "0000FF",
  "warning": "FF8800",
  "error": "FF0000",
  "ok": "2E8B57"
  };


TagTarget.prototype.verify =
  function (tokens) {
    var len = tokens.length, res;
    if (len == 0) return [false, true];
    res = this.parent(Tag, "verify")(tokens);
    if (res[0]) {
      newtokens = tokens.slice(len-1);
      for (var t=0; t<this.tags.length; t++) {
	var tmp = this.tags[t].verify(newtokens);
	if (tmp[0] || tmp[1]) return [false, false];
      }
      return [true, true];
    } else return res;
  };

TagTarget.prototype.complete =
  function (words) {
    var res = [], k, phrase = words.join(" "), l=phrase.length;
    for (k in sesameCache) {
      if (sesameCache[k][2] == 0) continue;
      if (k.slice(0, l) == phrase) {
	var start = phrase.lastIndexOf(" "), end = k.indexOf(" ", l);
	if (end < 0) end = k.length;
	res.push(k.slice(start + 1, end));
      }
    }
    return res;
  };

TagTarget.prototype.resolve = 
  function (name, fix) {
    var n = (name != null) ? name : this.getData().value, res;
    res = sesameResolver(n.unEscape(),sesameUpdater);
    return res;
  };

TagTarget.prototype.getValue = 
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value;
    if (mode == null) return v;
    else return v.toString();
  };

TagTarget.prototype.getTitleAndLink = 
  function(coords) {
    var title='';
    var link='';
    if (coords[3]) {
      title += "<b>Resolver</b><br> ";
      if (coords[3] == "S") {
        title += "SIMBAD";
        if (coords[4]) title += "<br><br><b>Object type</b><br> " + 
	  (simbad_class[coords[4]] || coords[4]);
        link = 'http://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&Ident=';
      } else if (coords[3] == "N") {
        title += "NED";
        if (coords[4]) title += "<br><br><b>Object type</b><br> " + 
	  (ned_class[coords[4]] || coords[4]);
        link = 'http://nedwww.ipac.caltech.edu/cgi-bin/nph-objsearch?extend=no&objname=';
      } else if (coords[3] == "V") title += "VizieR";
      else title += coords[3];
      if (link) link += encodeURIComponent(this.getValue());
    }
    title += "<br><br>";
    return [title, link];
  };
        
TagTarget.prototype.getText =
  function (mode) {
    var res = this.parent(Tag, "getText")(mode);
    if (mode == "HTML") {
      var coords = this.resolve();
      if (coords[2] == -1) 
	res += this.colorize("[resolving...]", "warning");
      else if (coords[2] == 0) 
        res += this.colorize("[unresolved]", "error");
      else {
	var info1, info2, info3;
	if (coords[2] > 1) {
          info1 = this.colorize("[ok,ambiguous", "warning");
          info2 = "";
          info3 = this.colorize("]", "warning");
	} else if (coords[4]) {
  	  info1 = this.colorize("[ok,", "ok");
          info2 = '<font color="blue">' + coords[4] + "</font>";
          info3 = this.colorize("]","ok");
	} else {
	  info1 = this.colorize("[ok", "ok");
          info2 = "";
          info3 = this.colorize("]", "ok");
        }  
        var titleandlink = this.getTitleAndLink(coords);
	res += info1+'<a href="' + titleandlink[1] + '" onmouseover="Tip(' + "'"+titleandlink[0] + "'"+ ", TITLE, 'Target name resolution'" + ' );" onmouseout="UnTip();">' + info2 + '</a>' + info3;
      }
    }
    return res;
  };    


/********************************************************************/

/**
 * An abstract meta-tag class.
 *
 * Meta tags are tags that modify the behaviour of other tags.  This class
 * implements a simple meta-tag based on a single tag.  This is useful to
 * override the getValue method, which needs to use the tag's getValue.
 *
 * @param tag  The tag upon which the meta-tag is based
 */
TagMeta = function(tag) {
  this.metatag = tag;
  this.parent(Tag, "constructor")(tag.SQLname, tag.names);
  this.operators = tag.operators;
  this.acceptminus = tag.acceptminus;
};

classExtend(TagMeta, Tag);

TagMeta.prototype.reset = function (keepData) {
  this.metatag.reset(keepData);
};

TagMeta.prototype.verify = function (tokens) {
  return this.metatag.verify(tokens);
};

TagMeta.prototype.match = function (words) {
  this.metatag.matchpos = this.matchpos;
  return this.metatag.match(words);
};

TagMeta.prototype.complete = function (words) {
  return this.metatag.complete(words);
};

TagMeta.prototype.getName = function (mode) {
  return this.metatag.getName(mode);
};

TagMeta.prototype.getData = function () {
  return this.metatag.getData();
};

TagMeta.prototype.getDataCopy = function (data) {
  return this.metatag.getDataCopy(data);
};

TagMeta.prototype.setData = function (data) {
  this.metatag.setData(data);
};

TagMeta.prototype.getText = function(mode) {
  return this.metatag.getText(mode);
};

/********************************************************************/

/**
 * An meta-tag implementing tags for which tag specifications are compulsory.
 * <p>
 * This meta-tag modifies the tag verifier to force the use of tag
 * specifications or to prohibit it.
 *
 * @param tag       The tag to modify
 * @param forceTag  If true, the tag specification is enforced; if false, it is
 *                  prohibited; otherwise, it is optional
 * @param forceOp   If true, the operator specification is enforced; if false,
 *                  it is prohibited; otherwise, it is optional
 */
TagForceTag = function(tag, forceTag, forceOp) {
  this.parent(TagMeta, "constructor")(tag);
  this.forceTag = (forceTag === true || forceTag === false) ? forceTag :
    "optional";
  this.forceOp  = (forceOp  === true || forceOp  === false) ? forceOp  :
    "optional";
};

classExtend(TagForceTag, TagMeta);

TagForceTag.prototype.verify =
  /**
   * Verifies if list of token is entered with a tag specification.
   *
   * @param tokens A list of strings or objects in the format
   *              {tag: "...", op: "...", value: "..."}.  If strings are used
   *              then both tag and op are taken to be "".
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (tokens) {
    var tag = "", op = "";
    if (tokens.length == 0 || 
	(tokens.length == 1 && (tokens[0].value == ""))) 
      return this.parent(TagMeta, "verify")(tokens);
    this.clearErrors();
    if (tokens.length > 0) {
      tag = tokens[0].tag;
      op  = tokens[0].op;
    }
    if (this.forceTag === false && tag) {
      this.addError(tokens[0].pos1, tag, "keyword not allowed");
      return [false, false];
    }
    if (this.forceTag === true  && (! tag)) {
      this.addError(tokens[0].pos1, "", "missing compulsory keyword");
      return [false, false];
    }
    if (this.forceOp  === false && op) {
      this.addError(tokens[0].pos2, op, "operator not allowed");
      return [false, false];
    }
    if (this.forceOp  === true  && (! op)) {
      this.addError(tokens[0].pos2, "", "missing compuslory operator");
      return [false, false];
    }
    return this.parent(TagMeta, "verify")(tokens);
  };

TagForceTag.prototype.autocomp =
  function (tokens) {
    var tag = "", op = "";
    if (tokens.length == 0 || 
	(tokens.length == 1 && (tokens[0].value == ""))) 
      return this.parent(TagMeta, "autocomp")(tokens);
    if (tokens.length > 0) {
      tag = tokens[0].tag;
      op  = tokens[0].op;
    }
    if (this.forceTag === false && tag) return [];
    if (this.forceTag === true  && (! tag)) return [];
    if (this.forceOp  === false && op) return [];
    if (this.forceOp  === true  && (! op)) return [];
    return this.parent(TagMeta, "autocomp")(tokens);
  };

/********************************************************************/

/**
 * An meta-tag implementing optional tags.
 * <p>
 * This meta-tag allows one to implement optional tags, i.e. tags that can
 * be present or absent.  Note that
 * <p>
 * <code>
 * t1 = new TagOptional(t0);
 * </code>
 * <p>
 * is totally equivalent to
 * <p>
 * <code>
 * t1 = new TagXor(new TagNull(), t0);
 * </code>
 *
 * @param tag      The optional tag
 * @param defValue The default value it will take
 */
TagOptional = function(tag, defValue) {
  this.parent(TagMeta, "constructor")(tag);
  this.present = false;
  this.defValue = defValue;
};

classExtend(TagOptional, TagMeta);

TagOptional.prototype.verify =
  /**
   * Verifies if list of words are possible optional tags.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (tokens) {
    this.clearErrors();
    this.present = (tokens.length > 0);
    if (this.present) return this.metatag.verify(tokens);
    else return [true, true];
  };

TagOptional.prototype.match =
  /**
   * Verifies if list of words are possible optional tags.
   *
   * @param words An array with the provided words to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (words) {
    this.present = (words.length > 0);
    this.metatag.matchpos = this.matchpos;
    if (this.present) return this.metatag.match(words);
    else return [true, true];
  };

TagOptional.prototype.getData =
  function () {
    if (! this.present) 
      this.metatag.setData(new DataTag("", "=", this.defValue));
    return this.metatag.getData();
  };

TagOptional.prototype.getDataCopy =
  function () {
    if (! this.present) 
      this.metatag.setData(new DataTag("", "=", this.defValue));
    return this.metatag.getDataCopy();
  };

/********************************************************************/

/**
 * A meta-tag implementing ranges.
 * <p>
 * This meta-tag allows one to implement ranges, i.e. values in the format
 * min..max, min.., or ..max.
 *
 * @param tag The basic tag for the range
 * @param periodic If true, the quantity is periodic (such as RA)
 * @param date If true, the range is for dates
 */
TagRange = function(tag, periodic, date) {
  this.metatag = tag;
  this.parent(Tag, "constructor")(tag.SQLname, tag.names);
  this.periodic = periodic;
  this.date = date;
  this.operators = tag.operators;
  this.acceptminus = tag.acceptminus;
  tag.acceptminus = false;
};

classExtend(TagRange, Tag);

TagRange.prototype.colorCodes = {
  "tag": "9932CC",
  "op": "000000",
  "value": "4682B4",
  "range": "000000"
};

TagRange.prototype.reset = function (keepData) {
  this.metatag.reset(keepData);
  if (! keepData) this.data = new DataTag("", "", [null, null]);
};

TagRange.prototype.verify =
  /**
   * Verifies if list of token is entered with a tag specification.
   *
   * @param tokens A list of strings or objects in the format
   *              {tag: "...", op: "...", value: "..."}.  If strings are used
   *              then both tag and op are taken to be "".
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (tokens) {
    this.clearErrors();
    if (tokens.length != 1) {
      if (tokens.length == 0) return this.parent(Tag, "verify")(tokens);
      else {
	this.addError(tokens[1].pos3, tokens[1].value, "unexpected word");
	return [false, false];
      }
    }
    if ((tokens[0].op != "" && tokens[0].op != '=' && tokens[0].op != '!=') &&
        (tokens[0].value.indexOf("..") >= 0)) {
      this.addError(tokens[0].pos3, tokens[0].value, "range used with < or >");
      return [false, false];
    }
    return this.parent(Tag, "verify")(tokens);
  };

TagRange.prototype.match =
  function (words) {
    var p, res1, res2, d0 = this.getData(), d1, d2, nterms = 0;
    this.metatag.matchpos = this.matchpos;
    if (words.length != 1) {
      if (words.length == 0) return [false, true];
      else {
	this.addErrorMatch(1, words[1], "unexpected word");
	return [false, false];
      }
    }
    p = words[0].indexOf("..");
    if (p < 0) {
      res1 = this.metatag.verify([new Token(d0.tag, d0.op, words[0], 
					    this.matchpos[0], this.matchpos[0], 
					    this.matchpos[0])]);
      d1 = this.metatag.getData();
      if (res1[0]) 
        this.setData(new DataTag(d1.tag, d1.op, [d1.value, d1.value], 
				 d1.errors));
      else this.setErrors(d1.errors);
      return res1;
    } else {
      if (p > 0) {
        var word1 = words[0].slice(0, p);
        res1 = this.metatag.verify([new Token(d0.tag, d0.op, word1,
					      this.matchpos[0], 
					      this.matchpos[0], 
					      this.matchpos[0])]);
        if (res1[0]) d1 = this.metatag.getDataCopy();
	else if (!res1[1]) this.setErrors(this.metatag.getErrors());
	nterms++;
      } else {
        d1 = new DataTag("", "", null);
        res1 = [true, true];
      }
      if (p < words[0].length - 2) {
        var word2 = words[0].slice(p+2);
        res2 = this.metatag.verify([new Token(d0.tag, d0.op, word2, 
					      p + 2 + this.matchpos[0], 
					      p + 2 + this.matchpos[0], 
					      p + 2 + this.matchpos[0])]);
        if (res2[0]) d2 = this.metatag.getDataCopy();
	else if (!res2[1] && this.getErrors().length == 0) 
	  this.setErrors(this.metatag.getErrors());
	nterms++;
      } else {
        d2 = new DataTag("", "", null);
        res2 = [true, true];
      }
      if (nterms == 0) {
	this.addErrorMatch(0, words[0], "range with both bounds missing");
	return [false, false];
      }
      if (res1[0] && res2[0])
        this.setData(new DataTag(d0.tag, d0.op, [d1.value, d2.value],
				 d1.errors.concat(d2.errors)));
      return [res1[0] && res2[0], res1[1] && res2[1]];  
    }
  };

TagRange.prototype.complete = 
  function (words) {
    if (words.length == 1) {
	var p = words[0].indexOf("..");
      if (p >= 0) 
	return this.metatag.complete([words[0].slice(p+2)]);
    }
    return this.metatag.complete(words);
  };

TagRange.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value;
    if (mode == null) return v;
    else return null;
  };

TagRange.prototype.getText =
  function (mode) {
    var SQLname = this.getName("SQL");
    if (SQLname) {
      var d = this.getData(), min = d.value[0], max = d.value[1],
        s = this.getName(mode), op = d.op;
      if (min == null && max == null) {
	if (mode == "HTML") {
	  if (d.tag || op) 
	    return this.colorize(s, "tag") + this.colorize(op, "op");
	  else return "";
	} else if (mode == "SQL") return "";
	else {
	  if (d.tag || op) return s + op;
	  else return "";
	}
      }
      if (mode == "SQL" && op == "!=") op = "<>";
      if (min == max) {
	if (this.date && mode == "SQL") s = this.metatag.getText(mode, min);
	else {			// @@@ NEEDED?
	  min = this.metatag.getValue(mode, min);
	  if (mode == "HTML") 
	    s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	        this.colorize(min, "value");
	  else s += op + min;
	}
      } else {
        if (min != null) min = this.metatag.getValue(mode, min);
        if (max != null) 
	  if (this.date && mode == "SQL") 
	    max = this.metatag.getValueTomorrow(mode, max);
  	  else 
            max = this.metatag.getValue(mode, max);
        if (min != null && max != null) {
          if (mode == "SQL") {
	    if (this.periodic && parseFloat(min) > parseFloat(max)) 
	      s = "NOT (" + s + " BETWEEN " + max + " AND " + min + ")";
	    else
              s += " BETWEEN " + min + " AND " + max;
            if (d.op == "!=") s = "NOT (" + s + ")";
          } else if (mode == "HTML") {
	    s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	      this.colorize(min, "value") + this.colorize("..", "range") + 
	      this.colorize(max, "value");
	  } else s += op + min + ".." + max;
        } else {
	  if (d.op != "!=") op = (min != null) ? ">=" : "<=";
	  else op = (min != null) ? "<" : ">";
	  if (mode == "HTML") {
	    s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	      this.colorize((min != null) ? min : max, "value");
	  } else s += op + ((min != null) ? min : max);
        }
      }
      return s;
    } else return "";
  };


/********************************************************************/

/**
 * A meta-tag implementing special (spectral) ranges.
 * <p>
 * This meta-tag allows one to implement ranges, i.e. values in the format
 * min..max, min.., or ..max.
 *
 * @param tag The basic tag for the range
 */
TagSpecRange = function(SQLname1, SQLname2, tag, filters) {
  this.metatag = tag;
  this.parent(Tag, "constructor")(tag.SQLname, tag.names);
  this.SQLname1 = SQLname1;
  this.SQLname2 = SQLname2;
  this.filters = filters;
  this.operators = tag.operators;
  this.acceptminus = tag.acceptminus;
};

classExtend(TagSpecRange, TagRange);

TagSpecRange.prototype.match = 
  function (words) {
    if (words.length == 1 && this.filters) {
      if (words[0] in this.filters) 
	return this.parent(TagRange, "match")([this.filters[words[0]]]);
    }
    return this.parent(TagRange, "match")(words);
  };

TagSpecRange.prototype.complete = 
  function (words) {
    if (words.length == 1) {
      var p = words[0].indexOf(".."), len = words[0].length, res;
      if (p >= 0) 
	return this.metatag.complete([words[0].slice(p+2)]);
      res = this.metatag.complete(words);
      for (var filter in this.filters) 
	if (filter.slice(0, len) == words[0]) res.push(filter);
      return res;
    }
    return [];
  };

TagSpecRange.prototype.getText =
  function(mode) {
    var SQLname1 = this.SQLname1, SQLname2 = this.SQLname2;
    if (SQLname1 && SQLname2) {
      var d = this.getData(), min = d.value[0], max = d.value[1],
        s = this.getName(mode), op = d.op;
      if (min == null && max == null) {
	if (mode == "HTML") {
	  if (d.tag || op) 
	    return this.colorize(s, "tag") + this.colorize(op, "op");
	  else return "";
	} else if (mode == "SQL") return "";
	else {
	  if (d.tag || op) return s + op;
	  else return "";
	}
      }
      if (min == max) {
	min = this.metatag.getValue(mode, min);
	if (mode == "HTML") 
	  s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	      this.colorize(min, "value");
	else if (mode == "SQL") 
	  s = "(" + SQLname1 + "<=" + min + " and " + 
	      SQLname2 + ">=" + min + ")";
	else s += op + min;
      } else {
        if (min != null) min = this.metatag.getValue(mode, min);
        if (max != null) max = this.metatag.getValue(mode, max);
        if (min != null && max != null) {
          if (mode == "SQL") {
	    if (parseFloat(min) > parseFloat(max)) {
	      var tmp = min;
	      min = max;
	      max = tmp;
	    }
	    s = SQLname1 + "<=" + max + " and " + SQLname2 + ">=" + min;
            if (d.op == "!=") s = "NOT (" + s + ")";
          } else if (mode == "HTML") {
	    s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	      this.colorize(min, "value") + this.colorize("..", "range") + 
	      this.colorize(max, "value");
	  } else s += op + min + ".." + max;
        } else {
	  if (d.op != "!=") op = (min != null) ? ">=" : "<=";
	  else op = (min != null) ? "<" : ">";
	  if (mode == "HTML") {
	    s = this.colorize(s, "tag") + this.colorize(op, "op") + 
	      this.colorize((min != null) ? min : max, "value");
	  } else s += op + ((min != null) ? min : max);
        }
      }
      return s;
    } else return "";
  };


/********************************************************************/

/**
 * An abstract meta-tag class.
 *
 * Meta tags are tags that modify the behaviour of other tags.  This class
 * implements a simple meta-tag based on a single tag.  This is useful to
 * override the getValue method, which needs to use the tag's getValue.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags  The tag upon which the meta-tag is based
 */
TagMultiMeta = function(SQLname, names, tags) {
  if (SQLname) this.verifier = "match";
  else this.verifier = "verify";
  this.metatags = [];
  for (var t=2; t<arguments.length; t++) {
    if (arguments[t] instanceof Array)
      this.metatags = this.metatags.concat(arguments[t].slice());
    else
      this.metatags.push(arguments[t]);
  }
  this.parent(Tag, "constructor")(SQLname, names);
  this.multiwords = true;
};

classExtend(TagMultiMeta, Tag);

TagMultiMeta.prototype.colorCodes = {
  "logop": "BC8F8F",
  "(": "000000",
  ")": "000000"
};

TagMultiMeta.prototype.reset = function (keepData) {
  this.parent(Tag, "reset")(keepData);
  for (var t=0; t<this.metatags.length; t++) this.metatags[t].reset(keepData);
  this.lasttag = 0;
  this.lastobjs = [];
  this.lastvalues = [];
  this.lastfinpos = null;
  this.lastfindata = null;
  this.lastpardata = null;
  this.lasterrors = [];
  this.lastres = [false, true];
  this.w0 = this.w1 = 0;
};

TagMultiMeta.prototype.verify =
  function (tokens) {
    if (this.SQLname) return this.parent(Tag, "verify")(tokens);
    else {
      if (tokens.length > 0)
        this.setData(new DataTag(tokens[0].tag, tokens[0].op || "=", ""));
      else
        this.setData(new DataTag());
      return this.match(tokens);
    }
  };

TagMultiMeta.prototype.match =
  function (objs) {
    var res, l, value, metatag;
    var lastflag, lastfinpos, lastfindata, lastpardata, lastvalues, 
      w0, w1, lasttag, lastres, lasterrors;
    
    l = this.lastobjs.length;
    if (! this.lastobjs.compare(objs.slice(0, l))) this.reset(true);
    else if (this.w1 > this.w0) this.w1--;
    this.lastobjs = objs.slice();

    lastflag    = true;
    lastfinpos  = this.lastfinpos;
    lastfindata = this.lastfindata;
    lastpardata = this.lastpardata;
    lastvalues  = this.lastvalues.slice();
    lasttag     = this.lasttag;
    w0          = this.w0;
    w1          = this.w1;
    lastres     = this.lastres;
    lasterrors  = this.lasterrors;
    metatag = this.nextMetatag(lasttag, lastvalues);

    while (true) {
      if (metatag && w1 <= objs.length) {
	res = metatag[this.verifier](objs.slice(w0, w1));
	if (res[0] || w1 > w0) lastres = res;
      } else {
	res = [false, false];
	if (lastflag) {
	  lastflag = false;
	  this.lastfinpos  = lastfinpos;
	  this.lastfindata = lastfindata;
	  this.lastpardata = lastpardata;
	  this.lastvalues  = lastvalues.slice();
	  this.w0          = w0;
	  this.w1          = w1;
	  this.lasttag     = lasttag;
	  this.lastres     = lastres;
	  this.lasterrors  = lasterrors;
	}
      }
      if (res[0]) {
        lastfinpos = [w0, w1];
        lastfindata = [metatag, metatag.getDataCopy()];
      } else if (res[1] && w1 > w0) {
	lastpardata = [metatag, metatag.getDataCopy()];
      }
      if (! res[1]) {
        if (lastfinpos) {
	  lastvalues[lasttag] = lastfindata;
          lasttag++;
          w0 = w1 = lastfinpos[1];
          lastfinpos = null;
	  lastfindata = lastpardata = null;
	  this.lasterrors = [];
	  metatag = this.nextMetatag(lasttag, lastvalues);
          continue;
        } else {
	  if (lastres[0] || lastres[1]) {
	    lastvalues[lasttag] = lastpardata;
	  } else {
	    if (lastflag) 
	      lasterrors = lasterrors.concatUnique(metatag.getErrors());
	    this.lasterrors = lasterrors;
	    if (this.lasterrors.length == 1) 
	      this.addError(this.lasterrors[0][0], this.lasterrors[0][1],
			    this.lasterrors[0][2]);
	    else if (this.lasterrors.length > 1) {
	      if (this.verifier == "verify") 
		this.addError(objs[0].pos3, objs[0].value,
			      "value does not match any keyword");
	      else
		this.addErrorMatch(0, words[0],
				   "value does not match any keyword");
	    }
	    return [false, false];
	  }
	}
      } 
      w1++;
      if (w1 > objs.length + 1) break;
    }
    if (w1 - w0 > 2 && (! lastres[1])) {
      this.addError("unexpected value");
      return [false, false];
    }
    if (lastvalues.length > 0 && lastvalues[lastvalues.length-1] == null)
      lastvalues.pop();
    this.setValue(lastvalues);
    if (this.lasterrors.length > 0) {
      if (this.lasterrors.length == 1) 
	this.addError(this.lasterrors[0][0], this.lasterrors[0][1],
		      this.lasterrors[0][2]);
      else if (this.lasterrors.length > 1) {
	if (this.verifier == "verify") 
	  this.addError(objs[0].pos3, objs[0].value,
			"value does not match any keyword");
	else
	  this.addErrorMatch(0, words[0],
			     "value does not match any keyword");
      }
    }
    return this.checkMetatags(lasttag, lastvalues, lastres);
  };

TagMultiMeta.prototype.autocomp = 
  function (tokens) {
    var data, res, metatag;
    if (tokens.length == 0) return [];
    data = this.getDataCopy();
    this.verify(tokens.slice(0, -1));
    metatag = this.nextMetatag(this.lasttag, this.lastvalues);
    res = metatag.autocomp(tokens.slice(this.w0));
    if (this.lastfinpos) {
      metatag = this.nextMetatag(this.lasttag + 1, this.lastvalues);
      res = res.concat(metatag.autocomp(tokens.slice(this.lastfinpos[1])));
      res.sort();
      res = res.sortUnique();
    }
    this.setData(data);
    return res;
  };

TagMultiMeta.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value;
    if (mode == null) return v; 
    else return null; 		// @@@
  };

TagMultiMeta.prototype.getText =
  function (mode) {
    if (this.SQLname) return this.parent(Tag, "getText")(mode);
    else {
      var obj = {}, res = [], v = this.getValue(), s_or, s_and, s_open, s_close;
      if (mode == "HTML") {
	s_or  = " " + this.colorize("or" , "logop") + " ";
	s_and = " " + this.colorize("and", "logop") + " ";
	s_open  = this.colorize("(", "(");
	s_close = this.colorize(")", ")");
      } else {
	s_or  = " or ";
	s_and = " and ";
	s_open  = "(";
	s_close = ")";
      }
      for (var i=0; i<v.length; i++) {
        var metatag = v[i][0], oldData = metatag.getData();
        metatag.setData(v[i][1]);
        var name = metatag.getName(mode), 
          text = metatag.getText(mode);
        if (! text) {
          metatag.setData(oldData);
          continue;
        }
        if (v[i][1].op != '=') obj[i] = [text];
        else {
          if (obj[name]) obj[name].push(text);
          else obj[name] = [text];
        }
        metatag.setData(oldData);
      }
      for (var k in obj) {
        if (obj[k].length > 1) res.push(s_open + obj[k].join(s_or) + s_close);
        else res.push(obj[k][0]);
      }
      if (res.length > 1) return s_open + res.join(s_and) + s_close;
      else return res[0];
    }
  };

TagMultiMeta.prototype.getDataCopy = 
      function () {
	var d = this.getData(), v = d.value, w;
  if (v instanceof Array) {
    w = [];
    for (var i=0; i<v.length; i++) {
      if (v[i][1] instanceof Tag) w.push([v[i][0], v[i][1].getDataCopy()]);
      else w.push([v[i][0], v[i][1]]);
    }
  } else w = v;
  return new DataTag(d.tag, d.op, w);
};

/********************************************************************/

/**
 * An meta-tag implementing a sequence of tags.
 * <p>
 * This meta-tag allows one to implement a sequence of tags.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags     An array with the list of tags.
 */
TagSeq = function(SQLname, names, tags) {
  this.parent(TagMultiMeta, "constructor").apply(this, arguments);
};

classExtend(TagSeq, TagMultiMeta);

TagSeq.prototype.nextMetatag = 
  function (tagnum, lastvalues) {
    return this.metatags[tagnum];
  };

TagSeq.prototype.checkMetatags = function (lasttag, lastvalues, lastres) {
  var complete = (lasttag == metatags.length);
  return [complete && lastres[0],
	  (!complete) || lastres[1]];
};

/********************************************************************/

/**
 * An meta-tag implementing an unordered sequence of tags.
 * <p>
 * This meta-tag allows one to implement a sequence of tags.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags     An array with the list of tags.
 */
TagUSeq = function(SQLname, names, tags) {
  this.parent(TagMultiMeta, "constructor").apply(this, arguments);
};

classExtend(TagUSeq, TagMultiMeta);

TagUSeq.prototype.usednfreeTags = function (value) {
  var v = (value != null) ? value : this.getData().value, t,
    used = [], free = [];
  for (t=0; t<this.metatags.length; t++) free.push(t);
  for (t=0; t<v.length; t++) {
    var i = v[t][1].value[0];
    used.push(free[i]);
    free.splice(i, 1);
  }
  return [used, free];
};

TagUSeq.prototype.nextMetatag = 
  function (tagnum, lastvalues) {
    var unf, tags = [], t;
    unf = this.usednfreeTags(lastvalues);
    for (t=0; t<unf[1].length; t++) 
      tags.push(this.metatags[unf[1][t]]);
    if (tags.length > 0) return new TagXor("", [], tags);
    else return null;
  };

TagUSeq.prototype.checkMetatags = function (lasttag, lastvalues, lastres) {
  var complete = (lasttag == this.metatags.length);
  return [complete && lastres[0],
	  (!complete) || lastres[1]];
};

/********************************************************************/

/**
 * An meta-tag implementing a repetion of a single tag.
 * <p>
 * This meta-tag allows one to implement a sequence of tags.
 *
 * @param SQLname   The SQL name to attach to this tag; use "" to indicate that
 *                  this multi-meta-tag should produce multiple instances using
 *                  the child tags.
 * @param names     The names recognized for this tag.
 * @param tag       The repeated tag.
 * @param min       The minimum number of repetitions allowed [0]
 * @param max       The maximum number of repetitions allowed [infinity]
 */
TagRep = function(SQLname, names, tag, min, max) {
  this.parent(TagMultiMeta, "constructor")(SQLname, names, [tag]);
  if (min) this.min = min; else this.min = 0;
  if (max) this.max = max; else this.max = Number.POSITIVE_INFINITY;
  this.stack = [];
};

classExtend(TagRep, TagMultiMeta);

TagRep.prototype.nextMetatag = 
  function (tagnum, lastvalues) {
    return (tagnum <= this.max) ? this.metatags[0] : null;
  };

TagRep.prototype.checkMetatags = function (lasttag, lastvalues, lastres) {
  var complete = (lasttag >= this.min), 
    partial = (lasttag < this.max);
  return [complete && lastres[0],
	  partial || lastres[1]];
};


/********************************************************************/

/**
 * An meta-tag implementing a special repetion for expressions.
 * <p>
 * This meta-tag allows one to implement a sequence of tags.
 *
 * @param tags      The repeated tag (joined with TagXor)
 * @param min       The minimum number of repetitions allowed [0]
 * @param max       The maximum number of repetitions allowed [infinity]
 */
TagRepExpr = function(tags, logops) {
  this.parent(TagRep, "constructor")("", [], new TagXor("", [], tags));
  this.logops = logops || ["and", "or"];
  this.min = 0;
  this.max = Number.POSITIVE_INFINITY;
};

classExtend(TagRepExpr, TagRep);

TagRepExpr.prototype.colorCodes = {
  "logop": "BC8F8F"
};

TagRepExpr.prototype.getText =
  function (mode) {
    var res = "", v = this.getValue(), phrase, text, lastText = "", 
      needOp = false;
    for (var i=0; i<v.length; i++) {
      var oldData = this.metatags[0].getData();
      this.metatags[0].setData(v[i][1]);
      phrase = this.metatags[0].getText(mode);
      if (phrase) {
	if (v[i][1].value[0] == 0) text = v[i][1].value[1].value;
	else text = "";
	if (this.logops.indexOf(text) < 0 && 
	    lastText != "(" && text != ")" && needOp) {
	  if (mode != "HTML") res += " and ";
	  else res += " " + this.colorize("and", "logop") + " ";
	  needOp = false;
	} else if (lastText != "(" && text != ")" && res != "") res += " ";
	if (this.logops.indexOf(text) >= 0) needOp = false;
	else if (text != "not" && lastText != "(" && text != ")") needOp = true;
        res += phrase;
        lastText = text;
      }
      this.metatags[0].setData(oldData);
    }
    return res;
  };

/********************************************************************/

/**
 * An meta-tag implementing multiple alternative tags.
 * <p>
 * This meta-tag simply check a list of tags, and returns a final or partial
 * if any of the tags in the list matches.  The value returned in case of
 * a final match is just an array containing all values of all tags in the list.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags     An array with the list of tags.
 */
TagOr = function(SQLname, names, tags) {
  this.parent(TagMultiMeta, "constructor").apply(this, arguments);
};

classExtend(TagOr, TagMultiMeta);

TagOr.prototype.match =
  /**
   * Verifies if list of words can be interpreted as a sequence of tags.
   *
   * @param objs  An array with the provided words or tokens to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (objs) {
    var tmp, res = [false, false], value = [];
    for (var t=0; t<this.metatags.length; t++) {
      tmp = this.metatags[t][this.verifier](objs);
      res[0] = res[0] || tmp[0];
      res[1] = res[1] || tmp[1];
      if (tmp[0]) value.push(this.metatags[t].getDataCopy());
      else value.push(null);
    }
    if (res[0]) this.setValue(value);
    return res;
  };

/********************************************************************/

/**
 * An meta-tag implementing multiple alternative tags.
 * <p>
 * This meta-tag simply check a list of tags, and returns a final or partial
 * if any of the tags in the list matches.  The value returned in case of
 * a final match is just an array containing all values of all tags in the list.
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names<
 * @param tags     An array with the list of tags.
 */
TagXor = function(SQLname, names, tags) {
  this.parent(TagMultiMeta, "constructor").apply(this, arguments);
  this.targettags = [];
  for (var t=0; t<this.metatags.length; t++) 
    if (this.metatags[t].target) this.targettags.push(t);
};

classExtend(TagXor, TagMultiMeta);

TagXor.prototype.reset = function(keepData) {
  this.parent(Tag, "reset")(keepData);
  for (var t=0; t<this.metatags.length; t++) this.metatags[t].reset(keepData);
  this.lasttag = 0;
  this.lastobjs = [];
  this.lastblack = [];
};

TagXor.prototype.match =
  /**
   * Verifies if list of words can be interpreted as a sequence of tags.
   *
   * @param objs  An array with the provided words or tokens to match.
   * @return      A couple [final match, partial match], showing whether the
   *              provided words induce a full match or not, and whether a
   *              full match can in principle be reached if more (suitable)
   *              word are entered.
   */
  function (objs) {
    var tmp, res = [false, false], l, errors = [], level=2;

    l = this.lastobjs.length;
    if (! this.lastobjs.compare(objs.slice(0, l))) this.reset(true);
    this.lastobjs = objs.slice();

    for (var t=0; t<this.metatags.length; t++) {
      if (this.lastblack.indexOf(t) >= 0) continue;
      var metatag = this.metatags[t];
      tmp = metatag[this.verifier](objs);
      if ((! tmp[0]) && (! tmp[1])) this.lastblack.push(t);
      if ((level > 1 && tmp[1]) || (level > 0 && tmp[0])) {
	if (tmp[0]) level = 0;
	else level = 1;
	errors = metatag.getErrors();
        if (this.SQLname) this.setValue(metatag.getValue());
        else {
          var d = metatag.getDataCopy();
          this.setData(new DataTag(d.tag, d.op || "=", [t, d]));
        }
      }
      res[0] = res[0] || tmp[0];
      res[1] = res[1] || tmp[1];
      // @@@ if (tmp[0] && this.targettags.indexOf(t) < 0) 
	// @@@ this.lastblack = this.lastblack.concatUnique(this.targettags);
      if (res[0] && res[1]) break;
      if (! res[0]) errors = errors.concatUnique(metatag.getErrors());
    }
    if (res[0] == false && res[1] == false) {
      if (errors.length == 1) 
	this.addError(errors[0][0], errors[0][1], errors[0][2]);
      else if (errors.length > 1) {
	if (this.verifier == "verify") 
	  this.addError(objs[0].pos3, objs[0].value,
			"value does not match any keyword");
	else
	  this.addErrorMatch(0, words[0],
			     "value does not match any keyword");
      }
      return [false, false];
    }
    if (errors.length > 0) {
      if (errors.length == 1) 
	this.addError(errors[0][0], errors[0][1], errors[0][2]);
      else {
	if (this.verifier == "verify") 
	  this.addError(objs[0].pos3, objs[0].value,
			"value does not match any keyword");
	else
	  this.addErrorMatch(0, words[0],
			     "value does not match any keyword");
      }	
    }
    return res;
  };

TagXor.prototype.autocomp = 
  function (tokens) {
    var res = [];
    for (var t=0; t<this.metatags.length; t++) {
      var c = this.metatags[t].autocomp(tokens);
      res = res.concat(c);
    }
    res.sort();
    return res.sortUnique();
  };

TagXor.prototype.complete = 
  function (words) {
    var res = [];
    for (var t=0; t<this.metatags.length; t++) {
      var c = this.metatags[t].complete(words);
      res = res.concat(c);
    }
    res.sort();
    return res.sortUnique();
  };

TagXor.prototype.getName = 
  function (mode) {
    if (this.SQLname) {
      if (mode == "SQL") return this.SQLname;
      else return this.names[0];
    }
    var d = this.getData();
    if (d && d.value) return this.metatags[d.value[0]].getName(mode);
    else return "";
  };

TagXor.prototype.getValue =
  function (mode, value) {
    var v = (value != null) ? value : this.getData().value;
    if (mode == null) return v; 
    else {
      if (this.SQLname) return this.parent(Tag, "getValue")(mode, value);
      else {
	var d = this.getData(), t = d.value[0],
        olddata = this.metatags[t].getData(), res;
	this.metatags[t].setData(d.value[1]);
	res = this.metatags[t].getValue(mode, value);
	this.metatags[t].setData(olddata);
	return res;
      }
    } 
  };

TagXor.prototype.getText =
  function (mode) {
    if (this.SQLname) return this.parent(Tag, "getText")(mode);
    else {
      var d = this.getData(), t, olddata, res;
      if (d && d.value) {
	t = d.value[0];
        olddata = this.metatags[t].getData();
	this.metatags[t].setData(d.value[1]);
	res = this.metatags[t].getText(mode);
	this.metatags[t].setData(olddata);
	return res;
      } else return "";
    }
  };

TagXor.prototype.getDataCopy =
  function () {
    return this.parent(Tag, "getDataCopy")();
  };

/********************************************************************/

/**
 * An meta-tag implementing a single coordinate with a box search.
 * <p>
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags     An array with the list of tags.
 */
TagCoord = function(latitude, tags) {
  var args = Array.prototype.slice.apply(arguments);
  this.parent(TagUSeq, "constructor").apply(this, 
					    ["", []].concat(args.slice(1)));
  this.latitude = latitude;
  this.multiwords = true;
  this.acceptminus = true;
};

classExtend(TagCoord, TagUSeq);

TagCoord.prototype.getText = function (mode) {
  var ws = this.getDataCopy().value, tmp, op, s;
  op = this.getData().op;
  if (this.getData().tag[0] == "-") op = Tag.inverse[op];
  s = this.usednfreeTags()[0];
  if (["", "=", "!="].indexOf(op) < 0) 
    return ws[s[0]][0].getText(mode);
  if (mode == "SQL") {
    var v1, t1, v2, res, idx;
    // NB: we should use the inverse permutation of s below in
    // expressions such as ws[s[0]] or ws[s[1]]; however, since s has two
    // elements, its inverse is s itself!
    v1 = ws[s[0]][0].getValue()[1].value;
    t1 = this.metatags[0].getName(mode);
    v2 = ws[s[1]][0].getValue()[1].value;
    if (this.latitude) {
      if (v1 + v2 >= 90)
	res = t1 + ">" + this.metatags[0].getValue(mode, v1 - v2);
      else if (v1 - v2 <= -90) 
        res = t1 + "<" + this.metatags[0].getValue(mode, v1 + v2);
      else 
	res = t1 + " BETWEEN " + this.metatags[0].getValue(mode, v1 - v2) +
	  " AND " + this.metatags[0].getValue(mode, v1 + v2);
    } else {
      if (v2 < 180) {
	var v1a = (v1 - v2 + 720) % 360, v1b = (v1 + v2 + 720) % 360;
	if (v1a < v1b)
          res = t1 + " BETWEEN " + this.metatags[0].getValue(mode, v1a) +
          " AND " + this.metatags[0].getValue(mode, v1b) + ")";
	else
          res = t1 + " NOT BETWEEN " + this.metatags[0].getValue(mode, v1b) +
          " AND " + this.metatags[0].getValue(mode, v1a) + ")";
      }
    }
    if (op == '!=') return "NOT (" + res + ")";
    else return res;
  } else {
    return this.parent(TagUSeq, "getText")(mode);
  }
};


/********************************************************************/

/**
 * An meta-tag implementing a couple of coordinates with a box search.
 * <p>
 *
 * @param SQLname  The name of the database column to use for the SQL
 *                 translation
 * @param names    A list of accepted tag names
 * @param tags     An array with the list of tags.
 */
TagCoords = function(tags) {
  var args = Array.prototype.slice.apply(arguments);
  this.parent(TagUSeq, "constructor").apply(this, ["", []].concat(args));
  for (var t=0; t<this.metatags.length; t++)
    if (this.metatags[t].target) this.target = true;
  this.multiwords = true;
  this.acceptminus = false;
};

classExtend(TagCoords, TagUSeq);

TagCoords.prototype.match = function (words) {
  var res = this.parent(TagUSeq, "match")(words);
  if ((res[0] || res[1]) && this.metatags.length == 2 && 
      this.metatags[0].getData().op == "!=") this.data.op = "!=";
  return res;
}

TagCoords.prototype.getText = function (mode) {
  var ws = this.getDataCopy().value, tmp, s;
  s = this.usednfreeTags()[0];
  if (this.metatags.length == 2) {
    this.metatags[0].setData(ws[s[0]][1].value[1]);
    tmp = this.metatags[0].resolve();
  }
  if (mode == "SQL") {
    var v1, t1, v2, t2, v3, res, idx;
    if (this.metatags.length == 2) {
      v1 = tmp[0];
      t1 = this.metatags[0].getName(mode)[0];
      v2 = tmp[1];
      t2 = this.metatags[0].getName(mode)[1];
      v3 = ws[s[1]][0].getValue()[1].value;
      idx = [0,0];
    } else {
      var sws = [];
      sws[s[0]] = ws[0][1].value[1];
      sws[s[1]] = ws[1][1].value[1];
      sws[s[2]] = ws[2][1].value[1];
      v1 = sws[0].value;
      t1 = this.metatags[0].getName(mode);
      v2 = sws[1].value;
      t2 = this.metatags[1].getName(mode);
      v3 = sws[2].value;
      idx = [0,1];
    }
    if (v2 + v3 >= 90) 
      res = t2 + ">" + this.metatags[idx[1]].getValue(mode, v2 - v3);
    else if (v2 - v3 <= -90) 
      res = t2 + "<" + this.metatags[idx[1]].getValue(mode, v2 + v3);
    else {
      res = t2 + " BETWEEN " + this.metatags[idx[1]].getValue(mode, v2 - v3) +
	" AND " + this.metatags[idx[1]].getValue(mode, v2 + v3);
      v3 /= Math.cos(v2 * Math.PI / 180.0);
      if (v3 < 180) {
	var v1a = (v1 - v3 + 720) % 360, v1b = (v1 + v3 + 720) % 360;
	if (v1a < v1b)
          res = "(" + res + ") AND (" +
          t1 + " BETWEEN " + this.metatags[idx[0]].getValue(mode, v1a) +
          " AND " + this.metatags[idx[0]].getValue(mode, v1b) + ")";
	else
          res = "(" + res + ") AND (" +
          t1 + " NOT BETWEEN " + this.metatags[idx[0]].getValue(mode, v1b) +
          " AND " + this.metatags[idx[0]].getValue(mode, v1a) + ")";
      }
    }
    if (this.metatags.length == 2 && 
	this.metatags[0].getData().op == "!=") return "NOT (" + res + ")";
    else return res;
  } else {
    return this.parent(TagUSeq, "getText")(mode);
  }
};


/********************************************************************/

t = function (s) {
  var ss, res, i, m;
  ss = s.split(" ");
  res = [];
  for (i=0; i<ss.length; i++) {
    if (ss[i] == "") continue;
    m = ss[i].match(/([^=<>!]*)([!<>]?=?)(.*)/);
    if (m[3]) res.push(new Token(m[1], m[2], m[3]));
    else res.push(new Token("", "", m[1]));
  }
  return res;
};

