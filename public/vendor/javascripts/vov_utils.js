function getTextContent(el) {
	var txt = el.textContent;
	if (txt != undefined) {
		return txt;
	} else {
		return getTCRecurs(el);
	}
}

function getTCRecurs(el) {
	// recursive method to get text content of an element
	// used only if the textContent attribute is not defined (e.g., in Safari)
	var x = el.childNodes;
	var txt = '';
	for (var i=0, node; node=x[i]; i++) {
		if (3 == node.nodeType) {
			txt += node.data;
		} else if (1 == node.nodeType) {
			txt += getTCRecurs(node);
		}
	}
	return txt;
}

function getElementsByClass(searchClass,node,tag) {
	var classElements = new Array();
	if (node == undefined) node = document;
	if (tag == undefined) tag = '*';
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	for (i = 0, j = 0; i < elsLen; i++) {
		if (pattern.test(els[i].className) ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

// remove a blank-delimited string sub from string s
// if sub occurs multiple times, all are removed
// also normalizes the string by removing blanks

function removeSubstring(s,sub) {
	var flist = s.split(' ');
	var glist = [];
	for (var i=0, f; f = flist[i]; i++) {
		if (f && f != sub) {
			glist.push(f);
		}
	}
	return glist.join(' ');
}

// Validates that a string contains only valid numbers.
// Returns true if valid, otherwise false.

function validateNumeric(strValue) {
	var objRegExp  =  /^\s*(([-+]?\d\d*\.\d*$)|([-+]?\d\d*$)|([-+]?\.\d\d*))\s*$/;
	return objRegExp.test(strValue);
}

// XPath functions

function selectSingleNode(doc, xpath) {
	if (document.evaluate) {
		// Mozilla version
		var result = document.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	} else if (doc.selectSingleNode) {
		// IE version
		result = doc.selectSingleNode(xpath);
	}
	return result;
}

function selectNodes(doc, xpath) {
	if (document.evaluate) {
		// Mozilla version
		var result = document.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
	} else if (doc.selectSingleNode) {
		// IE version
		result = doc.selectNodes(xpath);
		// fake the iterateNext method [XXX untested XXX]
		var nextIndex=0;
		result.iterateNext = function() {
			if (nextIndex < this.length) {
				nextIndex = nextIndex+1;
				return this[nextIndex-1];
			} else {
				return null;
			}
		};
	}
	return result;
}

// pack form parameters into a GET string

function getFormPars(formname, encoding) {
        // if encoding is not defined or == 'yes', then each parameter will be URI encoded
        // otherwise the parameter is transferred as is.
        
        var doencode = false;
        if ((typeof(encoding) == 'undefined') || (encoding=='yes')) {
           doencode = true;
        }
        
	if (typeof(formname) == "string") {
		var form = document.forms[formname];
	} else {
		form = formname;
	}
	if (form == undefined) {
		// allow non-existent form
		return "";
	}
        
	var parlist = [];
	for (var i=0; i<form.elements.length; i++) {
		var el = form.elements[i];
                
		if (el.tagName == "INPUT") {
                        var value = el.value;
                        if (doencode) {
                           value = encodeURIComponent(value);
                        }
			if (el.type == "text" || el.type == "hidden") {
				parlist.push(el.name + "=" + value);
			} else if (el.type == "checkbox") {
				if (el.checked) {
					parlist.push(el.name + "=" + value);
				} else {
					parlist.push(el.name + "=");
				}
			} else if (el.type == "radio") {
				if (el.checked) {
					parlist.push(el.name + "=" + value);
				}
			}
		} else if (el.tagName == "SELECT") {
                        
                        for (var j = 0; j < el.options.length; j++) {
                              if (el.options[j].selected) {
                                  value = el.options[j].value;
                                  if (doencode) {
                                     value = encodeURIComponent(value);
                                  }
                                  parlist.push(el.name + "=" + value);
                              }
                        }                        
		}
	}
	return parlist.join("&");
}

// extract form parameters from a GET string and set form values

function setFormPars(formname,getstr) {
	if (typeof(formname) == "string") {
		var form = document.forms[formname];
	} else {
		form = formname;
	}
	var parlist = getstr.split("&");
	for (var i=0; i<parlist.length; i++) {
		var f = parlist[i].split("=");
		if (f.length < 2) {
			var name = parlist[i];
			var value = "";
		} else {
			// don't know if embedded '=' can happen, but might as well handle it
			name = f.shift();
			value = decodeURIComponent(f.join("="));
		}
		var el = form[name];
		if (el != undefined) {
			if (el.tagName == "INPUT") {
				if (el.type == "checkbox") {
					if (value) {
						el.checked = true;
					} else {
						el.checked = false;
					}
				} else {
					// text or hidden element
					el.value = value;
				}
			} else if (el.tagName == "SELECT") {
				for (var j=0; j < el.options.length; j++) {
					var option = el.options[j];
					if (option.value == value) {
						option.selected = true;
					} else {
						option.selected = false;
					}
				}
			} else if (el.length > 0) {
				// radio buttons
				for (j=0; j < el.length; j++) {
					if (el[j].value == value) {
						el[j].checked = true;
					} else {
						el[j].checked = false;
					}
				}
			}
		}
	}
}

// pack hash table (dictionary) values into a URI-encoded string

function encodeHash(dict) {
	var s = [];
	for (var p in dict) {
		s.push(p + '=' + dict[p]);
	}
	return encodeURIComponent(s.join("$"));
}

// unpack hash table from URI-encoded string

function decodeHash(value) {
	var s = decodeURIComponent(value).split("$");
	var dict = {};
	for (var i=0; i<s.length; i++) {
		var p = s[i];
		var f = p.split("=");
		if (f.length == 1) {
			if (p) dict[p] = undefined;
		} else if (f.length == 2) {
			dict[f[0]] = f[1];
		} else {
			var field = f.shift();
			dict[field] = f.join("=");
		}
	}
	return dict;
}

// write debug output to div at top of page
function debug(innerHTML,clear) {
	var el = document.getElementById("debug");
	if (!el) {
		el = document.createElement("div");
		el.id = "debug";
		el.style.fontSize = "80%";
		el.innerHTML = '<a href="#" onclick="return debug(null,true)">Clear</a>';
		document.body.insertBefore(el, document.body.firstChild);
	}
	if (clear) {
		el.innerHTML = '<a href="#" onclick="return debug(null,true)">Clear</a>';
	} else {
		el.innerHTML += " "+innerHTML;
	}
	return false;
}

function getRadioValue(button) {
	// get the value for a radio button input
	for (var i=0, option; option = button[i]; i++) {
		if (option.checked) {
			return option.value;
		}
	}
	return undefined;
}

// functions used in XSL-generated code
function trim(str) {
	return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
}
