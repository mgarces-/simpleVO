// Get and apply an XSLT filter to the rows of a table.
// The filter values are stored in the XSLT Processors parameters
// The filter text is of the form:
//   |id1:test1|id2:test2|...|
// where idN is the column number (1-indexed) and testN is the filter.
// The leading pipe allows easy identification of the |id: syntax
// for all elements including the first.

// The types are stored a sequence of 'true/false' values separated
// by commas.  True indicates a character column.
// 
// xslProc is an object with getParameter/setParameter methods that
// stores filtering parameters that needs to be passed for subsequent
// XSLT processing (used to create the filter box form).
//
// TAM 2007-9-11

function XSLTFilter(baseDocument, xslProc) {

    this.baseDocument = baseDocument;
    this.currentDoc   = baseDocument;
    // constraints gives parameters that were used to create currentDoc from baseDocument
    this.constraints = {'userIDs': [],
                        'userConstraints': [],
                        'userTypes': [],
                        'filterText': ""};
    var me = this;

    this.setBaseDocument = function(baseDocument) {
        this.baseDocument = baseDocument;
        this.currentDoc = baseDocument;
        clearConstraints();
    };

    this.getDocument = function() {
    
        var filterText = xslProc.getParameter(null,"filterText") || "";
	
        if (this.constraints.filterText != filterText) {
            // update currentDoc if there are new constraints
            var filterTypes = xslProc.getParameter(null,"filterTypes");
            this.filterByColumn({"filterText": filterText, "filterTypes": filterTypes});
        }
        return this.currentDoc;
	
    };

    this.filterByColumn = function(form) {
        // filter columns using current form values
        // returns true if results have changed

        var ff = getConstraints(form);
        if (ff.userIDs.length == 0) {
            // No filtering, so just use the original data.
            xslProc.setParameter(null, "filterText", "");
            xslProc.setParameter(null, "filterTypes", "");
            if (! this.constraints.filterText) {
                // no change in filter settings
                return false;
            } else {
                this.currentDoc = this.baseDocument;
                this.constraints = ff;
                return true;
            }

        } else {

            xslProc.setParameter(null, "filterText", ff.filterText);
            xslProc.setParameter(null, "filterTypes", ff.userTypes.join(","));
            if (ff.filterText == this.constraints.filterText) {
                // no change in filter settings
                return false;
            }

	    for ( var i=0; i<ff.userTypes.length; i++ ) {
		if ( ff.userTypes[i] ) {
		    if ( ff.userConstraints[i].match("<|>") ) {
			if ( ! confirm ( "Character column filters do not support relational criteria, but your filter begins with '>' or '<'.  Do you wish to continue and just match these characters or abort the filtering?  These operations are supported for numeric fields." ) ) {
			    return false;
			}
		    }
		}
	    }

            // don't do processing if baseDocument is null
            var newDoc;
            if (this.baseDocument) {
                var xsltString;
                try {
                    xsltString = xslt(ff.userIDs, ff.userConstraints, ff.userTypes);
		    

                    // Get an XSL processor
                    var xsltp = new XSLTProcessor();
                    var parser = new DOMParser();
                    var xsltDom = parser.parseFromString(xsltString, "text/xml");
		    
                    // debug(xml2pretty(xsltDom));
		    
                    xsltp.importStylesheet(xsltDom);

                    // This does the transformation
                    newDoc = xsltp.transformToDocument(this.baseDocument);
                    if (! newDoc.firstChild) {
			alert("bug: null document");
			return false;
                    }
                    this.constraints = ff;
                } catch (e) {
                    alert("Error in filtering.  Invalid syntax on field criteria?\n\n"+
                      "For numeric columns use >,>=,=,<,<= or range.\n"+
                      "   >30  or  30..50\n"+
                      "   The = operator is optional."+
                      "Character fields support only matchs which may\n"+
                      "include wildcards (*).\n"+
                      "   Zwicky    or    3C*273\n"+
                      "If no wildcards are specified use =xxx to force\n"+
                      "an exact match.  Otherwise all rows matching at\n"+
                      "the beginning will match (i.e., '3C' matches '3C273'\n\n"+
                       e);
                    return false;
                }
            }
            this.currentDoc = newDoc;
        }
        return true;
    };

    this.clear = function(form) {

        var changed =  clearConstraints(form);
        if (changed) {
            this.clearXSL();
        }
        this.currentDoc = this.baseDocument;
        return changed;
    };

    this.clearXSL = function() {
        xslProc.setParameter(null, "filterText", "");
        xslProc.setParameter(null, "filterTypes", "");
    };

    // local functions and variables

    function getConstraints(form) {
    
        // Extract filtering parameters from form
        // form can be either an HTML DOM <form> element or a dictionary
        // containing the filterText and filterTypes parameters
	
        var userIDs         = [];
        var userTypes       = [];
        var userConstraints = [];
	
        if (! form) {
            // use current constraints if the form is not available
            return me.constraints;
	    
        } else if (form.elements) {
	
            for (var j=0; j<form.elements.length; j++) {
	    
                var el = form.elements[j];
                if (el.tagName == "INPUT" && el.type == "text") {
                    var constraint = el.value;
                    if (constraint) {
                        // field number is in trailing digits
                        var i = parseInt(el.name.replace(/.*[^0-9]/,""),10);
                        userIDs.push(i);
                        userConstraints.push(constraint);
                        var v = form.elements[el.name+"_type"].value;
                        if (trim(v.toLowerCase()) == "false") {
                            v = false;
                        } else {
                            v = true;
                        }
                        userTypes.push(v);
                    }
                }
            }
	    
            if (userIDs.length > 0) {
                var filterText = new Array(userIDs.length);
                for (i=0; i<userIDs.length; i++) {
                    filterText[i] = userIDs[i] + ":" + userConstraints[i];
                }
                filterText = "|"+filterText.join("|")+"|";
		
            } else {
                filterText = "";
            }
	    
        } else {
            // Dictionary parameter
            filterText = form.filterText;
            if (filterText) {
                var fields = filterText.substring(1,filterText.length-1).split('\|');
                var types = form.filterTypes.split(',');
                for (i=0; i<fields.length; i += 1) {
                    var index = fields[i].indexOf(':');
                    if (index > 0) {
                        userIDs.push(parseInt(fields[i].substring(0,index),10));
                        userConstraints.push(fields[i].substring(index+1));
                        userTypes.push(types[i]=='true');
                    }
                }
            }
        }
	
        var constraints = 
	               {'userIDs'         : userIDs,
                        'userConstraints' : userConstraints,
                        'userTypes'       : userTypes,
                        'filterText'      : filterText};
        return constraints;
    }

    function clearConstraints(form) {
        // Clear filtering parameters in form
        // Returns true if any values are changed
        var changed = false;
        if (form) {
            for (var j=0; j<form.elements.length; j++) {
                var el = form.elements[j];
                if (el.tagName == "INPUT" && el.type == "text" && el.value != "") {
                    el.value = null;
                    changed = true;
                }
            }
        }
	
        if (me.constraints.filterText) {
            me.constraints = {'userIDs': [],
                              'userConstraints': [],
                              'userTypes': [],
                              'filterText': ""};
            changed = true;
        }
        return changed;
    }
}
