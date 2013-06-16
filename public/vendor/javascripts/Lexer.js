var numsubexp = "([-+]?[0-9]+(\\.[0-9]+)?[a-z]*|[-+]?[0-9]+(:[0-9]+)+(\\.[0-9]+)?|[0-9]+(-[0-9]+))";
var lineregexp = new RegExp("(-?\"[^\"]*(\"|$)|-?'[^']*('|$)|[=<>!]+|" +
  numsubexp + "\\.\\.(" + numsubexp + ")?|(\\.\\.)?" + 
  numsubexp + "|[()-]|[^\"'\\s=<>!().]+|\\.)", "g");
var numregexp = new RegExp("^" + numsubexp);

var numregexp = /^[-+]?[-:0-9]+(\.[0-9]+)?[a-z]*$/;
var lineregexp = /(-?\"[^\"]*(\"|$)|-?'[^']*('|$)|[=<>!]+|[()]|[^\s=<>!()]+)/g;
var errors = {p: [], word: [], message: []};
var autocompletefield = null;
var autocompletevalues = null;

addError = function (p, word, message) {
  errors.p.push(p);
  errors.word.push(word);
  errors.message.push(message);
};

clearErrors = function () {
  errors = {p: [], word: [], message: []};
}

displayErrors = function (words, syntax) {
  var html = colorize(words, errors);
  html += '<font color="#FF0000">: ';
  if (syntax) html += "syntax error";
  else html += errors.message.join("; ");
  html += '</font>';
  $("#oneline_output").html(html);
  return false;
};

checkSesame = function () {
  var res = [], name;
  for (name in sesameErrors) res.push(name);  
  if (res.length > 0) return false;  
  for (name in sesameWarnings) res.push(name);
  if (res.length > 0) return false;
  return true;
};

tokenize = function(line, ignoretags) {
  var words = line.match(lineregexp);
  if ((!words) || (words.length == 0)) return [''];
  var eot = (' =()'.indexOf(line[line.length-1]) >= 0), p = words.length - 1,
    last = words[p];
  if (eot) {
    if ((last[0] == '"') || (last[0] == "'")) {
      if (last[0] != last[last.length-1]) {
         words.pop();
      } else last = '';
    } else last = '';
  } else words.pop();
  words.push(last);
  if (last == '..' || last == '>' || last == '<' || 
      (!ignoretags && 
       (tags.indexOf((last[0] == "-") ? last.slice(1) : last)) >= 0)) 
    words.push('');
  return words;
};

ignore = /^[ \s\f\t\n\r]*$/;
retrace = function (line, words) {
  var i, ls = words.length, l, p0 = 0, p1, res = [], s = line, t;
   for (i=0; i<ls; i++) {
    p1 = s.indexOf(words[i]);
    t = s.slice(0, p1);
    if (! ignore.test(t))
      addError(p0 + p1, t, "Unexpected character(s) found");
    l = words[i].length;
    res.push([p0 + p1, p0 + p1 + l, words[i]]);
    p0 += p1 + l;
    s = s.slice(p1 + l);
  }
  if (! ignore.test(s))
    addError(p0, t, "Unexpected character(s) found");

  return res;
}

notops = ["not", "-"];
logops = ["and", "or", "xor"];
operators = ["=", "<", ">", ">=", "<=", "!="];
classify = function (words) {
  var i, l = words.length, res = [];
  for (i=0; i<l; i++) {
    var p0 = words[i][0], p1 = words[i][1], word = words[i][2];
    if (notops.indexOf(word) >= 0) res.push([p0, p1, "notop", word]);
    else if (logops.indexOf(word) >= 0) res.push([p0, p1, "logop", word]);
    else if (tags.indexOf(word) >= 0 || 
	     (word[0] == "-" && tags.indexOf(word.slice(1)) >= 0))
      res.push([p0, p1, "tag", word]);
    else if (operators.indexOf(word) >= 0) {
      if (i > 0 && p0 == words[i-1][1] && res[res.length-1][2] != "tag") 
	addError(words[i-1][0], words[i-1][2], "Unrecognized tag");
      res.push([p0, p1, "op", word]);
    } 
    else if (word == "(") res.push([p0, p1, "(", word]);
    else if (word == ")") res.push([p0, p1, ")", word]);
    else if (word[0] == "'" || word[0] == '"') res.push([p0, p1, "quote",word]);
    else if (numregexp.test(word)) res.push([p0, p1, "numvalue", word]);
    else res.push([p0, p1, "value", word]);
  }
  return res;
}

colorCodes = {
  "notop": "BC8F8F",
  "logop": "BC8F8F",
  "tag": "9932CC",
  "op": "000000",
  "(": "000000",
  ")": "000000",
  "quote": "0000FF",
  "numvalue": "4682B4",
  "value": "2E8B57",
  "error": "FF0000"
};

colorize = function (words, errors) {
  var i, j, l = words.length, res = "", p0 = 0, p1 = 0, es = [],
    curcolor = "", curerror = false, word,
    error_start = '<span style="border:1px solid; border-color:red;">',
    error_stop = '</span>', font_start, font_stop;

  if (errors) {
    var ex = "";
    for (i=0; i<errors.p.length; i++) {
      var e0 = errors.p[i], e1 = e0 + errors.word[i].length, ey = "";
      for (j=es.length; j<e1; j++) ex += " ";
      for (j=e0; j<e1; j++) ey += "x";
      ex = ex.slice(0, e0) + ey + ex.slice(e1);
    }
    curerror = -1;
    ex += " ";
    for (i=0; i<ex.length; i++) {
      if (curerror == -1) {
	if (ex[i] == "x") curerror = i;
      } else {
	if (ex[i] == " ") {
	  es.push([curerror, i]);
	  curerror = -1;
	}
      }
    }
    curerror = false;
  }

  for (i=0; i<l; i++) {
    p0 = words[i][0];
    for (j=p1; j<p0; j++) {
      if (es.length > 0) {
	if (es[0][0] == j) res += error_start;
	else if (es[0][1] == j) {
	  res += error_stop;
	  es.pop();
	}
      }
      res += " ";
    }
    p1 = words[i][1];
    word = words[i][3];
    font_start = '<font color="#' + colorCodes[words[i][2]] + '">';
    font_stop = '</font>';
    while (es.length > 0 && ((es[0][0] >= p0 && es[0][0] < p1) || 
			     (es[0][1] >= p0 && es[0][1] < p1))) {
      if (es[0][0] >= p0 && es[0][0] < p1) {
	if (es[0][0] > p0) 
	  res += font_start + word.slice(0, es[0][0] - p0) + font_stop;
	res += error_start;
	word = word.slice(es[0][0] - p0);
	p0 = es[0][0];
      }
      if (es[0][1] >= p0 && es[0][1] < p1) {
	if (es[0][1] > p0) 
	  res += font_start + word.slice(0, es[0][1] - p0) + font_stop;
	res += error_stop;
	word = word.slice(es[0][1] - p0);
	p0 = es[0][1];
	es.pop();
      } else break;
    }
    res += font_start + word + font_stop;
  }
  if ((es.length > 0) && (es[0][1] == p1)) res += error_stop;
  return res;
}

mytest = function (line) {
  var words = tokenize(line), lex, res;
  words = retrace(line, words);
  words = classify(words);
  lex = lexer(words);
  return words;
  res = Texpr.verify(lex[1]);
  return [lex, res, Texpr.getText("Human")];
}

simplify = function (line) {
  return line.toLowerCase().replace(/[ \s\f\t\n\r]+/g,' ');
};

lexer = function (words, start, tag, op) {
  var i, l = words.length, res = [], curtag = ["", -1], curop = ["", -1], 
    expects, pos, type, word;
  tag = tag || ["", -1];
  op  = op  || ["", -1];
  start = start || 0;
  i   = start;;
  expects = {"notop": true, "logop": false, "tag": (! tag[0]), "op": (! op[0]),
             "(": true, ")": false, "value": true, "..": true};
  while (i < l) {
    pos = words[i][0]; 
    type = words[i][2]; 
    word = words[i][3];
    if (type == "notop") {
      if (!expects["notop"]) addError(pos, word, "Unexpected not operator");
      expects["notop"] = expects[")"] = false;
      expects["("] = expects["value"] = expects[".."] = true;
      res.push(new Token("", "", "not", pos, pos, pos));
    } else if (type == "logop") {
      if (!expects["logop"]) addError(pos, word, "Unexpected logical operator");
      expects["logop"] = expects[")"] = false;
      expects["notop"] = expects["("] = expects["value"] = expects[".."] = true;
      res.push(new Token("", "", word, pos, pos, pos));
    } else if (type == "tag") {
      if (!expects["tag"]) addError(pos, word, "Unexpected tag");
      curtag = [word, pos];
      expects["logop"] = expects["tag"] = expects[")"] = false;
      expects["notop"] = expects["("] = expects["value"] = expects[".."] = true;
    } else if (type == "op") {
      if (!expects["op"]) addError(pos, word, "Unexpected operator");
      curop = [word, pos];
      expects["logop"] = expects["tag"] = expects["op"] = expects[")"] = false;
      expects["notop"] = expects["("] = expects["value"] = expects[".."] = true;
    } else if (type == "(") {
      if (!expects["("]) addError(pos, word, "Unexpected open parenthesis");
      var tmp = lexer(words, i+1, curtag[0] ? curtag : tag, 
		      curop[0] ? curop : op);
      res.push(new Token("", "", "(", pos, pos, pos));
      i = tmp[0];
      if (tmp[1].length > 0) res = res.concat(tmp[1]);
      expects = tmp[2];
      curtag = tmp[3];
      curop = tmp[4];
      expects["tag"] = ! (tag[0] || curtag[0]);
      expects["op"] = ! (op[0] || curop[0]);
      if (expects[")"] == false) expects[")"] = (start > 0);
    } else if (type == ")") {
      if (!expects[")"]) addError(pos, word, "Unexpected close parenthesis");
      res.push(new Token("", "", ")", pos, pos, pos));
      expects["tag"] = ! tag[0];
      expects["op"] = ! op[0];
      expects["notop"] = expects["logop"] = expects["("] = expects["value"] =
        expects[".."] = true;
      expects[")"] = false;
      return [i, res, expects, ["", -1], ["", -1]];
    } else if (word != "" || word == "") { // @@@
      if (!expects["value"]) addError(pos, word, "Unexpected value specification");
      var range = word.indexOf(".."), p1, p2, cont;
      if (range >= 0) {
        if (word.slice(range + 2).indexOf("..") >= 0)
          addError(pos, word, "Multiple range specification in value");
      }
      p1 = curtag[0] ? curtag[1] : (tag[0] ? tag[1] : pos); 
      p2 = curop[0] ? curop[1] : (op[0] ? op[1] : pos);
      cont = (curtag[0] || curop[0] || ((tag[0] || op[0] ) && i == start)) ? 
	false : true; 
      if (curtag[0] || tag[0] || curop[0] || op[0] || word) 
	res.push(new Token(curtag[0] || tag[0], curop[0] || op[0], word, 
			   p1, p2, pos, cont));
      curop = ["", -1]; 
      curtag = ["", -1];
      expects["tag"] = ! tag[0];
      expects["op"] = ! op[0];
      expects["notop"] = expects["logop"] = expects["("] = expects["value"] =
	true;
      expects[".."] = (range < 0);
      expects[")"] = (start > 0);
    }
    i++;
  }
  if (start > 0) expects[")"] = true;
  else if (curtag[0] || tag[0] || curop[0] || op[0]) {
    type = words[words.length - 1][2];
    word = words[words.length - 1][3];
    if (word == "" || type == "tag" || type == "op" || type == "(") {
      var p1, p2;
      p1 = curtag[0] ? curtag[1] : (tag[0] ? tag[1] : pos); 
      p2 = curop[0] ? curop[1] : (op[0] ? op[1] : pos); 
      //res.push(new Token(curtag[0] || tag[0], curop[0] || op[0], "", p1, p2, 
	//		 pos));
    }
  }
  return [i, res, expects, 
	  curtag[0] ? curtag : (tag[0] ? tag : ["", -1]),
	  curop[0]  ? curop  : (op[0]  ? op  : ["", -1])];
};


fieldLexer = function (words, start, tag, op) {
  var i, l = words.length, res = [], curop = ["", -1], expects;
  tag = [tag, -1];
  op  = op  || ["", -1];
  i   = start || 0;
  expects = {"logop": false, "op": (! op[0]), "value": true, "..": true};
  while (i < l) {
    var pos = words[i][0], type = words[i][2], word = words[i][3];
    if (type == "logop") {
      if (!expects["logop"]) return false;
      expects["logop"] = false;
      expects["value"] = expects[".."] = true;
      res.push(word);
    } else if (type == "op") {
      if (!expects["op"]) return false;
      curop = [word, pos];
      expects["logop"] = expects["op"] = false;
      expects["value"] = expects[".."] = true;
    } else if (type == "value" || type == "numvalue") {
      var range, p1, p2, phrase = [];
      if (!expects["value"]) return false;
      while (type == "value" || type == "numvalue") {
	if (word != "") phrase.push(word);
	i++;
	if (i == l) break;
	pos = words[i][0];
	type = words[i][2]; 
	word = words[i][3];
      }
      if (phrase.length > 1) 
	res.push(tag[0] + (curop[0] || op[0] || "=") + '"' + 
		 phrase.join(" ") + '"');
      else if (phrase.length == 1) 
        res.push(tag[0] + (curop[0] || op[0] || "=") + phrase);
      i--;
      range = word.indexOf("..");
      curop = ["", -1]; 
      expects["op"] = ! op[0];
      expects["logop"] = expects["value"] = true;
      expects[".."] = (range < 0);
    } else return false;
    i++;
  }
  return [i, res, expects, tag, curop || op];
};


checkComplete = function(expects, length) {
  if (! expects["notop"]) addError(length, "", "Unexpected end of line after not operator");
  if (! expects["logop"]) addError(length, "", "Unexpected end of line after logical operator");
  if (! expects["tag"]) addError(length, "", "Unexpected end of line after tag");
  if (! expects["op"]) addError(length, "", "Unexpected end of line after operator");
  if (expects[")"]) addError(length, "", "Missing close parenthesis");
  return (expects["notop"] && expects["logop"] && expects["tag"] && expects["op"] && (! expects[")"]));
}


lextest = function(line) {
  var words = tokenize(line), lex;
  words = retrace(line, words);
  words = classify(words);
  lex = fieldLexer(words, 0, "exptime");
  return lex;
}

lexautocomp = function(line, ignoretags) {
  var words = tokenize(line, ignoretags), words1, last, lastpos, lastlen, 
    lex, res, e, complete;
  if (!ignoretags && line == autocompletefield) return autocompletevalues;
  words = retrace(line, words);
  words1 = words.slice(0, -1);
  last = words[words.length - 1][2];
  lastpos = words[words.length - 1][0];
  lastlen = last.length;
  words1 = classify(words1);
  lex = lexer(words1);
  e = lex[2];
  complete = Texpr.verify(lex[1])[0];
  if (Texpr.getErrors().length > 0) return false;
  if (lex[1].length > 0 && complete == false) {
    e["notop"] = e["logop"] = e["tag"] = e["("] = e[")"] = e["op"] =
      e[".."] = false;
    if (words1.length > 0 && words1[words1.length-1][2] == "tag") 
      e["op"] = true;
  }
  if (last.length == 0) lastpos += 1;
  else if (last[0] == "'" || last[0] == '"') {
    var p = last.lastIndexOf(" ");
    lastpos += p + 1;
    e["notop"] = e["logop"] = e["tag"] = e["op"] = e["("] = e[")"] = 
      e[".."] = false;
  }
  if (ignoretags) {
    e["notop"] = e["logop"] = e["tag"] = e["("] = e[")"] = e["op"] =
      e[".."] = false;
  }

  res = [];
  if (!autocompleteauto || last || lex[3][0]) {
    if (e["logop"]) res = res.concat(["and ", "or "]);
    if (e["tag"]) {
      var last1 = (last && last[0] == "-") ? last.slice(1) : last;
      var validtags = tagsmain.filter(function (w) { 
				return w.slice(0, last1.length) == last1;
				      });
      if (validtags.length == 0) 
	validtags = tags.filter(function (w) { 
				  return w.slice(0, last1.length) == last1; 
				});
      if (last1 != last) 
	validtags = validtags.map(function (w) { return "-" + w; });
      if (validtags.length != 1 || validtags[0] != last)
	res = res.concat(validtags);
    }
    if (e["op"]) {
      var tag=lex[3][0];
      if (tag[0] == "-") tag = tag.slice(1);
      if (tag) {
	var tagop = [];
	tagdict[tag].forEach(function (t) {tagop = tagop.concat(t.operators);});
	tagop = tagop.filter(function (t) {return t != "";}).unique();
	res = res.concat(tagop);
      } else res = res.concat(operators);
    }
    if (e["("]) res.push("(");
    if (e[")"]) res.push(") ");
    // if (e[".."]) res.push("..");
    res = res.filter(function (w) { return w.slice(0, lastlen) == last; });
    if (e["notop"] && "not".slice(0, lastlen) == last) res.push(" not ");
    res = res.map(function (w) { return [lastpos, w]; });
    if (!ignoretags && tags.indexOf(last) >= 0) {
      var tagop = [];
      tagdict[last].forEach(function (t) {tagop = tagop.concat(t.operators);});
      tagop = tagop.filter(function (w) { return w.length > 0; }).unique();
      res = res.concat(tagop.map(function (w) { 
				   return [lastpos + last.length, w];
				 }));
    }
  }
  /* This is difficult: we want to limit the number of completion
   * returned, so we do not always calculate completion for values.
   * Completions are calculated in one of the following cases: (1) if
   * the last word is non-empty (or better has already significant
   * charaters); (2) if the expression is non-complete and non-null
   * (for example, ends with the given name of a PI (a complete match
   * requires also a family name); (3) a tag and an operator are
   * provided.  In these case we do calculate completion, because we
   * are limiting somehow the number of results obtained.
   */
  if (e["value"] && ((last != '"' && last != "'" && 
		      last != "-" && last != '-"' && last != "-'") &&
		     (last != "" || 
		      (complete == false && (words.length > 1 || words[0][2])))
		     ||
		     (lex[3][0] && lex[4][0]))) {
    var tokens = lex[1], newres, blacklist;
    if (tokens.length > 0 && tokens[tokens.length-1].value == "") 
      tokens[tokens.length-1].value = last;
    else {
      var p;
      p = words[words.length-1][0];
      tokens.push(new Token(lex[3][0], lex[4][0], last, p, p, p));
    }
    blacklist = ["and", "or", "not", "(", ")", 
		 ""].concat(operators).concat(tags);
    newres = Texpr.autocomp(tokens).filter(
      function (w) { return (blacklist.indexOf(w) < 0); }
    );
    res = res.concat(newres.map(function (w) { return [lastpos, w + " "]; }));
  } else if (res.length == 0) return false;
  if (!ignoretags) {
    if (last == "" && words1.length > 0 && words1[words1.length-1][2] == "tag") 
      res = res.concat(lexautocomp(line, true));
    autocompletefield = line;
    autocompletevalues = res;
  }
  if (res.length == 1 && (res[0][1] == last || res[0][1] == last + " "))
    return false;
  else {
    /* Last check: if no values are returned, and the input position
     * is compatible with a target name, then return true: this will
     * generate a slightly different message.
     */
    if (res.length == 0) {
      var tag = lex[3][0];
      if (e["value"] && (tag == "" || tag == "target")) return true;
    }
  }
  return res;  
};

lexautocompselect = function(line) {
  var words, last;

  words = tokenize(line);
  last = words[words.length - 1];
  if ((last[0] == "'" || last[0] == '"') && last[last.length - 1] == " ") {
    var res = lexautocomp(line);
    if (res === true || res.length == 0) 
      return line.slice(0, line.length-1) + last[0] + " ";
  }
  return line;
};