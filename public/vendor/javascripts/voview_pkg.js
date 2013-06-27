/**
 * Copyright (c) 2011, Dean Hinshaw
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 *   - Redistributions of source code must retain the above copyright notice, 
 *     this list of conditions and the following disclaimer.
 *   - Redistributions in binary form must reproduce the above copyright 
 *     notice, this list of conditions and the following disclaimer in the 
 *     documentation and/or other materials provided with the distribution.
 *     
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @class VOView object for filtering and displaying VOTABLEs. This object acts
 *        as the namespace for voview, as well as the base object which other
 *        objects inherit methods from.
 * 
 * @param {string} vovParams.widgetID Prefix for the HTML class attributes where
 *            the various sub-widgets of the HTML table display will be placed.
 *            For example, when displaying the main table containing the data,
 *            the HTML element whose class contains the value {prefix}.table
 *            would be searched for, and the table placed at this location in
 *            the HTML document. For placement of the default layout, only the
 *            widgetID (with no suffix) is specified in the class attribute.
 * 
 * @param {Object} vovParams.input Object containing parameter specifying how
 *            VOView is to obtain the input VOTABLE. Of the input parameters
 *            described below, only one need be specified.
 * 
 * @param {HTML DOM form} vovParams.input.form HTML form element containing the
 *            URL for obtaining a VOTABLE. The URL must be contained in an input
 *            element with the name "query_string".
 * 
 * @param {string} vovParams.input.url String containing the URL for obtaining
 *            the input VOTABLE.
 * 
 * @returns {voview Object}
 */

function voview(vovParams) {
    var meVoview = this;
    var inputParams = vovParams.input;
    this.votableUrl = null;
    var proxy = "/cgi-bin/vo/util/proxy.pl";
    var errorCallBack = null;
    // Make a unique identifying object name
    var date = new Date();
    var uniqueName = "vobj" + date.getTime().toString(16);
    eval(uniqueName + " = meVoview");

    this.filterObject = meVoview.makeFilter({});
    this.renderObject = meVoview.makeRenderer({ filterObject: this.filterObject, objectName: uniqueName,
        widgetIDprefix: vovParams.widgetID });

    /**
     * Function to call when a new input table has been downloaded. Kicks off
     * the filtering and rendering process.
     * 
     * @param {XML Dom object} table The table that has been downloaded.
     */
    var gotVotable = function(table) {
        meVoview.filterObject.setInputTable({ tableDOM: table });
        meVoview.renderObject.render({ renderCallback: meVoview.renderObject.displayHTML });
    };

    this.setErrorCallBack = function(func){
    	errorCallBack = func;
    };
    
    /**
     * Starts off the process of displaying a VOTABLE. Gets the input
     * information for the table, and initiates the process of acquiring the
     * table object.
     */
    this.start = function() {
        var urlForm;
        var key, keys;

        /**
         * function unloadWarning () { return "Don't do it!"; }
         * window.onbeforeunload = unloadWarning;
         */

        meVoview.renderObject.clearFilterText();
        
        if (inputParams.form) {
            urlForm = document.getElementsByName(inputParams.form)[0];
            meVoview.votableUrl = urlForm.query_string.value;

            if (urlForm.sort_column) {
                keys = [];
                key = meVoview.makeSortColumnKey({ column: urlForm.sort_column.value,
                    direction: urlForm.sort_order.value });
                keys.push(key);
                meVoview.filterObject.setSortColumns({ sortKeys: keys });
            }
        } else {
            if (!inputParams.url) {
                alert("VOView: No input information specified.");
            }
            meVoview.votableUrl = inputParams.url;
        }

        if (meVoview.votableUrl) {
        	if (proxy !== "" && meVoview.votableUrl.match(/^\w+:/)) {
                // Need to use a proxy for downloading the table
                meVoview.votableUrl = proxy + "?" + encodeURIComponent(meVoview.votableUrl);
            }
        	var tableGet = meVoview.makeGetXml({ fileUrl: meVoview.votableUrl, 
        			dataCallBack: gotVotable, errorCallBack: errorCallBack });
            tableGet.send();
        } else {
            alert("VOView: No input data available.");
        }
        return false;
    };
}

voview.prototype.makeSortColumnKey = function(sortColParams) {
    /**
     * An object for specifying the data needed for filtering the table by the
     * values in a column.
     * 
     * @param {string|integer} sortColParams.column The column to use for
     *            sorting the table. If a string, specifies the name of the
     *            column. If an integer, the number corresponds to the column in
     *            the original order of the columns in the VOTABLE.
     * 
     * @param {string} sortColParams.direction Sort direction. Either
     *            "ascending" or "descending".
     */
    function SortColumnKey(_column, _direction) {
        var meSortColumnKey = this;
        meSortColumnKey.column = _column;
        meSortColumnKey.direction = _direction;

        this.equals = function(otherKey) {
            return otherKey.column === meSortColumnKey.column && otherKey.direction === meSortColumnKey.direction;
        };
    }
    return new SortColumnKey(sortColParams.column, sortColParams.direction);
};

voview.prototype.makeColumnFilterKey = function(filteKeyParams) {
    /**
     * An object for specifying the data needed for filtering the table by the
     * values in a column.
     * 
     * @param filteKeyParams.column {string|integer} The column to use for
     *            filtering the table. If a string, specifies the name of the
     *            column. If an integer, the number corresponds to the column in
     *            the original order of the columns in the VOTABLE.
     * 
     * @param filteKeyParams.expression {string} The filtering expression to be
     *            applied to the column.
     * 
     * @param filteKeyParams.isCharType {boolean} Indicates if the column is a
     *            Character type, rather than numerically valued.
     */
    function columnFilterKey(_column, _expression, _isCharType) {
        var meColumnFilterKey = this;
        meColumnFilterKey.column = _column;
        meColumnFilterKey.expression = _expression;
        meColumnFilterKey.isCharType = _isCharType;

        this.equals = function(otherKey) {
            return otherKey.column === meColumnFilterKey.column && otherKey.expression === meColumnFilterKey.expression && otherKey.isCharType === meColumnFilterKey.isCharType;
        };
    }
    return new columnFilterKey(filteKeyParams.column, filteKeyParams.expression, filteKeyParams.isCharType);
};

/**
 * Helper function for instantiating a GetXml object.
 * 
 * @param {string} getXsltParams.fileUrl URL of the XML file to be downloaded.
 * 
 * @param {function} getXsltParams.dataCallBack Function to call once the file
 *            is downloaded. The sole argument to the function is the XML Dom
 *            object for the downloaded file.
 *            
 * @param {function} getXsltParams.errorCallBack function to all if an error occurs 
 */
voview.prototype.makeGetXml = function(getXsltParams) {
	
    /**
     * @class Object for using an http request to download an XML file.
     * @see voview#makeGetXml
     */
    function GetXml(fileUrl, dataCallBack, errorCallBack) {
        var meGetXml = this;
        var httpStatus;
        // var vov_xmlhttp = API.createXmlHttpRequest();
        var vov_xmlhttp = new XMLHttpRequest();
        // vov_xmlhttp.overrideMimeType('text/xml');
        
        vov_xmlhttp.onreadystatechange = function() {
        	
        	var errorMessage = null;
        	// alert("Ready xml "+fileUrl+" state "+vov_xmlhttp.readyState);
            if (vov_xmlhttp.readyState === 4) {
                try {
                    httpStatus = vov_xmlhttp.status;
                } catch (e) {
                    // This apparently happens when the request was aborted,
                    // so simply return
                    alert("VOView: Problem getting httpStatus");
                    return;
                }
                if (httpStatus === 200) {
                    var responseData = vov_xmlhttp.responseXML;
                    if (responseData !== null && responseData.documentElement !== null && responseData.documentElement.nodeName !== 'parsererror') {
                        dataCallBack(responseData);
                    } else {
                   		errorMessage = "VOView: Response from '" + fileUrl + "' is not XML? " + responseData;
                    }
                } else {
                	// SC_BAD_REQUEST = 400, using that to report error in params entered by user
                	if(httpStatus == 400 && vov_xmlhttp.responseText !== null){ 
                		errorMessage = vov_xmlhttp.responseText;
                	}else{
                		errorMessage = "VOView: Error getting xslt file " + fileUrl + ". Status: " + vov_xmlhttp.status;
                		if (httpStatus === 404 && fileUrl.match(/proxy.pl\?/)) {
                        	errorMessage += "\n\nProxy may not be properly installed.";
                        }
                	}
                }
            }
            
            if(errorMessage !== null){
            	errorCallBack(errorMessage);
            }
        };

        try {
            vov_xmlhttp.open("GET", fileUrl, true);
            vov_xmlhttp.setRequestHeader('Accept', 'text/xml');
        } catch (e) {
        	errorCallBack("VOView: Error opening '" + fileUrl + "':" + e.message);
//            alert("VOView: Error opening '" + fileUrl + "':" + e.message);
        }
        
        this.send = function() {
            vov_xmlhttp.send();
        };
        
    }
    return new GetXml(getXsltParams.fileUrl, getXsltParams.dataCallBack, getXsltParams.errorCallBack);
};

voview.prototype.selectSingleNode = function(inDoc, xpath) {
    var result;
    var e1, e2;

    // Mozilla version
    try {
        result = inDoc.evaluate(xpath, inDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (e) {
        e1 = e;
    }

    if (e1) {
        // IE version
        try {
            result = inDoc.selectSingleNode(xpath);
        } catch (e) {
            e2 = e;
        }
    }

    if (e1 && e2) {
        alert("VOView: Unable to execute selectSingleNode. Mozilla: " + e1.message + " IE: " + e2.message);
    }
    return result;
};

voview.prototype.selectNodes = function(inDoc, xpath) {
    var results = [];
    var e1, e2;
    var nodes;

    // Mozilla version
    try {
        nodes = inDoc.evaluate(xpath, inDoc, null, XPathResult.ANY_TYPE, null);
    } catch (e) {
        e1 = e;
    }

    if (!e1) {
        var result = nodes.iterateNext();
        while (result) {
            results.push(result);
            result = nodes.iterateNext();
        }
        return results;
    }

    // IE version
    try {
        results = inDoc.selectNodes(xpath);
    } catch (e) {
        e2 = e;
    }

    if (e1 && e2) {
        alert("VOView: Unable to execute selectSingleNode. Mozilla: " + e1.message + " IE: " + e2.message);
    }
    return results;
};

voview.prototype.getElementsByClass = function(searchClass, node, tag) {
    var classElements = [];
    if (node === undefined) {
        node = document;
    }
    if (tag === undefined) {
        tag = '*';
    }

    var els = node.getElementsByTagName(tag);
    var elsLen = els.length;
    for ( var i = 0, j = 0; i < elsLen; i++) {
        var className = els[i].className;
        if( className ){
        var classes = className.split(" ");
            for( var k = 0; k < classes.length; k++){
                if( classes[k] === searchClass ){
                    classElements[j] = els[i];
                    j++;
                }
            }
        }
    }
    return classElements;
};
/**
 * Helper function for instantiating a Filter object.
 * 
 * @param {XML DOM Object} filterParams.votableDOM The VOTABLE to be filtered.
 * @param {function} filterParams.filterCallback Function to call when the
 *            result of the filtering is completed. The one argument to this
 *            function is an XML DOM object of the filtered VOTABLE.
 * 
 * @returns {Filter} Newly created Filter object.
 */
voview.prototype.makeFilter = function(filterParams) {
    /**
     * @class Object for doing sorting, filtering and paging of a VOTABLE.
     * @see voview#makeFilter
     */
    function Filter(_votableDOM, filterCallback) {
        var meFilter = this;
        var preProcDOM = null;
        var preProcessed = false;
        var resultCallback = filterCallback;
        var votableDOM = _votableDOM;

        var filterDOM = null;
        var filtered = false;
        var filterProc = new XSLTProcessor();
        
        var rowProcessor = null;
        
        var constraints = {};
        var types = {};

        var range = { start: 1, stop: -1 };

        var sortColumns = null;

        var selectCriteria = null;

        var filteredTableDOM = null;

        function preProcessMod() {
            var xslTopNodes = preProcDOM.getElementsByTagName("stylesheet")[0];
        }

        function filterModify() {
            var columnNames = [];

            // Internal Functions

            function trim(str) {
                return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
            }

            function rangeConstraint(index, constraint, negate, prefix) {
                var fields = constraint.split("..", 2);
                var con;
                if (fields[0].length === 0 || fields[1].length === 0) {
                    return null;
                }
                if (negate) {
                    con = prefix + "TD[" + index + "]/@val >" + fields[0] + " or " + prefix + "TD[" + index + "]/@val >" + fields[1] + "";
                } else {
                    con = prefix + "TD[" + index + "]/@val >=" + fields[0] + " and " + prefix + "TD[" + index + "]/@val <=" + fields[1] + "";
                }
                return con;
            }

            function numConstraint(index, constraint, negate, prefix) {
                var numVals = constraint.split(/(\.\.|[<>]=?)/);
                var numVal;
                for ( var j = 0; j < numVals.length; j++) {
                    numVal = numVals[j];
                    if (numVal.match(/[eE]/) !== null) {
                        constraint = constraint.replace(numVal, parseFloat(numVal));
                    }
                }

                if (constraint.indexOf("..") > 0) {
                    return rangeConstraint(index, constraint, negate, prefix);
                }
                if (negate) {
                    if (constraint.substring(0, 2) === ">=") {
                        constraint = constraint.replace(">=", "<");
                    } else if (constraint.substring(0, 2) === "<=") {
                        constraint = constraint.replace("<=", ">");
                    } else if (constraint.substring(0, 1) === ">") {
                        constraint = constraint.replace(">", ">=");
                    } else if (constraint.substring(0, 1) === "<") {
                        constraint = constraint.replace("<", "<=");
                    } else if (constraint.substring(0, 1) !== "=") {
                        constraint = "!=" + constraint;
                    } else {
                        constraint = "!" + constraint;
                    }
                } else {
                    if (constraint.substring(0, 1) === ">") {
                        constraint = constraint.replace(">", ">");
                    } else if (constraint.substring(0, 1) === "<") {
                        constraint = constraint.replace("<", "<");
                    } else if (constraint.substring(0, 1) !== "=") {
                        constraint = "=" + constraint;
                    }
                }
                constraint = prefix + "TD[" + index + "]/@val" + constraint;
                return constraint;
            }

            function wildCardConstraint(index, constraint, negate, prefix) {
                var fields = constraint.split("*");
                var out = [];
                out.push("position() = " + index);

                var inner = "translate(normalize-space(),$lc,$uc)";
                if (fields[0]) {
                    inner = "(" + inner + ",'" + fields[0] + "')";
                    out.push("starts-with" + inner);
                    inner = "substring-after" + inner;
                }
                for ( var j = 1; j < fields.length - 1; j += 1) {
                    if (fields[j]) {
                        inner = "(" + inner + ",'" + fields[j] + "')";
                        out.push("contains" + inner);
                        inner = "substring-after" + inner;
                    }
                }
                if (fields[fields.length - 1]) {
                    inner = "(concat(" + inner + ",'a'),'" + fields[fields.length - 1] + "a')";
                    out.push("contains" + inner);
                }

                if (out.length === 1) {
                    // no constraints (this can happen with a value like "*" or
                    // "**")
                    return null;
                }
                if (negate) {
                    var p = out[0];
                    out.splice(0, 1);
                    out = p + " and not(" + out.join(" and ") + ")";
                } else {
                    out = out.join(" and ");
                }
                return prefix + "TD[" + out + "]";
            }

            function stdCharConstraint(index, constraint, negate, prefix) {
                constraint = trim(constraint);
                if (negate) {
                    return "translate(normalize-space(" + prefix + "TD[" + index + "]), $lc, $uc)!='" + constraint + "'";
                }
                return "translate(normalize-space(" + prefix + "TD[" + index + "]), $lc, $uc)='" + constraint + "'";
            }

            // Handle a constraint on a character column
            function charConstraint(index, constraint, negate, prefix) {
                constraint = constraint.toUpperCase();
                if (constraint.indexOf('*') >= 0) {
                    return wildCardConstraint(index, constraint, negate, prefix);
                }
                return stdCharConstraint(index, constraint, negate, prefix);
            }

            // Convert a single constraint into appropriate XSLT filter
            // elements.
            function makeXSLConstraint(index, constraint, isChar, prefix) {
                var negate;
                if (constraint.length === 0) {
                    return null;
                }
                if (constraint.substring(0, 1) === '!') {
                    negate = true;
                    constraint = constraint.substring(1);
                } else {
                    negate = false;
                }
                if (constraint.substring(0, 1) === '=') {
                    constraint = constraint.substring(1);
                }
                if (constraint.length === 0) {
                    return null;
                }
                if (isChar) {
                    return charConstraint(index, constraint, negate, prefix);
                }
                return numConstraint(index, constraint, negate, prefix);
            }

            function makeOneConstraint(prefix, suffix) {
                var all = [];
                var index;
                for ( var column in constraints) {
                    if (column.length > 0) {
                        index = column;
                        if (isNaN(+column)) {
                            index = 0;
                            while (columnNames[index] !== column && index < columnNames.length) {
                                index = index + 1;
                            }
                            index = index + 1;
                        }

                        var con = makeXSLConstraint(index, constraints[column], types[column], prefix);
                        if (con !== null) {
                            all.push([ con.length, con ]);
                        }
                    }
                }
                if (all.length) {
                    // sort to put shortest constraints (presumably fastest)
                    // first
                    var sortfunc = function(a, b) {
                        return a[0] - b[0];
                    };
                    all.sort(sortfunc);
                    // get rid of the lengths
                    for ( var j = 0; j < all.length; j += 1) {
                        all[j] = all[j][1];
                    }
                    var full = all.join(" and ");
                    return full;
                }
                return "";
            }

            // End Internal Functions

            var nsprefixes = [ "", "vo:", "v1:", "v2:", "v3:", "v4:" ];
            var nssuffixes = [ "", "0", "1", "2", "3", "4" ];

            // Populate array mapping column names with numbers (ie order)
            var fieldElements = votableDOM.getElementsByTagName("FIELD");
            var fieldAttribs;
            for ( var ifield = 0; ifield < fieldElements.length; ifield++) {
                fieldAttribs = fieldElements[ifield].attributes;
                columnNames.push(fieldAttribs.getNamedItem("name").value);
            }

            var xslgen = [];
            // build separate constraint variables for each possible namespace
            // prefix
            // this is repetitive, but time is negligible here (and long in
            // XSLT)
            for ( var i = 0; i < nsprefixes.length; i += 1) {
                xslgen[i] = makeOneConstraint(nsprefixes[i], nssuffixes[i]);
            }

            // Replace the dummy values in the xslt stylesheet with the
            // generated filter expressions

            var xslVarNodes = filterDOM.documentElement.getElementsByTagName("xsl:variable");
            if (!xslVarNodes || xslVarNodes.length === 0) {
                // alert("second try");
                xslVarNodes = filterDOM.documentElement.getElementsByTagName("variable");
            }
            // alert("xslVarNodes.length: "+xslVarNodes.length);
            for ( var node = 0; node < xslVarNodes.length; node = node + 1) {
                var varNode = xslVarNodes[node];
                var nodeName = varNode.getAttribute("name");
                var matchResults = nodeName.match(/filterRows(\d?)/);
                if (matchResults) {
                    var nsIndex = matchResults[1] - 1 + 2;
                    if (matchResults[1] === "") {
                        nsIndex = 0;
                    } else if (nsIndex <= 0 || nsIndex >= nsprefixes.length) {
                        alert("VOView: Filter error editing expressions in xslt.");
                    }
                    var selectNode = varNode.getAttributeNode("select");
                    if (xslgen[nsIndex] === "") {
                        selectNode.nodeValue = "$allRows" + matchResults[1];
                    } else {
                        selectNode.nodeValue = "$allRows" + matchResults[1] + "[" + xslgen[nsIndex] + "]";
                    }
                }
            }
        }

        function preprocess() {
            var tempDOM;
            if (!preProcessed) {
                preProcessed = true;
                preProcessMod();
                var preProcessor = new XSLTProcessor();
                try {
                    preProcessor.importStylesheet(preProcDOM);
                    tempDOM = preProcessor.transformToDocument(votableDOM);
                    votableDOM = tempDOM;
                } catch (e1) {
                    alert("VOView: Error preprocessing XML doc: " + e1.message);
                }
            }
        }

        function ready() {
            var tempDOM;
            var xmlstring;
            // alert("ready called filterDOM = "+filterDOM+", preProcDOM =
            // "+preProcDOM);
            if (filterDOM !== null && preProcDOM !== null) {
                // Do the actual filtering work and call back with the result.
                preprocess();

                if (!filtered) {
                    filtered = true;

                    /**
                     * Debug printout
                     */
                    var debugElement = document.getElementById("debug_output");
                    if( debugElement ){
                        xmlstring = (new XMLSerializer()).serializeToString(filterDOM);
                        xmlstring = xmlstring.replace(/</g,"&lt;"); 
                        xmlstring = xmlstring.replace(/>/g,"&gt;\n");
                        xmlstring = debugElement.innerHTML + 
                            "\nFilter DOM before modify:\n\n" + xmlstring;
                        debugElement.innerHTML = xmlstring;
                    }
                    
                    filterModify();

                    /**
                     * Debug printout
                     */
                    if( debugElement ){
                        xmlstring = (new XMLSerializer()).serializeToString(filterDOM);
                        xmlstring = xmlstring.replace(/</g, "&lt;");
                        xmlstring = xmlstring.replace(/>/g, "&gt;\n");
                        xmlstring = debugElement.innerHTML +
                            "\nFilter DOM after modify:\n\n" + xmlstring;
                        debugElement.innerHTML = xmlstring;                        
                    }

                    if (filterProc.reset) {
                        filterProc.reset();
                    }
                    try {
                        filterProc.importStylesheet(filterDOM);

                        try {
                            filterProc.clearParameters();
                            if (sortColumns !== null && sortColumns.length > 0) {
                                filterProc.setParameter(null, "sortColumn", sortColumns[0].column);
                                filterProc.setParameter(null, "sortOrder", sortColumns[0].direction);
                            }
                            if (range.stop >= 0) {
                                filterProc.setParameter(null, "pageStart", range.start);
                                filterProc.setParameter(null, "pageEnd", range.stop);
                            }
                            if (selectCriteria !== null) {
                                filterProc.setParameter(null, "selectAllCriteria", selectCriteria);
                            }
                            filteredTableDOM = filterProc.transformToDocument(votableDOM);
                        } catch (e2) {
                            alert("VOView: Error processing votable DOM thru Filter: " + e2.message);
                        }
                    } catch (e3) {
                        alert("VOView: Error parsing filter XSLT: " + e3.message + "\n\nPossible filter expression syntax error.");
                    }
                }

                resultCallback(filteredTableDOM);
            }
        }

        /**
         * Produces a single page's worth of VOTABLE data. After filtering is
         * complete, the filterCallback function is called with the results.
         * 
         * @param {function} filterParams.filterCallback Function to call when
         *            the result of the filtering is completed. The one argument
         *            to this function is an XML DOM object of the filtered
         *            VOTABLE. If omitted then use function specified in
         *            constructor.
         */
        this.doFilter = function(filterParams) {
            var filterDOMCallback = function(data) {
                filterDOM = data;
                ready();
            };

            var preprocDOMCallback = function(data) {
                preProcDOM = data;
                ready();
            };

            if (filterParams !== undefined && filterParams.filterCallback !== undefined) {
                resultCallback = filterParams.filterCallback;
            }
            if (filterDOM === null) {
                if (voview.filter_xsl) {
                    var filterParser = new DOMParser();
                    filterDOM = filterParser.parseFromString(voview.filter_xsl, "text/xml");
                } else {
                    var filterGet = meFilter.makeGetXml({ fileUrl: "xsl/filter.xsl",
                        dataCallBack: filterDOMCallback, errorCallBack: errorCallBack });
                    filterGet.send();
                }
            }
            if (preProcDOM === null) {
                if (voview.preproc_xsl) {
                    var preProcParser = new DOMParser();
                    preProcDOM = preProcParser.parseFromString(voview.preproc_xsl, "text/xml");
                } else {
                    var preprocGet = meFilter.makeGetXml({ fileUrl: "xsl/preProcess.xsl",
                        dataCallBack: preprocDOMCallback, errorCallBack: errorCallBack });
                    preprocGet.send();
                }
            }
            ready();
        };

        /**
         * Set column value filters on the VOTABLE. Any filters all ready set on
         * columns not specified in the filterKeys are retained.
         * 
         * @param {setFilterParams.filterKeys[]} filterKeys An array of type
         *            columnFilterKey.
         */
        this.setColumnFilters = function(setFilterParams) {
            for ( var i = 0; i < setFilterParams.filterKeys.length; i = i + 1) {
                var key = setFilterParams.filterKeys[i];
                if (constraints[key.column] !== key.expression) {
                    constraints[key.column] = key.expression;
                    types[key.column] = key.isCharType;
                    filtered = false;
                }
            }
        };

        /**
         * Clear any column value filters currently set on the VOTABLE.
         */
        this.clearColumnFilters = function() {
            constraints = {};
            types = {};
            filtered = false;
        };

        /**
         * Set range of rows to be extracted from the VOTABLE.
         * 
         * @param {integer} setRangeParam.firstRow The first row of the range.
         * @param {integer} setRangeParam.lastRow The last row of the range.
         */
        this.setRowRange = function(setRangeParam) {
            if (range.start !== setRangeParam.firstRow || range.stop !== setRangeParam.lastRow) {
                range.start = setRangeParam.firstRow;
                range.stop = setRangeParam.lastRow;
                filtered = false;
            }
        };

        /**
         * Set the columns to use for sorting the table, and the sorting
         * direction for each column.
         * 
         * @param {setSortParams.sortKeys[]} sortKeys An array of type
         *            sortColumnKey. The first key in the array has the highest
         *            precedence.
         */
        this.setSortColumns = function(setSortParams) {
            if (sortColumns !== null) {
                var numCols = sortColumns.length;
                for ( var ikey = 0; ikey < setSortParams.sortKeys.length; ikey = ikey + 1) {
                    if (ikey >= numCols || !sortColumns[ikey].equals(setSortParams.sortKeys[ikey])) {
                        filtered = false;
                    }
                }
            } else {
                filtered = false;
            }
            sortColumns = setSortParams.sortKeys;
        };

        /**
         * Set the criteria which determines which rows will be selected when
         * the "select all" button is activated. **ONLY string argument is
         * currently implemented**
         * 
         * @param {string|function} setSelectParams.criteria If a string, use it
         *            to match against the contents of the VOTABLE row. The
         *            contents of the VOTABLE XML row will be searched and the
         *            row will be selected if it contains the input string. If a
         *            function, then a function which will be called for each
         *            row in the XML VOTABLE, with an XML DOM object of the row
         *            as its only argument. The function should return a boolean
         *            indicating whether the row should be selected or not.
         */
        this.setSelectRows = function(setSelectParams) {
            if (setSelectParams.criteria !== selectCriteria) {
                selectCriteria = setSelectParams.criteria;
                filtered = false;
            }
        };

        /**
         * Set the VO table used as input to the filter. Once in a table is
         * specified, flags are set so that the table will be reprocessed and
         * filtered when the doFilter method is called.
         * 
         * @param {XML DOM Object} setInputParams.tableDOM The XML Dom object
         *            for the input VOTABLE.
         */
        this.setInputTable = function(setInputParams) {
            votableDOM = setInputParams.tableDOM;
            preProcessed = false;
            filtered = false;
        };
        
        this.getRowValues = function(rowNumber){
            if(rowProcessor === null){
                rowProcessor = new XSLTProcessor();
                var rowProcParser = new DOMParser();
                var rowProcDOM = rowProcParser.parseFromString(voview.getTableRow_xsl, "text/xml");
                /**
                 * Debug printout
                 */
                var xmlstring;
                var debugElement = document.getElementById("debug_output");
                if( debugElement ){
                    xmlstring = (new XMLSerializer()).serializeToString(rowProcDOM);
                    xmlstring = xmlstring.replace(/</g,"&lt;"); 
                    xmlstring = xmlstring.replace(/>/g,"&gt;\n");
                    xmlstring = debugElement.innerHTML + 
                        "\nRow Processing DOM:\n\n" + xmlstring;
                    debugElement.innerHTML = xmlstring;
                }

                rowProcessor.importStylesheet(rowProcDOM);
            }
            
            rowProcessor.setParameter(null, "rowNumber", rowNumber);
            var rowDom = rowProcessor.transformToDocument(votableDOM);
            var columns = rowDom.getElementsByTagName("TD");
            var values = [];
            for(var icol=0; icol<columns.length; icol++){
                var column = columns[icol];
                if( column.hasChildNodes() ){
                    values.push( column.childNodes[0].nodeValue );
                }else{
                    values.push(null);
                }
            }
            
            return values;
        }; 
    }
    /**
     * Prototype inheritance of voview object methods.
     */
    Filter.prototype = this;
    return new Filter(filterParams.votableDOM, filterParams.filterCallback);
};
/**
 * Helper function for instantiating a Renderer object.
 * 
 * @param {Filter} rendererParams.filterObject Filter object to be used for
 *            generating filter tables from the original VOTABLE.
 * 
 * @returns {Renderer} Newly created Renderer object.
 * 
 */
voview.prototype.makeRenderer = function(rendererParams) {
    /**
     * @class Object used for rendering the HTML display for VOView. Also
     *        contains the callback methods that are embedded as javascript in
     *        the HTML display.
     * @param {Filter} filterObject Filter object to be used for generating
     *            filtered tables from the original VOTABLE.
     * 
     */
    function Renderer(_filterObject, objectName, widgetIDprefix) {
        var meRenderer = this;
        var filterObject = _filterObject;
        var renderDOM = null;
        var renderProcessor = new XSLTProcessor();
        var resultCallback = null;
        var filteredDOM = null;
        var fieldOrder;
        var fieldUCD;
        var fieldNames;
        var fieldColumn;
        var maxColumns = null;
        var columnOrder = null;
        var filterText = "";
        var titleText = null;
        var columnFormats = [];
        var colFormatTypes = [];
        var selectedRows = {};
        var allRowsSelected = false;
        var rowSelection = false;
        var updateCallback = null;

        // Default row range
        filterObject.setRowRange({ firstRow: 1, lastRow: 10 });

        /*
         * Function which takes the filtered VOTABLE and generates the HTML for
         * the page to be displayed.
         * 
         * @param {XML Dom object} _filteredDOM The filtered VOTABLE.
         */
        function renderTable(_filteredDOM) {
            filteredDOM = _filteredDOM;
            meRenderer.setTitle(titleText);

            var fields = meRenderer.selectNodes(filteredDOM, "//*[local-name()='FIELD']");
            fieldNames = [];
            fieldUCD = [];
            fieldOrder = {};
            for ( var i = 0; i < fields.length; i++) {
                fieldNames[i] = fields[i].getAttribute("name");
                fieldOrder[fields[i].getAttribute("name")] = i + 1;
                if (fields[i].getAttribute("ucd")) {
                    fieldUCD[i + 1] = fields[i].getAttribute("ucd");
                }
            }

            if (columnOrder !== null && typeof (columnOrder[0]) !== "number") {
                for ( var j = 0; j < columnOrder.length; j++) {
                    columnOrder[j] = fieldOrder[columnOrder[j]];
                }
            }
            
            if (columnOrder === null) {
                columnOrder = [];
                for ( var k = 0; k < fields.length; k++) {
                    columnOrder[k] = k + 1;
                }
            }
            
            fieldColumn = [];
            for ( var j = 0; j < columnOrder.length; j++) {
                fieldColumn[columnOrder[j]] = j;
            }
                

            var displayFragment = null;
            if (renderDOM !== null) {
                /**
                 * Debug printout
                 */
                var xmlstring;
                var debugElement = document.getElementById("debug_output");
                if( debugElement ){
                    xmlstring = (new XMLSerializer()).serializeToString(renderDOM);
                    xmlstring = xmlstring.replace(/</g,"&lt;"); 
                    xmlstring = xmlstring.replace(/>/g,"&gt;\n");
                    xmlstring = debugElement.innerHTML + 
                        "\nRenderer DOM:\n\n" + xmlstring;
                    debugElement.innerHTML = xmlstring;
                }
                
                if (renderProcessor.reset) {
                    renderProcessor.reset();
                }
                try {
                    renderProcessor.importStylesheet(renderDOM);

                    renderProcessor.setParameter(null, "pageCallback", objectName + ".renderObject.newPage");
                    renderProcessor.setParameter(null, "setPageLength", objectName + ".renderObject.setPageLength");
                    renderProcessor.setParameter(null, "setMaxColumnsCallback",
                            objectName + ".renderObject.setMaxColumns");
                    renderProcessor.setParameter(null, "sortCallback", objectName + ".renderObject.sortTable");
                    renderProcessor.setParameter(null, "sortCallback", objectName + ".renderObject.sortTable");

                    renderProcessor.setParameter(null, "filterCallback", objectName + ".renderObject.filterByColumn");
                    renderProcessor.setParameter(null, "filterResetCallback", objectName + ".renderObject.filterReset");

                    renderProcessor.setParameter(null, "clickClearCallback", objectName + ".renderObject.clickClear");
                    renderProcessor.setParameter(null, "clickResetCallback", objectName + ".renderObject.clickRecall");

                    renderProcessor.setParameter(null, "widgetIDprefix", widgetIDprefix);
                    renderProcessor.setParameter(null, "filterText", filterText);

                    renderProcessor.setParameter(null, "titleText", titleText);

                    if (maxColumns !== null) {
                        renderProcessor.setParameter(null, "maxColumns", maxColumns);
                    }
                    if (columnOrder !== null) {
                        renderProcessor.setParameter(null, "columnOrder", columnOrder.join(","));
                    }
                    renderProcessor.setParameter(null, "resetColumnOrderCallback",
                            objectName + ".renderObject.resetColumnOrder");

                    displayFragment = renderProcessor.transformToDocument(filteredDOM);
                    
                    /**
                     * Debug printout
                     */
                    if( debugElement ){
                        xmlstring = (new XMLSerializer()).serializeToString(displayFragment);
                        xmlstring = xmlstring.replace(/</g,"&lt;"); 
                        xmlstring = xmlstring.replace(/>/g,"&gt;\n");
                        xmlstring = debugElement.innerHTML + 
                            "\nDisplay fragment DOM::\n\n" + xmlstring;
                        debugElement.innerHTML = xmlstring;
                    }

                } catch (e1) {
                    alert("VOView: Error rendering XML doc: " + e1.message);
                }
            }            

            resultCallback(displayFragment);
        }

        /**
         * Callback function for tableDnD, which reads the column order from the
         * column table and sets the order in the renderer object.
         * 
         * @param {HTML Dom object} table The column table.
         * @param {HTML Dom object} row The row of the column table that was
         *            moved.
         */
        function setColumnOrder(table, row) {
            // determine the column order from the table
            var rows = table.tBodies[0].rows;
            var maxcolumns = rows.length - 1;
            var order = [];
            for ( var i = 0; i < rows.length; i++) {
                var classname = rows[i].className || "";
                if (classname.indexOf("separator") >= 0) {
                    maxcolumns = i;
                } else {
                    // ID for row is 'fieldrow_<number>'
                    var f = rows[i].id.split('_');
                    order.push(parseInt(f[f.length - 1], 10));
                }
            }
            if(maxcolumns === 0){
                maxcolumns = 1;
            }
            
            meRenderer.setDisplayedColumns(order);
            meRenderer.setDisplayedColumns(maxcolumns);
            meRenderer.render();
        }

        function applyUserFormats(tableDiv) {
            var tables = tableDiv.getElementsByTagName("table");
            var rows = tables[0].rows;

            if (colFormatTypes.length > 0) {

                for ( var ifield = 0; ifield < fieldNames.length; ifield++) {
                    var format = null;
                    for ( var iformat = 0; iformat < colFormatTypes.length; iformat++) {
                        var apply = false;
                        var formatType = colFormatTypes[iformat];
                        switch (typeof formatType) {
                        case "number":
                            apply = formatType === ifield;
                            break;
                        case "string":
                            apply = formatType === fieldNames[ifield];
                            break;
                        // Safari thinks that a regex has a type of 'function'
                        case "object":
                        case "function":
                            apply = formatType.test(fieldNames[ifield]);
                            break;
                        }
                        if (apply) {
                            format = columnFormats[iformat];
                            break;
                        }
                    }

                    if (format !== null) {
                        for ( var irow = 0; irow < rows.length; irow++) {
                            if (rows[irow].parentNode.tagName === "TBODY") {
                                var icolumn = fieldColumn[ifield+1];
                                var cells = rows[irow].cells;
                                switch (typeof format) {
                                case "string":
                                    cells[icolumn].innerHTML = format.replace(/@@/g, cells[icolumn].innerHTML);
                                    break;
                                case "function":
                                    format(cells[icolumn]);
                                    break;
                                }
                             }
                        }
                    }
                }
            }
            
            if(rowSelection){
                for ( var jrow = 0; jrow < rows.length; jrow++) {
                    if (rows[jrow].parentNode.tagName === "TBODY") {
                        rows[jrow].innerHTML = "<td></td>" + rows[jrow].innerHTML;
                        addRowSelection(rows[jrow].cells[0]);
                    }
                    if ((rows[jrow].parentNode.tagName === "THEAD") || (rows[jrow].parentNode.tagName === "TFOOT")) {
                        if (rows[jrow].id == "filterRow") {
                           rows[jrow].innerHTML = "<td></td>" + rows[jrow].innerHTML;
                        } else if (rows[jrow].parentNode.tagName === "TFOOT") {   
                           rows[jrow].innerHTML = "<th></th>" + rows[jrow].innerHTML;
                        } else {                           
                          if (allRowsSelected) {
                             rows[jrow].innerHTML = "<th><input type=\"checkbox\" name=\"selectAllCheckbox\" onclick=\""+objectName+".renderObject.clearRowSelection(); return false; \"></th>" + rows[jrow].innerHTML;                             
                             var checkboxes = document.getElementsByName('selectAllCheckbox'); 
                             for ( var k = 0; k< checkboxes.length; k++) {
                                checkboxes[k].checked=true;
                             }
                          } else {
                             rows[jrow].innerHTML = "<th><input type=\"checkbox\" name=\"selectAllCheckbox\" onclick=\""+objectName+".renderObject.selectAllRows(); return false; \"></th>" + rows[jrow].innerHTML;
                          } 
                        }
                    }                    
                }
            }
        }

        /**
         * Callback function which takes the XML document containing the
         * rendered HTML for the display, and places it in the web page.
         * Different parts of the display can be placed at different locations
         * in the web page based on the IDs of various divs specified in the web
         * page.
         * 
         * @param {XML Dom object} xmlDoc XML document containing the rendered
         *            HTML.
         */
        this.displayHTML = function(xmlDoc) {
            var docElements;
            var widgetName;
            var fragElement;

            var element = meRenderer.selectSingleNode(xmlDoc, "//form[@name='widgets']/input[@name='widget_names']");
            var subwidgets = element.getAttribute("value").split(",");
            for ( var i = 0; i < subwidgets.length; i++) {
                // First time thru, need to delete the "all" widget, because it
                // contains the other widgets
                if (i === 0) {
                    var allElement = null;
                    allElement = document.getElementById(widgetIDprefix);
                    if (allElement) {
                        allElement.innerHTML = "";
                    }
                }

                if (subwidgets[i] === "all") {
                    widgetName = widgetIDprefix;
                } else {
                    widgetName = widgetIDprefix + "_" + subwidgets[i];
                }

                docElements = meRenderer.getElementsByClass(widgetName);
                if (docElements.length > 0) {
                    fragElement = meRenderer.selectSingleNode(xmlDoc, "//*[@id=\"" + widgetName + "\"]")
                            .cloneNode(true);
                    for ( var j = 0; j < docElements.length; j++) {
                        docElements[j].innerHTML = (new XMLSerializer()).serializeToString(fragElement);
                    }

                    var divs = document.getElementsByTagName("div");
                    var tableDivs = [];
                    var buttonDivs = [];
                    var idiv;
                    for (idiv = 0; idiv < divs.length; idiv++) {
                        if (divs[idiv].id === widgetIDprefix + "_table") {
                            tableDivs.push(divs[idiv]);
                        }
                        if (divs[idiv].id === widgetIDprefix + "_filterButtons") {
                            buttonDivs.push(divs[idiv]);
                        }
                    }

                    for (idiv = 0; idiv < tableDivs.length; idiv++) {
                        // Apply user formatting to table cells
                        applyUserFormats(tableDivs[idiv]);
                        var table = tableDivs[idiv].getElementsByTagName("table")[0];

                        // Make table columns draggable.
                        dragtable.makeDraggable(table);
                    }
                }
            }

            var ftable = document.getElementById('voview_column_fields');
            if (ftable) {
                var tablednd = new TableDnD.TableDnD();
                tablednd.onDrop = setColumnOrder;
                tablednd.init(ftable);
            }
            
            if( updateCallback !== null ){
                updateCallback();
            }
        };

        /**
         * Webpage callback function which instructs VOView to display a new
         * page of the VOTABLE.
         * 
         * @param {integer} pageNumber The page of the table to display.
         */
        this.newPage = function(pageNumber) {
            var startElement = meRenderer.selectSingleNode(filteredDOM, "//*[@ID='VOV:PageStart']");
            var pageStart = Number(startElement.getAttribute("value"));
            var endElement = meRenderer.selectSingleNode(filteredDOM, "//*[@ID='VOV:PageEnd']");
            var pageEnd = Number(endElement.getAttribute("value"));

            var newStart = (pageEnd - pageStart + 1) * (pageNumber - 1) + 1;
            var newEnd = (pageEnd - pageStart + 1) * (pageNumber);
            filterObject.setRowRange({ firstRow: newStart, lastRow: newEnd });

            meRenderer.render();
            return false;
        };

        /**
         * Set the maximum number of columns shown in the VOView display. The
         * display is then rendered with the new setting.
         * 
         * @param {integer} columns Maximum number of columns shown in the
         *            display.
         */
        this.setMaxColumns = function(_maxColumns) {
            maxColumns = _maxColumns;
            meRenderer.render();
        };

        /**
         * Set the order and number of columns to display.
         * 
         * @param {integer[]|string[]|integer} columnInfo If an array, contains
         *            a list of columns in the order in which they are to
         *            appear. If an integer array, the numbers correspond to the
         *            original order of the columns in the VOTABLE. If a string
         *            array, the strings must correspond to column names. If a
         *            scalar integer, then this value sets the maximum number of
         *            columns to initially display in the HTML table.
         */
        this.setDisplayedColumns = function(columnInfo) {
            if (typeof (columnInfo) === "number") {
                maxColumns = columnInfo;
            } else if (columnInfo.length) {
                columnOrder = columnInfo;
            } else {
                alert("VOView: columnInfo must be an integer or array");
            }
        };

        /**
         * Reset the column order and maximum number of columns displayed to
         * their default settings, and then render the table.
         */
        this.resetColumnOrder = function() {
            columnOrder = null;
            maxColumns = null;
            meRenderer.render();
        };

        /**
         * Set the number of rows shown in a single page in the VOView display,
         * and then render the table with the new settings.
         * 
         * @param {integer} pageLength The number of rows in a single page in
         *            the VOView display.
         */
        this.setPageLength = function(pageLength) {
            var startElement = meRenderer.selectSingleNode(filteredDOM, "//*[@ID='VOV:PageStart']");
            var pageStart = Number(startElement.getAttribute("value"));
            var length = Number(pageLength);

            var currentPage = Math.ceil(pageStart / pageLength);

            var newStart = length * (currentPage - 1) + 1;
            var newEnd = length * currentPage;
            filterObject.setRowRange({ firstRow: newStart, lastRow: newEnd });

            meRenderer.render();
        };

        /**
         * Set the column to use for sorting the VOTABLE, based on information
         * in the supplied column header element. If this column is already the
         * column being used for sorting, then toggle the sorting direction. The
         * table is then re-rendered.
         * 
         * @param {HTML DOM element} headElement HTML Dom element of the header
         *            cell of the column to be used for sorting.
         */
        this.sortTable = function(headElement) {
            var direction;
            var keys = [];
            if (headElement.className.indexOf("ascending") !== -1) {
                direction = "descending";
            } else {
                direction = "ascending";
            }

            var key = meRenderer.makeSortColumnKey({ column: headElement.innerHTML, direction: direction });
            keys.push(key);

            filterObject.setSortColumns({ sortKeys: keys });
            meRenderer.render();
        };

        /**
         * Takes the form embedded in the VO table display that contains the
         * column filtering expressions, And transforms them into
         * columnFilterKey objects which are then passed to the Filter object
         * for filtering of the table. Coordinate values in sexigesimal format
         * are first converted into decimal format.
         * 
         * @param {HTML DOM form} form The HTML form element containing the
         *            column filter inputs.
         */
        this.filterByColumn = function(form) {
            var keys = [];
            var el;
            var decimal;
            var components;

            filterText = "";

            for ( var j = 0; j < form.elements.length; j++) {
                el = form.elements[j];
                if (el.tagName === "INPUT" && el.type === "text" && !el.className.match("defaultComment")) {
                    var constraint = el.value;
                    if (constraint) {
                        // field number is in trailing digits
                        var i = parseInt(el.name.replace(/.*[^0-9]/, ""), 10);

                        var isCharType = form.elements[el.name + "_type"].value;
                        isCharType.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
                        if (isCharType.toLowerCase() === "false") {
                            isCharType = false;
                        } else {
                            isCharType = true;
                        }

                        filterText = filterText + "|" + i + ":" + constraint;

                        if (!isCharType && fieldUCD[i] && fieldUCD[i].match(/pos.*eq.*main/i) !== null) {
                            var sexigesimal = constraint.match(/\d+:\d+:\d*\.?[\d ]+/g);
                            if (sexigesimal !== null) {
                                for ( var k = 0; k < sexigesimal.length; k++) {
                                    components = sexigesimal[k].split(":");
                                    decimal = Number(components[0]) + Number(components[1]) / 60 + Number(components[2]) / 3600;
                                    if (fieldUCD[i].match(/ra[\._]/i) !== null) {
                                        decimal = decimal * 360 / 24;
                                    }
                                    constraint = constraint.replace(sexigesimal[k], decimal);
                                }
                            }
                        }

                        var key = meRenderer.makeColumnFilterKey({ column: i, expression: constraint,
                            isCharType: isCharType });
                        keys.push(key);
                    }
                }
            }

            if (filterText !== "") {
                filterText = filterText + "|";
            }

            filterObject.clearColumnFilters();
            filterObject.setColumnFilters({ filterKeys: keys });
            meRenderer.render();
        };

        /**
         * Clear all column filters, so that the entire VOTABLE is available.
         */
        this.filterReset = function() {
            filterObject.clearColumnFilters();
            filterText = "";
            meRenderer.render();
        };

        this.clearFilterText = function() {
            filterObject.clearColumnFilters();
            filterText = "";
        };
        
        /**
         * Initiate sequence of events for rendering a table.
         * 
         * @param {function} renderParams.renderCallback Function to be called
         *            after the table is rendered. The sole argument is in the
         *            XML Dom object containing the HTML for the rendered table.
         *            This callback function is generally used to insert the
         *            HTML for the table into the desired webpage.
         */
        this.render = function(renderParams) {
            if (renderParams !== undefined && renderParams.renderCallback !== undefined) {
                resultCallback = renderParams.renderCallback;
            }

            if (renderDOM === null) {
                if (voview.renderer_xsl) {
                    var renderParser = new DOMParser();
                    renderDOM = renderParser.parseFromString(voview.renderer_xsl, "text/xml");
                    filterObject.doFilter({ filterCallback: renderTable });
                } else {
                    var renderDOMCallback = function(data) {
                        renderDOM = data;
                        filterObject.doFilter({ filterCallback: renderTable });
                    };

                    var renderGet = meRenderer.makeGetXml({ fileUrl: "xsl/renderer.xsl",
                        dataCallBack: renderDOMCallback, errorCallBack: errorCallBack });
                    renderGet.send();
                }
            } else {
                filterObject.doFilter({ filterCallback: renderTable });
            }

        };

        /**
         * Function used by input elements as the "onclick" method for managing
         * default comments which disappear when the user clicks in the input
         * field.
         * 
         * @param {HTML input element} thisfield The input element.
         * 
         * @param {string} defaulttext The default text for this input element.
         */
        this.clickClear = function(thisfield, defaulttext) {
            if (thisfield.value === defaulttext) {
                thisfield.value = "";
                var className = thisfield.className;
                thisfield.className = className.replace(/ *defaultComment */g, " ");
            }
        };

        /**
         * Function used by input elements as the "onblur" method for managing
         * default comments which disappear when the user clicks in the input
         * field.
         * 
         * @param {HTML input element} thisfield The input element.
         * 
         * @param {string} defaulttext The default text for this input element.
         */
        this.clickRecall = function(thisfield, defaulttext) {
            if (thisfield.value === "") {
                thisfield.value = defaulttext;
                thisfield.className = thisfield.className + " defaultComment";
            }
        };

        /**
         * Set the title of the VOView table display. If an argument is
         * supplied, this is used as the title. Otherwise, the method attempts
         * to extract the DESCRIPTION field from the VOTABLE to use as the
         * title. If this is not available, it uses the table URL as the title.
         * If no URL is available the title is left blank.
         * 
         * @param {string} title The title to be used for the table.
         */
        this.setTitle = function(title) {
            if (title != undefined) {
                titleText = title;
                return;
            }

            if (filteredDOM !== null) {
                var nodes = meRenderer.selectNodes(filteredDOM, "//*[local-name()='TABLE']/DESCRIPTION/text()");
                if (nodes.length > 0) {
                    titleText = nodes[0].nodeValue;
                    return;
                }
            }

            if (meRenderer.votableUrl !== null) {
                // Remove the proxy stuff if it was inserted
                var url;
                var proxyExpression = /proxy\.pl\?(.*)/;

                if (proxyExpression.test(meRenderer.votableUrl)) {
                    url = RegExp.$1;
                    url = decodeURIComponent(url);
                } else {
                    url = meRenderer.votableUrl;
                }

                titleText = url.match(/[^\/]*$/)[0];
                return;
            }

            titleText = "";
        };

        /**
         * Add additional formatting to a column. The function can be called
         * when formatting the column, which can be used for formatting other
         * parts of the road as well, e.g. an empty column at the beginning of
         * the table if it exists.
         * 
         * @param column {String|integer|Regex} Column to be formatted. This can
         *            be specified either as: 1) an integer (the column number
         *            in the original order); 2) a string matching a substring
         *            of the column name; 3) a regular expression matching the
         *            column name.
         * 
         * @param format {String|function} The formatting information for the
         *            column. This can be either: 1) as string, in which case it
         *            will replace the current value of the column. If the
         *            string contains "@@", it will be replaced by the current
         *            column value; 2) a function, in which case the function
         *            will be called with the DOM element of the table cell as
         *            its only argument.
         */
        this.columnFormat = function(column, format) {
            colFormatTypes.push(column);
            columnFormats.push(format);
        };

        /**
         * Mark a row as selected.
         * 
         * @param rowElem {HTML Dom Element} Dom element pointing to the row (i.e. the
         *            TR element) to be selected.
         */
        this.selectRow = function(rowElem) {
            var inputElems = rowElem.getElementsByTagName("input");
            // only allow row selection in rows with a checkbox
            if (inputElems.length === 0) {
                return;
            }

            var rowNum = rowElem.id;
            rowNum = rowNum.replace("vov_", "");

            var className = rowElem.className;
            if (className.match(/selectedimage/) !== null) {
                rowElem.className = className.replace(/ *selectedimage */, "");
                inputElems[0].checked = false;
                selectedRows[rowNum] = 0;
                if (allRowsSelected) {
                   allRowsSelected = false;
                   meRenderer.render();
                }
                allRowsSelected = false;
            } else {
                rowElem.className = rowElem.className + " selectedimage";
                inputElems[0].checked = true;
                selectedRows[rowNum] = 1;
            }

        };

        /**
         * Function for adding a row selection checkbox to a table cell. Used as
         * the formatting function for call to columnFormat() when enabling row
         * selection.
         * 
         * @param {HTML Dom Element} Dom element pointing to the cell to be
         *            reformatted.
         */
        function addRowSelection(cellElem) {
            var rowElem = cellElem.parentNode;
            var rowNum = rowElem.id;
            rowNum = rowNum.replace("vov_", "");

            var oldContent = cellElem.innerHTML;
            cellElem.innerHTML = "<input id=\"" + rowElem.id + "\" type=\"checkbox\" name=\"" + rowElem.id + "\" value=\"" + rowElem.id + "\">" + oldContent;
  
            rowElem.setAttribute("onclick", objectName + ".renderObject.selectRow(this)");

            if (selectedRows[rowNum] && selectedRows[rowNum] === 1) {
                rowElem.className = rowElem.className + " selectedimage";
                var inputElems = rowElem.getElementsByTagName("input");
                inputElems[0].checked = true;
            }
        }

        /**
         * Enable row selection for this table. Adds in the additional needed
         * column formatting, functionality for tracking row selection, and
         * buttons for selecting or clearing all table rows.
         */
        this.enableRowSelection = function() {
            rowSelection = true;
        };

        /**
         * Select 'all' rows of a table. Which rows are selected is based on the
         * value set in the setSelectRows method of the filter class.
         */
        this.selectAllRows = function() {
            var allRows = meRenderer.selectSingleNode(filteredDOM, "//*[@ID='VOV:SelectAllRows']");
            var rowList = allRows.getAttribute("value").split(",");
            for ( var i = 0; i < rowList.length; i++) {
                selectedRows[rowList[i]] = 1;
            }
            allRowsSelected = true;
            meRenderer.render();
        };

        this.clearRowSelection = function() {
            selectedRows = [];
            allRowsSelected = false;
            meRenderer.render();
        };

        /**
         * Return a list of the currently selected rows.
         * 
         * @returns {integer[]} Array of currently selected rows. The row
         *          numbers correspond to the order of the rows in the original
         *          VOTABLE. These also correspond to the numbers in the row
         *          element IDs, which have the format vov_{number}.
         */
        this.getSelectedRows = function() {
            var rows = [];
            for ( var i in selectedRows) {
                if (selectedRows[i]==1) {
                    rows.push(i);
                } 
            }

            return rows;
        };

        dragtable.moveColumn = function(table, sIdx, fIdx) {
            if (rowSelection) {
                sIdx = sIdx - 1;
                fIdx = fIdx - 1;
            }
            
            if ( ((sIdx > -1) && (fIdx!=-1)) || !rowSelection) {
                  var movingColumn = columnOrder.splice(sIdx, 1);
                  columnOrder.splice(fIdx, 0, movingColumn[0]);
                  meRenderer.render();
            }                  
        };     
                
        /**
         * Return a list of the names of the table columns.
         * 
         * @returns {String[]} Array of the names of the table columns. The
         *          array is in the order of the fields in the original VOTABLE.
         */
        this.getColumnNames = function() {
            return fieldNames;
        };
        
        /**
         * Set function that gets called whenever the display is updated.
         * 
         * @param func {function} User defined function.  Called with no arguments.
         */
        this.setUpdateCallback = function(func){
            updateCallback = func;
        };
    }
    /**
     * Prototype inheritance of voview object methods.
     */
    Renderer.prototype = this;
    return new Renderer(rendererParams.filterObject, rendererParams.objectName, rendererParams.widgetIDprefix);
};
voview.filter_xsl = "<xsl:stylesheet xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:vo=\"http://www.ivoa.net/xml/VOTable/v1.1\" xmlns:v1=\"http://vizier.u-strasbg.fr/VOTable\" xmlns:v2=\"http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd\" xmlns:v3=\"http://www.ivoa.net/xml/VOTable/v1.0\" xmlns:v4=\"http://www.ivoa.net/xml/VOTable/v1.2\" exclude-result-prefixes=\"vo v1 v2 v3 v4\" version=\"1.0\">  	<xsl:variable name=\"allRows\" select=\"/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR\"/>	<xsl:variable name=\"allRows0\" select=\"/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR\"/>	<xsl:variable name=\"allRows1\" select=\"/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR\"/>	<xsl:variable name=\"allRows2\" select=\"/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR\"/>	<xsl:variable name=\"allRows3\" select=\"/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR\"/>	<xsl:variable name=\"allRows4\" select=\"/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR\"/>	<xsl:variable name=\"filterRows\" select=\"$allRows[__filterExp__]\"/>	<xsl:variable name=\"filterRows0\" select=\"$allRows0[__filterExp__]\"/>	<xsl:variable name=\"filterRows1\" select=\"$allRows1[__filterExp__]\"/>	<xsl:variable name=\"filterRows2\" select=\"$allRows2[__filterExp__]\"/>	<xsl:variable name=\"filterRows3\" select=\"$allRows3[__filterExp__]\"/>	<xsl:variable name=\"filterRows4\" select=\"$allRows4[__filterExp__]\"/>	<!--	<xsl:variable name=\"filterRows\" select=\"$allRows\"/>	<xsl:variable name=\"filterRows0\" select=\"$allRows0\"/>	<xsl:variable name=\"filterRows1\" select=\"$allRows1\"/>	<xsl:variable name=\"filterRows2\" select=\"$allRows2\"/>	<xsl:variable name=\"filterRows3\" select=\"$allRows3\"/>	<xsl:variable name=\"filterRows4\" select=\"$allRows4\"/>	--> 	<!--	<xsl:variable name=\"filterRows\" select=\"$allRows[TD[7]/@val&gt;0]\"/>	<xsl:variable name=\"filterRows0\" select=\"$allRows0[vo:TD[7]/@val&gt;0]\"/>	<xsl:variable name=\"filterRows1\" select=\"$allRows1[v1:TD[7]/@val&gt;0]\"/>	<xsl:variable name=\"filterRows2\" select=\"$allRows2[v2:TD[7]/@val&gt;0]\"/>	<xsl:variable name=\"filterRows3\" select=\"$allRows3[v3:TD[7]/@val&gt;0]\"/>	<xsl:variable name=\"filterRows4\" select=\"$allRows4[v4:TD[7]/@val&gt;0]\"/>	--> 	   	<xsl:variable name=\"nrows\" select=\"count($allRows)+count($allRows0)+count($allRows1)+count($allRows2)+count($allRows3)+count($allRows4)\"/>         <xsl:param name=\"sortOrder\">ascending</xsl:param>    <xsl:param name=\"sortColumn\">1</xsl:param>    <xsl:param name=\"pageStart\">1</xsl:param>	<xsl:param name=\"pageEnd\" select=\"$nrows\"/>    <xsl:param name=\"selectAllCriteria\"></xsl:param>        <xsl:variable name=\"fieldlist\" select=\"/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD\"/>    <xsl:variable name=\"paramlist\" select=\"/VOTABLE/RESOURCE/PARAM|/vo:VOTABLE/vo:RESOURCE/vo:PARAM|/v1:VOTABLE/v1:RESOURCE/v1:PARAM|/v2:VOTABLE/v2:RESOURCE/v2:PARAM|/v3:VOTABLE/v3:RESOURCE/v3:PARAM|/v4:VOTABLE/v4:RESOURCE/v4:PARAM\"/>        <xsl:variable name=\"lc\" select=\"'abcdefghijklmnopqrstuvwxyz'\"/>    <xsl:variable name=\"uc\" select=\"'ABCDEFGHIJKLMNOPQRSTUVWXYZ'\"/>        <xsl:variable name=\"sortColumnNum\">        <xsl:if test=\"$sortColumn != ''\">        	<xsl:choose>        	<xsl:when test=\"string(number($sortColumn))='NaN'\">            	<xsl:call-template name=\"getColumnByName\">                	<xsl:with-param name=\"value\" select=\"$sortColumn\"/>            	</xsl:call-template>            </xsl:when>            <xsl:otherwise>				<xsl:value-of select=\"number($sortColumn)\"/>            </xsl:otherwise>            </xsl:choose>        </xsl:if>    </xsl:variable>        <xsl:variable name=\"datatype\">        <xsl:choose>            <xsl:when test=\"$sortColumnNum=''\">text</xsl:when>            <xsl:otherwise>                <xsl:for-each select=\"$fieldlist[position()=$sortColumnNum]\">                    <xsl:choose>                        <xsl:when test=\"not(@arraysize) and (@datatype='float' or @datatype='double' or @datatype='int' or @datatype='long' or @datatype='short' or @datatype='unsignedByte' or @datatype='bit')\">number</xsl:when>                        <xsl:otherwise>text</xsl:otherwise>                    </xsl:choose>                </xsl:for-each>            </xsl:otherwise>        </xsl:choose>    </xsl:variable>        <xsl:template name=\"getColumnByName\">        <xsl:param name=\"value\"/>        <xsl:variable name=\"tvalue\" select=\"translate($value,$lc,$uc)\"/>        <xsl:for-each select=\"$fieldlist\">            <xsl:variable name=\"ID\">                <xsl:call-template name=\"getID\"/>            </xsl:variable>            <xsl:if test=\"translate($ID,$lc,$uc) = $tvalue\">                <xsl:value-of select=\"position()\"/>            </xsl:if>        </xsl:for-each>    </xsl:template>        <!-- ID is primary FIELD identifier (fall back to name if ID is not available) -->        <xsl:template name=\"getID\">        <xsl:choose>            <xsl:when test=\"@ID\">                <xsl:value-of select=\"@ID\"/>            </xsl:when>            <xsl:otherwise>                <xsl:value-of select=\"@name\"/>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:template name=\"selectAllList\">		<xsl:call-template name=\"selectAllTemplate\">			<xsl:with-param name=\"rowList\" select=\"/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR\"/>			<xsl:with-param name=\"delimiter\"></xsl:with-param>		</xsl:call-template>    </xsl:template>        <xsl:template name=\"selectAllTemplate\">    	<xsl:param name=\"rowList\"/>    	<xsl:param name=\"delimiter\"/>    	<xsl:choose>    		<xsl:when test=\"$selectAllCriteria=''\">           		<xsl:value-of select=\"$delimiter\"/><xsl:value-of select=\"$rowList[position()=1]/@vovid\"/>    			    		</xsl:when>        	<xsl:when test=\"contains($rowList[position()=1], $selectAllCriteria) and $rowList[position()=1]/@vovid\">           		<xsl:value-of select=\"$delimiter\"/><xsl:value-of select=\"$rowList[position()=1]/@vovid\"/>			</xsl:when>		</xsl:choose>		<xsl:if test=\"count($rowList) &gt; 0\">			<xsl:call-template name=\"selectAllTemplate\">				<xsl:with-param name=\"rowList\" select=\"$rowList[position()!=1]\"/>				<xsl:with-param name=\"delimiter\">,</xsl:with-param>			</xsl:call-template>		</xsl:if>    </xsl:template>    <xsl:template match=\"TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE\">    	<xsl:variable name=\"inputSpace\">    		<xsl:value-of select=\"namespace-uri()\"/>    	</xsl:variable>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:TotalCount</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:value-of select=\"$nrows\"/>        	</xsl:attribute>	    </xsl:element>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:FilterCount</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:value-of select=\"count($filterRows)+count($filterRows0)+count($filterRows1)+count($filterRows2)+count($filterRows3)+count($filterRows4)\"/>        	</xsl:attribute>	    </xsl:element>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:SelectAllRows</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:call-template name=\"selectAllList\"/>			</xsl:attribute>				    </xsl:element>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:PageStart</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:value-of select=\"$pageStart\"/>        	</xsl:attribute>	    </xsl:element>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:PageEnd</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:value-of select=\"$pageEnd\"/>        	</xsl:attribute>	    </xsl:element>        <xsl:element name=\"PARAM\" namespace=\"{$inputSpace}\">        	<xsl:attribute name=\"datatype\">int</xsl:attribute>        	<xsl:attribute name=\"ID\">VOV:SortColumnsList</xsl:attribute>			<xsl:attribute name=\"value\">				<xsl:choose>					<xsl:when test=\"$sortOrder = 'ascending'\">+</xsl:when>					<xsl:when test=\"$sortOrder = 'descending'\">-</xsl:when>				</xsl:choose>				<xsl:value-of select=\"$sortColumn\"/>			</xsl:attribute>	    </xsl:element>        <xsl:copy>            <xsl:apply-templates/>        </xsl:copy>    </xsl:template>        <xsl:template match=\"TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA\">        <xsl:copy>            	<xsl:for-each select=\"$filterRows|$filterRows0|$filterRows1|$filterRows2|$filterRows3|$filterRows4\">                	<xsl:sort select=\"TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>	                <xsl:sort select=\"TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>    	            <xsl:sort select=\"vo:TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>        	        <xsl:sort select=\"vo:TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>            	    <xsl:sort select=\"v1:TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>                	<xsl:sort select=\"v1:TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>	                <xsl:sort select=\"v2:TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>    	            <xsl:sort select=\"v2:TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>        	        <xsl:sort select=\"v3:TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>            	    <xsl:sort select=\"v3:TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>                	<xsl:sort select=\"v4:TD[position()=$sortColumnNum]/@val\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>	                <xsl:sort select=\"v4:TD[position()=$sortColumnNum]\" order=\"{$sortOrder}\" data-type=\"{$datatype}\"/>    	            <xsl:if test=\"not (position() &lt; $pageStart or position() &gt; $pageEnd)\">        	            <xsl:copy>            	            <xsl:apply-templates select=\"@*|node()\"/>                	    </xsl:copy>	                </xsl:if>	            </xsl:for-each>        </xsl:copy>    </xsl:template>        <xsl:template match=\"@*|node()\">        <xsl:copy>            <xsl:apply-templates select=\"@*|node()\"/>        </xsl:copy>    </xsl:template>        <xsl:template name=\"start\" match=\"/\">        <xsl:copy>            <xsl:apply-templates/>        </xsl:copy>    </xsl:template></xsl:stylesheet>";
voview.preproc_xsl = "<xsl:stylesheet version=\"1.0\"	xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:vo=\"http://www.ivoa.net/xml/VOTable/v1.1\"	xmlns:v1=\"http://vizier.u-strasbg.fr/VOTable\" xmlns:v2=\"http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd\"	xmlns:v3=\"http://www.ivoa.net/xml/VOTable/v1.0\" xmlns:v4=\"http://www.ivoa.net/xml/VOTable/v1.2\"	exclude-result-prefixes=\"vo v1 v2 v3 v4\">	<xsl:output method=\"xml\" />    <xsl:variable name=\"fieldlist\" select=\"/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD\"/>	<xsl:variable name=\"ncolumns\" select=\"count($fieldlist)\"/>	<xsl:variable name=\"isNumberList\">		<xsl:call-template name=\"getNumberList\"/>	</xsl:variable>		<xsl:template name=\"getNumberList\">		<xsl:param name=\"colCounter\" select=\"1\"/>		<xsl:if test=\"contains('|float|double|int|',concat('|',$fieldlist[position()=$colCounter]/@datatype,'|'))\">			|<xsl:value-of select=\"$colCounter\"/>|		</xsl:if>		<xsl:if test=\"$colCounter &lt; $ncolumns\">            <xsl:call-template name=\"getNumberList\">                <xsl:with-param name=\"colCounter\" select=\"$colCounter+1\"/>            </xsl:call-template>				</xsl:if>	</xsl:template>			<xsl:template		match=\"TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA\">		<xsl:copy><!-- copy the TABLEDATA element -->			<xsl:for-each select=\"TR|vo:TR|v1:TR|v2:TR|v3:TR|v4:TR\">				<xsl:variable name=\"vovid\" select=\"position()\" />				<xsl:copy><!-- copy the TR element -->					<xsl:attribute name=\"vovid\">						<xsl:value-of select=\"$vovid\" /> 					</xsl:attribute>					<xsl:for-each select=\"TD|vo:TD|v1:TD|v2:TD|v3:TD|v4:TD\">						<xsl:variable name=\"posit\" select=\"position()\" />						<xsl:choose>							<xsl:when								test=\"contains($isNumberList,concat('|',$posit,'|'))\">								<xsl:copy>									<xsl:attribute name=\"val\">                           				<xsl:call-template name=\"SciNum\">                              				<xsl:with-param name=\"num\" select=\".\" />                           				</xsl:call-template>                        			</xsl:attribute>									<!-- apparently must do attribute first -->									<xsl:value-of select=\".\" />								</xsl:copy>							</xsl:when>							<xsl:otherwise>								<xsl:copy><!-- copy just the TD element -->									<xsl:value-of select=\".\" />								</xsl:copy>							</xsl:otherwise>						</xsl:choose>					</xsl:for-each>				</xsl:copy>				<xsl:value-of select=\"string('&#xA;')\" />			</xsl:for-each>		</xsl:copy>	</xsl:template>	<xsl:strip-space		elements=\"TABLEDATA vo:TABLEDATA v1:TABLEDATA v2:TABLEDATA v3:TABLEDATA v4:TABLEDATA\" />	<!-- standard copy template -->	<xsl:template match=\"@*|node()\">		<xsl:copy>			<xsl:apply-templates select=\"@*\" />			<xsl:apply-templates />		</xsl:copy>	</xsl:template>	<xsl:template name=\"SciNum\">		<xsl:param name=\"num\" />		<!-- Get rid of +.  They cause problems is xslt1.0. -->		<xsl:variable name=\"input\" select=\"translate($num, 'E+', 'e')\" />		<xsl:choose>			<xsl:when test=\"contains($input, 'e')\">				<xsl:variable name=\"man\" select=\"substring-before($input,'e')\" />				<xsl:variable name=\"exp\" select=\"substring-after($input,'e')\" />				<xsl:variable name=\"power\">					<xsl:call-template name=\"PowersOf10\">						<xsl:with-param name=\"exponent\" select=\"$exp\"/>					</xsl:call-template>				</xsl:variable>				<!-- Offset depends on what we included above -->				<xsl:value-of select=\"$man * $power\" />			</xsl:when>			<xsl:otherwise>				<xsl:value-of select=\"translate($num, '+', '')\" />			</xsl:otherwise>		</xsl:choose>	</xsl:template>		<xsl:template name=\"PowersOf10\">		<xsl:param name=\"exponent\"/>		<xsl:choose>			 <xsl:when test=\"$exponent=-9\">0.000000001</xsl:when>			 <xsl:when test=\"$exponent=-8\">0.00000001</xsl:when>			 <xsl:when test=\"$exponent=-7\">0.0000001</xsl:when>			 <xsl:when test=\"$exponent=-6\">0.000001</xsl:when>			 <xsl:when test=\"$exponent=-5\">0.00001</xsl:when>			 <xsl:when test=\"$exponent=-4\">0.0001</xsl:when>			 <xsl:when test=\"$exponent=-3\">0.001</xsl:when>			 <xsl:when test=\"$exponent=-2\">0.01</xsl:when>			 <xsl:when test=\"$exponent=-1\">0.1</xsl:when>			  <xsl:when test=\"$exponent=0\">1</xsl:when>			  <xsl:when test=\"$exponent=1\">10</xsl:when>			  <xsl:when test=\"$exponent=2\">100</xsl:when>			  <xsl:when test=\"$exponent=3\">1000</xsl:when>			  <xsl:when test=\"$exponent=4\">10000</xsl:when>			  <xsl:when test=\"$exponent=5\">100000</xsl:when>			  <xsl:when test=\"$exponent=6\">1000000</xsl:when>			  <xsl:when test=\"$exponent=7\">10000000</xsl:when>			  <xsl:when test=\"$exponent=8\">100000000</xsl:when>			  <xsl:when test=\"$exponent=9\">1000000000</xsl:when>			 <xsl:when test=\"$exponent=10\">10000000000</xsl:when>			 <xsl:when test=\"$exponent=11\">100000000000</xsl:when>			 <xsl:when test=\"$exponent=12\">1000000000000</xsl:when>			 <xsl:when test=\"$exponent=13\">10000000000000</xsl:when>			 <xsl:when test=\"$exponent=14\">100000000000000</xsl:when>			 <xsl:when test=\"$exponent=15\">1000000000000000</xsl:when>			 <xsl:when test=\"$exponent=16\">10000000000000000</xsl:when>			 <xsl:when test=\"$exponent=17\">100000000000000000</xsl:when>			 <xsl:when test=\"$exponent=18\">1000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=19\">10000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=20\">100000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=21\">1000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=22\">10000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=23\">100000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=24\">1000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=25\">10000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=26\">100000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=27\">1000000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=28\">10000000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=29\">100000000000000000000000000000</xsl:when>			 <xsl:when test=\"$exponent=30\">1000000000000000000000000000000</xsl:when>			<xsl:when test=\"$exponent=-30\">0.000000000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-29\">0.00000000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-28\">0.0000000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-27\">0.000000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-26\">0.00000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-25\">0.0000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-24\">0.000000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-23\">0.00000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-22\">0.0000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-21\">0.000000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-20\">0.00000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-19\">0.0000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-18\">0.000000000000000001</xsl:when>			<xsl:when test=\"$exponent=-17\">0.00000000000000001</xsl:when>			<xsl:when test=\"$exponent=-16\">0.0000000000000001</xsl:when>			<xsl:when test=\"$exponent=-15\">0.000000000000001</xsl:when>			<xsl:when test=\"$exponent=-14\">0.00000000000001</xsl:when>			<xsl:when test=\"$exponent=-13\">0.0000000000001</xsl:when>			<xsl:when test=\"$exponent=-12\">0.000000000001</xsl:when>			<xsl:when test=\"$exponent=-11\">0.00000000001</xsl:when>			<xsl:when test=\"$exponent=-10\">0.0000000001</xsl:when>			 <xsl:otherwise>0</xsl:otherwise>		</xsl:choose>	</xsl:template></xsl:stylesheet>";
voview.renderer_xsl = "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:vo=\"http://www.ivoa.net/xml/VOTable/v1.1\" xmlns:v1=\"http://vizier.u-strasbg.fr/VOTable\" xmlns:v2=\"http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd\" xmlns:v3=\"http://www.ivoa.net/xml/VOTable/v1.0\" xmlns:v4=\"http://www.ivoa.net/xml/VOTable/v1.2\" exclude-result-prefixes=\"vo v1 v2 v3 v4\">        <!--<xsl:output method=\"html\" doctype-public=\"-//W3C//DTD XHTML 1.0 Transitional//EN\"      doctype-system=\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"/>-->	<xsl:output method=\"xml\"/>        <!-- Sort VOTable by column sortOrder and write a page of rows in of HTML -->        <!-- Input parameters -->        <xsl:param name=\"selectedRows\"></xsl:param>    <xsl:param name=\"selectRowUCD\">ID_MAIN</xsl:param>    <xsl:param name=\"maxColumns\">11</xsl:param>    <xsl:param name=\"columnOrder\"></xsl:param>        <xsl:param name=\"decPrecision\">10</xsl:param>    <xsl:param name=\"raPrecision\">100</xsl:param>    <xsl:param name=\"sexSeparator\">:</xsl:param>    <xsl:param name=\"widgetIDprefix\">voview</xsl:param>        <xsl:param name=\"renderPrefixColumn\">0</xsl:param>        <xsl:param name=\"selectAllLabel\">Select All</xsl:param>        <!-- Filter parameters -->    <xsl:param name=\"filterText\"></xsl:param>    <xsl:param name=\"filterForm\">filterForm</xsl:param>    <xsl:param name=\"filterCallback\">filterByColumn</xsl:param>    <xsl:param name=\"filterResetCallback\">resetFilter</xsl:param>    <xsl:param name=\"filterRow\">filterRow</xsl:param>        <xsl:param name=\"titleText\"/>        <!-- Javascript callback functions (also settable as parameters) -->        <xsl:param name=\"sortCallback\">sortTable</xsl:param>    <xsl:param name=\"pageCallback\">newPage</xsl:param>    <xsl:param name=\"setMaxColumnsCallback\">setMaxColumns</xsl:param>    <xsl:param name=\"resetColumnOrderCallback\">resetColumnOrder</xsl:param>    <xsl:param name=\"setPageLength\">setPageLength</xsl:param>    <xsl:param name=\"selectRowCallback\">selectRow</xsl:param>    <xsl:param name=\"selectAllRowsCallback\">selectAllRows</xsl:param>    <xsl:param name=\"clearSelectionCallback\">clearRowSelection</xsl:param>    <xsl:param name=\"clickClearCallback\">clickClear</xsl:param>    <xsl:param name=\"clickResetCallback\">clickReset</xsl:param>        <xsl:variable name=\"lc\" select=\"'abcdefghijklmnopqrstuvwxyz'\"/>    <xsl:variable name=\"uc\" select=\"'ABCDEFGHIJKLMNOPQRSTUVWXYZ'\"/>        <!-- Computed variables -->        <xsl:variable name=\"fieldlist\" select=\"//VOTABLE/RESOURCE/TABLE/FIELD|//vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|//v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|//v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|//v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|//v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD\"/>        <xsl:variable name=\"paramlist\" select=\"//VOTABLE/RESOURCE/PARAM|//vo:VOTABLE/vo:RESOURCE/vo:PARAM|//v1:VOTABLE/v1:RESOURCE/v1:PARAM|//v2:VOTABLE/v2:RESOURCE/v2:PARAM|//v3:VOTABLE/v3:RESOURCE/v3:PARAM|//v4:VOTABLE/v4:RESOURCE/v4:PARAM\"/><!--    <xsl:variable name=\"paramlist\" select=\"//PARAM|//vo:PARAM|//v1:PARAM|//v2:PARAM|//v3:PARAM|//v4:PARAM\"/>-->        <xsl:variable name=\"useDescription\" select=\"name($fieldlist/*)='DESCRIPTION'\"/>    <xsl:variable name=\"totalCount\" select=\"$paramlist[@ID='VOV:TotalCount']/@value\"/>    <xsl:variable name=\"filterCount\" select=\"$paramlist[@ID='VOV:FilterCount']/@value\"/>    <xsl:variable name=\"pageStart\" select=\"$paramlist[@ID='VOV:PageStart']/@value\"/>    <xsl:variable name=\"pageEnd\" select=\"$paramlist[@ID='VOV:PageEnd']/@value\"/>    <xsl:variable name=\"selectAllList\" select=\"$paramlist[@ID='VOV:SelectAllRows']/@value\"/>    <xsl:variable name=\"sortColumnsList\" select=\"$paramlist[@ID='VOV:SortColumnsList']/@value\"/>        <xsl:variable name=\"sortOrder\">    	<xsl:choose>    		<xsl:when test=\"substring($sortColumnsList,1,1) = '+'\">    			ascending    		</xsl:when>    		<xsl:when test=\"substring($sortColumnsList,1,1) = '-'\">    			descending    		</xsl:when>    	</xsl:choose>    </xsl:variable>        <xsl:variable name=\"sortColumn\" select=\"substring($sortColumnsList,2)\"/>    <xsl:variable name=\"sortColumnNum\">        <xsl:if test=\"$sortColumn != ''\">        	<xsl:choose>        	<xsl:when test=\"string(number($sortColumn))='NaN'\">            	<xsl:call-template name=\"getColumnByName\">                	<xsl:with-param name=\"value\" select=\"$sortColumn\"/>            	</xsl:call-template>            </xsl:when>            <xsl:otherwise>				<xsl:value-of select=\"number($sortColumn)\"/>            </xsl:otherwise>            </xsl:choose>        </xsl:if>    </xsl:variable>        <xsl:variable name=\"sortName\">        <xsl:choose>		        	<xsl:when test=\"string(number($sortColumn))='NaN'\">    			<xsl:value-of select=\"$sortColumn\"/>    		</xsl:when>    		<xsl:otherwise>    			<xsl:value-of select=\"$fieldlist[$sortColumn]/@name\"/>    		</xsl:otherwise>    	</xsl:choose>    </xsl:variable>    <xsl:variable name=\"raColumnNum\">        <xsl:call-template name=\"getColumnByUCDs\">            <xsl:with-param name=\"value\" select=\"'|pos.eq.ra;meta.main|POS_EQ_RA_MAIN|'\"/>            <xsl:with-param name=\"datatype\" select=\"'|float|double|'\"/>        </xsl:call-template>    </xsl:variable>        <xsl:variable name=\"decColumnNum\">        <xsl:call-template name=\"getColumnByUCDs\">            <xsl:with-param name=\"value\" select=\"'|pos.eq.dec;meta.main|POS_EQ_DEC_MAIN|'\"/>            <xsl:with-param name=\"datatype\" select=\"'|float|double|'\"/>        </xsl:call-template>    </xsl:variable>        <xsl:variable name=\"urlColumnNum\">        <xsl:call-template name=\"getColumnByUCD\">            <xsl:with-param name=\"value\" select=\"'VOX:Image_AccessReference'\"/>        </xsl:call-template>    </xsl:variable>        <xsl:variable name=\"formatColumnNum\">        <xsl:call-template name=\"getColumnByUCD\">            <xsl:with-param name=\"value\" select=\"'VOX:Image_Format'\"/>        </xsl:call-template>    </xsl:variable>        <xsl:variable name=\"selectColumnNum\">        <xsl:call-template name=\"getColumnByUCD\">            <xsl:with-param name=\"value\" select=\"$selectRowUCD\"/>        </xsl:call-template>    </xsl:variable>        <xsl:template name=\"getColumnByUCD\">        <!-- THIS ASSUMED THAT THE COLUMN EXISTS! -->        <!-- WHEN IT DOESN'T, SAFARI IS UNHAPPY! -->        <xsl:param name=\"value\"/>        <xsl:variable name='temp_column'>            <xsl:for-each select=\"$fieldlist\">                <xsl:if test=\"@ucd = $value\">                    <xsl:value-of select=\"position()\"/>                </xsl:if>            </xsl:for-each>        </xsl:variable>        <xsl:choose>            <xsl:when test=\"$temp_column != ''\">                <xsl:value-of select=\"$temp_column\"/>            </xsl:when>            <xsl:otherwise>-1</xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:template name=\"getColumnByUCDs\">        <xsl:param name=\"value\"/>        <xsl:param name=\"datatype\"/>        <xsl:for-each select=\"$fieldlist\">            <xsl:if test=\"contains($value, concat('|',@ucd,'|')) and            (not($datatype) or contains($datatype,concat('|',@datatype,'|')))\">                <xsl:value-of select=\"position()\"/>            </xsl:if>        </xsl:for-each>    </xsl:template>        <xsl:template name=\"getColumnByName\">        <xsl:param name=\"value\"/>        <xsl:variable name=\"tvalue\" select=\"translate($value,$lc,$uc)\"/>        <xsl:for-each select=\"$fieldlist\">            <xsl:variable name=\"ID\">                <xsl:call-template name=\"getID\"/>            </xsl:variable>            <xsl:if test=\"translate($ID,$lc,$uc) = $tvalue\">                <xsl:value-of select=\"position()\"/>            </xsl:if>        </xsl:for-each>    </xsl:template>        <!-- ID is primary FIELD identifier (fall back to name if ID is not available) -->        <xsl:template name=\"getID\">        <xsl:choose>            <xsl:when test=\"@ID\">                <xsl:value-of select=\"@ID\"/>            </xsl:when>            <xsl:otherwise>                <xsl:value-of select=\"@name\"/>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <!-- name is primary FIELD label (fall back to ID if name is not available) -->        <xsl:template name=\"getName\">        <xsl:choose>            <xsl:when test=\"@name\">                <xsl:value-of select=\"@name\"/>            </xsl:when>            <xsl:otherwise>                <xsl:value-of select=\"@ID\"/>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:variable name=\"nrows\" select=\"count(/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR)\"/>        <xsl:variable name=\"ncols\" select=\"count($fieldlist)\"/>        <xsl:variable name=\"pageLength\">    	<xsl:value-of select=\"number($pageEnd)-number($pageStart)+1\"/>    </xsl:variable>        <xsl:variable name=\"page\">    	<xsl:value-of select=\"ceiling(number($pageStart) div number($pageLength))\"/>    </xsl:variable>        <xsl:variable name=\"npages\" select=\"ceiling($filterCount div $pageLength)\"/>    <!-- process the VOTable -->        <xsl:template name=\"start\" match=\"/\">        <xsl:variable name=\"votable\" select=\"VOTABLE|vo:VOTABLE|v1:VOTABLE|v2:VOTABLE|v3:VOTABLE|v4:VOTABLE\"/>        <xsl:for-each select=\"$votable\">            <xsl:call-template name=\"votable\"/>        </xsl:for-each>        <xsl:if test=\"count($votable)=0\">            <xsl:call-template name=\"error\"/>        </xsl:if>    </xsl:template>        <!-- error template is called when root VOTABLE node is not found -->    	<xsl:template name=\"error\">   		<xsl:variable name=\"root\" select=\"name(*)\"/>   		<xsl:variable name=\"ns1\" select=\"namespace-uri(*)\"/>   		<xsl:variable name=\"ns\">      		<xsl:if test=\"$ns1\"> {<xsl:value-of select=\"$ns1\"/>} </xsl:if>   		</xsl:variable>   		<h2>Error: Input is not a standard VOTable</h2>   		<p>Root node is <i> <xsl:value-of select=\"$ns\"/> </i> <b> <xsl:value-of select=\"$root\"/> </b></p>   		<p>Should be <b> VOTABLE </b> or <i> {http://www.ivoa.net/xml/VOTable/v1.1} </i> <b> VOTABLE </b></p>	</xsl:template>        <xsl:template name=\"votable\">        <xsl:for-each select=\"INFO|vo:INFO|v1:INFO|v2:INFO|v3:INFO|v4:INFO\">            <xsl:call-template name=\"info\"/>        </xsl:for-each>        <xsl:for-each select=\"RESOURCE|vo:RESOURCE|v1:RESOURCE|v2:RESOURCE|v3:RESOURCE|v4:RESOURCE\">            <xsl:call-template name=\"resource\"/>        </xsl:for-each>    </xsl:template>        <!-- Handle VOTable error return -->        <xsl:template name=\"info\">        <xsl:if test=\"@name='QUERY_STATUS' and @value='ERROR'\">            <pre>                <h2>                    <xsl:value-of select=\".\"/>                </h2>            </pre>        </xsl:if>    </xsl:template>        <xsl:template name=\"resource\">    	<!-- Begin dummy header 		<html>		<head>			<title>VOTable Viewer</title>			<link rel=\"stylesheet\" type=\"text/css\" href=\"css/voview.css\"></link>		</head>		<body>    	 End dummy header -->    	<div>		<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/></xsl:attribute>		<!-- Because \"all\" contains all the other widgets, it needs to be last in the list -->		<form name=\"widgets\" action=\"\">			<input type=\"hidden\" name=\"widget_names\">				<xsl:attribute name=\"value\">title,table,columnArranging,parameters,paging_top,paging_bottom,filterButtons,all</xsl:attribute>			</input>		</form>		<!-- Leave off the \"all\" suffix for the widget id containing the whole table -->		<h1 align=\"center\">    	    			<span>				<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_title</xsl:attribute>   				<xsl:value-of select=\"$titleText\"/>   			</span>   		</h1>		<xsl:for-each select=\"TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE\">			<!-- 			 This is where the templates for the different sub-widgets are called			 -->     		<xsl:call-template name=\"buttons\">				<xsl:with-param name=\"location\" select=\"'top'\"/>			</xsl:call-template>            <xsl:call-template name=\"dataNotes\"/>         	<xsl:call-template name=\"dataTable\"/>            <xsl:call-template name=\"buttons\">            	<xsl:with-param name=\"location\" select=\"'bottom'\"/>            </xsl:call-template>		</xsl:for-each>        <xsl:call-template name=\"fieldsparams\"/>        </div>      	<!-- Begin dummy footer 		</body>		</html>    	 End dummy footer -->    </xsl:template>	<xsl:template name=\"dataTable\">		<!-- wrap entire table in a form for filtering -->		<div>		<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_table</xsl:attribute>		<form method=\"get\" name=\"{$filterForm}\" id=\"{$filterForm}\"			onsubmit=\"{$filterCallback}(this); return false;\" onreset=\"{$filterResetCallback}(this); return false;\"			action=\"#\">			<div style=\"position: absolute; left: -9999px\">				<!-- hide the submit & reset buttons. They must be on the page, however,                                 (i.e. display:none does not work) in order to allow for form submission with                                return in an input field. -->				<input type=\"submit\" class=\"submit\" name=\"_submit\" value=\"Filter\"					title=\"Enter values for one or more columns in boxes\" />				<input type=\"reset\" class=\"reset\" name=\"_reset\" value=\"Clear\"					title=\"Clear column filter values\" />			</div>			<table class=\"data draggable\">				<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_data</xsl:attribute>				<xsl:call-template name=\"columnSetting\" />				<thead>					<xsl:call-template name=\"header\">						<xsl:with-param name=\"location\" select=\"'top'\" />					</xsl:call-template>				</thead>				<!-- header repeats at bottom of table.				 HTML standard says tfoot must come before tbody -->				<tfoot>					<xsl:call-template name=\"header\">						<xsl:with-param name=\"location\" select=\"'bottom'\" />					</xsl:call-template>				</tfoot>				<tbody>					<xsl:choose>						<xsl:when test=\"$nrows=0\">							<tr>								<td colspan=\"{$maxColumns}\">									<xsl:choose>										<xsl:when test=\"$filterCount\">											<h2>No results remain after filtering</h2>										</xsl:when>										<xsl:otherwise>											<h2>No results found</h2>										</xsl:otherwise>									</xsl:choose>								</td>							</tr>						</xsl:when>						<xsl:otherwise>							<xsl:apply-templates								select=\"DATA/TABLEDATA|vo:DATA/vo:TABLEDATA|v1:DATA/v1:TABLEDATA|v2:DATA/v2:TABLEDATA|v3:DATA/v3:TABLEDATA|v4:DATA/v4:TABLEDATA\" />						</xsl:otherwise>					</xsl:choose>				</tbody>			</table>		</form>		</div>	</xsl:template>        <!--    Code gets replicated here for efficiency in selecting different namespaces.    I've abstracted what I can.  Is there a better way to code this?    -->        <xsl:template match=\"DATA/TABLEDATA\">        <xsl:for-each select=\"TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template match=\"vo:DATA/vo:TABLEDATA\">        <xsl:for-each select=\"vo:TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"vo:TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template match=\"v1:DATA/v1:TABLEDATA\">        <xsl:for-each select=\"v1:TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"v1:TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template match=\"v2:DATA/v2:TABLEDATA\">        <xsl:for-each select=\"v2:TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"v2:TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template match=\"v3:DATA/v3:TABLEDATA\">        <xsl:for-each select=\"v3:TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"v3:TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template match=\"v4:DATA/v4:TABLEDATA\">        <xsl:for-each select=\"v4:TR\">                <xsl:call-template name=\"processIncludedRow\">                    <xsl:with-param name=\"rowNum\" select=\"position()\"/>                    <xsl:with-param name=\"TDlist\" select=\"v4:TD\"/>                    <xsl:with-param name=\"selector\" select=\"@vovid\"/>                </xsl:call-template>        </xsl:for-each>    </xsl:template>        <xsl:template name=\"processIncludedRow\">        <xsl:param name=\"rowNum\"/>        <xsl:param name=\"TDlist\"/>        <xsl:param name=\"selector\"/>        <!--  xsl:variable name=\"selector\" select=\"string($TDlist[position()=$selectColumnNum])\"/ -->        <tr id=\"vov_{$selector}\">            <xsl:attribute name=\"class\">                <xsl:call-template name=\"isSelected\">                    <xsl:with-param name=\"selector\" select=\"$selector\"/>                </xsl:call-template>                <xsl:choose>                    <xsl:when test=\"($rowNum mod 2) = 0\">even</xsl:when>                    <xsl:otherwise>odd</xsl:otherwise>                </xsl:choose>            </xsl:attribute>            <xsl:variable name=\"isSelected\">                <xsl:call-template name=\"isSelected\">                    <xsl:with-param name=\"selector\" select=\"$selector\"/>                </xsl:call-template>            </xsl:variable>            <xsl:call-template name=\"processRow\">                <xsl:with-param name=\"TDlist\" select=\"$TDlist\"/>                <xsl:with-param name=\"format\" select=\"(TD|vo:TD|v1:TD|v2:TD|v3:TD|v4:TD)[position()=$formatColumnNum]\"/>                <xsl:with-param name=\"selector\" select=\"$selector\"/>            </xsl:call-template>        </tr>    </xsl:template>        <!-- create tables describing FIELDs and PARAMs -->        <xsl:template name=\"fieldsparams\">        <xsl:for-each select=\"TABLE|vo:TABLE|v1:TABLE|v2:TABLE|v3:TABLE|v4:TABLE\">            <table>                <tbody>                    <tr valign=\"top\">                        <td>                            <xsl:call-template name=\"fieldstable\"/>                        </td>                        <td>                            <xsl:call-template name=\"paramstable\"/>                        </td>                    </tr>                </tbody>            </table>        </xsl:for-each>    </xsl:template>        <xsl:template name=\"fieldstable\">    	<div class=\"fieldparam\">    	<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_columnArranging</xsl:attribute>        <h2>            Columns        </h2>        <span class=\"bbox rightbutton\" onclick=\"{$resetColumnOrderCallback}();\" title=\"Restore original column order\">Reset&#160;column&#160;order</span>        <table class=\"fields\" id=\"voview_column_fields\">            <col/>            <col/>            <col/>            <xsl:if test=\"$useDescription\">                <col width=\"400\"/>            </xsl:if>            <thead><tr>                    <th>Name</th>                    <th>Unit</th>                    <th>Datatype</th>                    <xsl:if test=\"$useDescription\">                        <th>Description</th>                    </xsl:if>                </tr></thead>            <tbody>                <xsl:call-template name=\"fieldIter\">                     <xsl:with-param name=\"count\" select=\"1\"/>                     <xsl:with-param name=\"colnums\" select=\"concat($columnOrder,',')\"/>                </xsl:call-template>            </tbody>        </table>        </div>    </xsl:template>        <xsl:template name=\"paramstable\">        <xsl:if test=\"count($paramlist) &gt; 0\">        	<div class=\"fieldparam\">	    	<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_parameters</xsl:attribute>            <h2>Table Parameters</h2>            <table class=\"parameters\">                <thead><tr>                        <th>Name</th>                        <th>Value</th>                        <th>Unit</th>                    </tr></thead>                <tbody>                    <xsl:for-each select=\"$paramlist[not(starts-with(@ID,'VOV:'))]\">                        <tr>                            <td>                                <xsl:call-template name=\"getName\"/>                            </td>                            <td>                                <xsl:value-of select=\"@value\"/>                            </td>                            <td>                                <xsl:value-of select=\"@unit\"/>                            </td>                        </tr>                    </xsl:for-each>                </tbody>            </table>            </div>        </xsl:if>    </xsl:template>        <!-- recursive template to loop over fields in columnOrder -->        <xsl:template name=\"fieldIter\">        <xsl:param name=\"count\"/>        <xsl:param name=\"colnums\"/>        <xsl:if test=\"$colnums\">            <xsl:variable name=\"posit\" select=\"number(substring-before($colnums,','))\"/>            <xsl:for-each select=\"$fieldlist[position()=$posit]\">                <xsl:call-template name=\"fieldrow\">                    <xsl:with-param name=\"row\" select=\"$count\"/>                    <xsl:with-param name=\"posit\" select=\"$posit\"/>                </xsl:call-template>            </xsl:for-each>            <xsl:call-template name=\"fieldIter\">                <xsl:with-param name=\"count\" select=\"1+$count\"/>                <xsl:with-param name=\"colnums\" select=\"substring-after($colnums,',')\"/>            </xsl:call-template>        </xsl:if>    </xsl:template>        <xsl:template name=\"fieldrow\">        <xsl:param name=\"row\"/>        <xsl:param name=\"posit\"/>        <tr id=\"fieldrow_{$posit}\">            <xsl:attribute name=\"class\">                <xsl:choose>                    <xsl:when test=\"($row mod 2) = 0\">even</xsl:when>                    <xsl:otherwise>odd</xsl:otherwise>                </xsl:choose>            </xsl:attribute>            <td>                <xsl:call-template name=\"getName\"/>            </td>            <td>                <xsl:value-of select=\"@unit\"/>            </td>            <td>                <xsl:value-of select=\"@datatype\"/>                <xsl:if test=\"@arraysize\">                    <xsl:value-of select=\"concat('[',@arraysize,']')\"/>                </xsl:if>            </td>            <xsl:if test=\"$useDescription\">                <td>                    <xsl:value-of select=\"DESCRIPTION|vo:DESCRIPTION|v1:DESCRIPTION|v2:DESCRIPTION|v3:DESCRIPTION|v4:DESCRIPTION\"/>                </td>            </xsl:if>        </tr>        <!--        <td><xsl:value-of select=\"$row\"/>:<xsl:value-of select=\"$ncols\"/>:<xsl:value-of select=\"$maxColumns\"/></td>        \"Hidden\" bar did not show initially when $ncols < $maxColumns ...        <xsl:if test=\"$row=$maxColumns\">        -->        <xsl:if test=\"$row=$maxColumns or ( $row=$ncols and $maxColumns &gt; $ncols )\">            <tr class=\"separator\">                <td colspan=\"5\" align=\"center\">Columns below are hidden - Drag to change</td>            </tr>        </xsl:if>    </xsl:template>        <!-- all the page buttons -->        <xsl:template name=\"buttons\">        <xsl:param name=\"location\"/>        <div class=\"buttons {$location}\">           	<xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_paging_<xsl:value-of select=\"$location\"/></xsl:attribute>            <div class=\"pagelabel\">            	<xsl:variable name=\"realEnd\">            		<xsl:choose>            			<xsl:when test=\"$pageEnd &lt; $filterCount\">            				<xsl:value-of select=\"$pageEnd\"/>            			</xsl:when>            			<xsl:otherwise>            				<xsl:value-of select=\"$filterCount\"/>            			</xsl:otherwise>            		</xsl:choose>            	</xsl:variable>            	<xsl:choose>            		<xsl:when test=\"$realEnd != 0\">		                Results <b><xsl:value-of select=\"$pageStart\"/>-<xsl:value-of select=\"$realEnd\"/></b>		                <xsl:if test=\"$npages != 1 or $filterCount\"> of <b><xsl:value-of select=\"$filterCount\"/></b></xsl:if>            		</xsl:when>            		<xsl:otherwise>            			Zero results            		</xsl:otherwise>            	</xsl:choose>                <xsl:if test=\"$totalCount\">                    (<b><xsl:value-of select=\"$totalCount\"/></b> before filtering)                </xsl:if>                <xsl:if test=\"$sortColumnNum != ''\">sorted by <b><xsl:value-of select=\"$sortName\"/></b>                </xsl:if>            </div>            <xsl:if test=\"$npages != 1\">                <div class=\"pagebuttons\">                    <xsl:call-template name=\"onePage\">                        <xsl:with-param name=\"value\" select=\"number($page)-1\"/>                        <xsl:with-param name=\"label\" select=\"'Previous'\"/>                        <xsl:with-param name=\"class\" select=\"'rev'\"/>                    </xsl:call-template>                    <xsl:choose>                        <xsl:when test=\"$npages &lt; 12\">                            <xsl:call-template name=\"pageRun\">                                <xsl:with-param name=\"start\" select=\"1\"/>                                <xsl:with-param name=\"end\" select=\"$npages\"/>                            </xsl:call-template>                        </xsl:when>                        <xsl:when test=\"number($page) &lt; 7\">                            <xsl:call-template name=\"pageRun\">                                <xsl:with-param name=\"start\" select=\"1\"/>                                <xsl:with-param name=\"end\" select=\"9\"/>                            </xsl:call-template>                            &#8230;                            <xsl:call-template name=\"onePage\">                                <xsl:with-param name=\"value\" select=\"$npages\"/>		                        <xsl:with-param name=\"label\" select=\"''\"/>		                        <xsl:with-param name=\"class\" select=\"''\"/>                            </xsl:call-template>                        </xsl:when>                        <xsl:when test=\"number($page)+6 &gt; $npages\">                            <xsl:call-template name=\"onePage\">                                <xsl:with-param name=\"value\" select=\"1\"/>		                        <xsl:with-param name=\"label\" select=\"''\"/>		                        <xsl:with-param name=\"class\" select=\"''\"/>                            </xsl:call-template>                            &#8230;                            <xsl:call-template name=\"pageRun\">                                <xsl:with-param name=\"start\" select=\"number($npages)-8\"/>                                <xsl:with-param name=\"end\" select=\"$npages\"/>                            </xsl:call-template>                        </xsl:when>                        <xsl:otherwise>                            <xsl:call-template name=\"onePage\">                                <xsl:with-param name=\"value\" select=\"1\"/>		                        <xsl:with-param name=\"label\" select=\"''\"/>		                        <xsl:with-param name=\"class\" select=\"''\"/>                            </xsl:call-template>                            &#8230;                            <xsl:call-template name=\"pageRun\">                                <xsl:with-param name=\"start\" select=\"number($page)-3\"/>                                <xsl:with-param name=\"end\" select=\"number($page)+3\"/>                            </xsl:call-template>                            &#8230;                            <xsl:call-template name=\"onePage\">                                <xsl:with-param name=\"value\" select=\"$npages\"/>		                        <xsl:with-param name=\"label\" select=\"''\"/>		                        <xsl:with-param name=\"class\" select=\"''\"/>                            </xsl:call-template>                        </xsl:otherwise>                    </xsl:choose>                    <xsl:call-template name=\"onePage\">                        <xsl:with-param name=\"value\" select=\"number($page)+1\"/>                        <xsl:with-param name=\"label\" select=\"'Next'\"/>                        <xsl:with-param name=\"class\" select=\"'fwd'\"/>                    </xsl:call-template>                </div>            </xsl:if>            <xsl:call-template name=\"pageLengthControl\">                <xsl:with-param name=\"location\" select=\"$location\"/>            </xsl:call-template>        </div>    </xsl:template>        <xsl:template name=\"onePage\">        <xsl:param name=\"value\"/>        <xsl:param name=\"label\"/>        <xsl:param name=\"class\"/>        <xsl:variable name=\"plabel\">            <xsl:choose>                <xsl:when test=\"$label=''\"><xsl:value-of select=\"$value\"/></xsl:when>                <xsl:otherwise><xsl:value-of select=\"$label\"/></xsl:otherwise>            </xsl:choose>        </xsl:variable>        <xsl:text>        </xsl:text>        <xsl:choose>            <xsl:when test=\"$value &lt; 1 or $value &gt; $npages\">                <span class=\"button {$class} inactive\"><xsl:value-of select=\"$plabel\"/></span>            </xsl:when>            <xsl:when test=\"$page=$value\">                <b><xsl:value-of select=\"$plabel\"/></b>            </xsl:when>            <xsl:otherwise>            	<a href=\"#\" onclick=\"return {$pageCallback}({$value})\">                    <span class=\"button {$class}\"><xsl:value-of select=\"$plabel\"/></span>            	</a>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:template name=\"pageRun\">        <xsl:param name=\"start\"/>        <xsl:param name=\"end\"/>        <xsl:call-template name=\"onePage\">            <xsl:with-param name=\"value\" select=\"$start\"/>            <xsl:with-param name=\"label\" select=\"''\"/>            <xsl:with-param name=\"class\" select=\"''\"/>        </xsl:call-template>        <xsl:if test=\"$start &lt; $end\">            <xsl:call-template name=\"pageRun\">                <xsl:with-param name=\"start\" select=\"number($start)+1\"/>                <xsl:with-param name=\"end\" select=\"$end\"/>            </xsl:call-template>        </xsl:if>    </xsl:template>        <xsl:template name=\"pageLengthControl\">        <xsl:param name=\"location\"/>        <div class=\"pageLengthControl\">            Show            <select name=\"pagesize_{$location}\" onchange=\"{$setPageLength}(this.value)\">                <option value=\"10\">                    <xsl:if test=\"number($pageLength)=10\">                        <xsl:attribute name=\"selected\">selected</xsl:attribute>                    </xsl:if>                    10                </option>                <option value=\"20\">                    <xsl:if test=\"number($pageLength)=20\">                        <xsl:attribute name=\"selected\">selected</xsl:attribute>                    </xsl:if>                    20                </option>                <option value=\"50\">                    <xsl:if test=\"number($pageLength)=50\">                        <xsl:attribute name=\"selected\">selected</xsl:attribute>                    </xsl:if>                    50                </option>                <option value=\"100\">                    <xsl:if test=\"number($pageLength)=100\">                        <xsl:attribute name=\"selected\">selected</xsl:attribute>                    </xsl:if>                    100                </option>            </select>            results per page        </div>    </xsl:template>        <xsl:template name=\"dataNotes\">		<div class=\"searchnote\">		   <xsl:attribute name=\"id\"><xsl:value-of select=\"$widgetIDprefix\"/>_filterButtons</xsl:attribute>		   <xsl:if test=\"$renderPrefixColumn = 1\">           		Click column heading to sort list - Click rows to select           		<span class=\"bbox\" onclick=\"{$clearSelectionCallback}();\">Reset&#160;selection</span>           		<br />           </xsl:if>           Text boxes under columns select matching rows           <span class=\"bbox\" onclick=\"return {$filterCallback}(document.getElementById('{$filterForm}'));\">Apply Filter</span>           <span class=\"bbox\" onclick=\"return {$filterResetCallback}(document.getElementById('{$filterForm}'));\">Clear Filter</span>           <br />         </div>    </xsl:template>            <!-- template setting column properties can be overridden by importing stylesheet -->        <xsl:template name=\"columnSetting\"/>        <!-- column headers come from VOTable FIELDS -->        <xsl:template name=\"header\">        <xsl:param name=\"location\"/>        <tr>            <xsl:call-template name=\"prefix-header\">                <xsl:with-param name=\"location\" select=\"$location\"/>            </xsl:call-template>            <xsl:call-template name=\"headerIter\">                <xsl:with-param name=\"count\" select=\"1\"/>                <xsl:with-param name=\"colnums\" select=\"concat($columnOrder,',')\"/>                <xsl:with-param name=\"location\" select=\"$location\"/>            </xsl:call-template>            <xsl:if test=\"$ncols &gt; 1 and $maxColumns &gt; 1\">                <th onclick=\"{$setMaxColumnsCallback}({$maxColumns - 1})\" title=\"Click to show fewer columns\">&#171;</th>            </xsl:if>            <xsl:if test=\"$ncols &gt; $maxColumns\">                <th onclick=\"{$setMaxColumnsCallback}({$maxColumns + 1})\" title=\"Click to show more columns\">&#187;</th>            </xsl:if>        </tr>        <xsl:if test=\"$location='top'\">            <tr id=\"{$filterRow}\">                <xsl:call-template name=\"prefix-filter\">                    <xsl:with-param name=\"location\" select=\"$location\"/>                </xsl:call-template>                <xsl:call-template name=\"filterIter\">                    <xsl:with-param name=\"count\" select=\"1\"/>                    <xsl:with-param name=\"colnums\" select=\"concat($columnOrder,',')\"/>                </xsl:call-template>                <td></td>                <td></td>            </tr>        </xsl:if>    </xsl:template>        <!-- recursive template to loop over fields in columnOrder -->        <xsl:template name=\"headerIter\">        <xsl:param name=\"count\"/>        <xsl:param name=\"colnums\"/>        <xsl:param name=\"location\"/>        <xsl:if test=\"$colnums and $count &lt;= $maxColumns\">            <xsl:variable name=\"posit\" select=\"number(substring-before($colnums,','))\"/>            <xsl:for-each select=\"$fieldlist[position()=$posit]\">                <xsl:call-template name=\"columnheader\">                    <xsl:with-param name=\"posit\" select=\"$posit\"/>                    <xsl:with-param name=\"location\" select=\"$location\"/>                </xsl:call-template>            </xsl:for-each>            <xsl:call-template name=\"headerIter\">                <xsl:with-param name=\"count\" select=\"1+$count\"/>                <xsl:with-param name=\"colnums\" select=\"substring-after($colnums,',')\"/>                <xsl:with-param name=\"location\" select=\"$location\"/>            </xsl:call-template>        </xsl:if>    </xsl:template>        <xsl:template name=\"columnheader\">        <xsl:param name=\"posit\"/>        <xsl:param name=\"location\"/>        <xsl:variable name=\"ID\">            <xsl:call-template name=\"getID\"/>        </xsl:variable>        <xsl:variable name=\"name\">            <xsl:call-template name=\"getName\"/>        </xsl:variable>        <xsl:choose>            <xsl:when test=\"$posit = $urlColumnNum\">                <th class=\"unsortable\" id=\"{$ID}_{$posit}_{$location}\">                    <xsl:value-of select=\"$name\"/>                </th>            </xsl:when>            <xsl:otherwise>                <th onclick=\"{$sortCallback}(this)\" id=\"{$ID}_{$posit}_{$location}\">                    <xsl:attribute name=\"title\">                        <xsl:variable name=\"descr\"                         select=\"DESCRIPTION|vo:DESCRIPTION|v1:DESCRIPTION|v2:DESCRIPTION|v3:DESCRIPTION|v4:DESCRIPTION\"/>                        <xsl:choose>                            <xsl:when test=\"$descr\">                                <xsl:value-of select=\"concat($descr,' (click to sort)')\"/>                            </xsl:when>                            <xsl:otherwise>                                <xsl:value-of select=\"concat('Click to sort by ',$name)\"/>                            </xsl:otherwise>                        </xsl:choose>                    </xsl:attribute>                    <xsl:if test=\"translate($ID,$lc,$uc)=translate($sortName,$lc,$uc)\">                        <xsl:attribute name=\"class\">                            <xsl:value-of select=\"$sortOrder\"/>                        </xsl:attribute>                    </xsl:if>                    <xsl:value-of select=\"$name\"/>                </th>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:template name=\"prefix-header\">        <xsl:param name=\"location\"/>        <xsl:choose>            <xsl:when test=\"$renderPrefixColumn = 1\">                <th>                    select                </th>            </xsl:when>            <xsl:when test=\"$renderPrefixColumn = 2\">                <th>                </th>            </xsl:when>        </xsl:choose>    </xsl:template>        <!-- recursive template to loop over fields in columnOrder -->        <xsl:template name=\"filterIter\">        <xsl:param name=\"count\"/>        <xsl:param name=\"colnums\"/>        <xsl:if test=\"$colnums and $count &lt;= $maxColumns\">            <xsl:variable name=\"posit\" select=\"number(substring-before($colnums,','))\"/>            <xsl:for-each select=\"$fieldlist[position()=$posit]\">                <xsl:call-template name=\"filterbox\">                    <xsl:with-param name=\"posit\" select=\"$posit\"/>                </xsl:call-template>            </xsl:for-each>            <xsl:call-template name=\"filterIter\">                <xsl:with-param name=\"count\" select=\"1+$count\"/>                <xsl:with-param name=\"colnums\" select=\"substring-after($colnums,',')\"/>            </xsl:call-template>        </xsl:if>    </xsl:template>        <xsl:template name=\"filterbox\">        <xsl:param name=\"posit\"/>        <td>            <xsl:if test=\"$posit != $urlColumnNum and (@datatype='char' or not(@arraysize)  or @arraysize=1)\">                <xsl:variable name=\"isChar\" select=\"@datatype='char' or @datatype='string'\"/>                <xsl:variable name=\"defaultComment\">                	<xsl:choose>                		<xsl:when test=\"$isChar\">String</xsl:when>						<xsl:otherwise>Number</xsl:otherwise>					</xsl:choose>                </xsl:variable>                <xsl:variable name=\"filterSep\" select=\"concat('|',$posit,':')\"/>                <input type=\"hidden\" name=\"vovfilter{$posit}_type\" value=\"{$isChar}\"/>                <input type=\"text\" name=\"vovfilter{$posit}\">                    <xsl:attribute name=\"title\">                        <xsl:choose>                            <xsl:when test=\"$isChar\">String: abc (exact match) or *ab*c* , ! to negate</xsl:when>                            <xsl:otherwise>Number: 10 or >=10 or 10..20 for a range , ! to negate</xsl:otherwise>                        </xsl:choose>                    </xsl:attribute>                    <xsl:attribute name=\"value\">                        <xsl:choose>                        	<xsl:when test=\"contains($filterText,$filterSep)\">                            	<xsl:value-of select=\"substring-before(substring-after($filterText,$filterSep),'|')\"/>                        	</xsl:when>                        	<xsl:otherwise>                        		<xsl:value-of select=\"$defaultComment\"/>                        	</xsl:otherwise>                        </xsl:choose>                    </xsl:attribute>                    <xsl:attribute name=\"class\">                        <xsl:choose>                        	<xsl:when test=\"contains($filterText,$filterSep)\">filter</xsl:when>                        	<xsl:otherwise>filter defaultComment</xsl:otherwise>                        </xsl:choose>											</xsl:attribute>                                        <xsl:attribute name=\"onclick\">                    	<xsl:value-of select=\"$clickClearCallback\"/>(this, '<xsl:value-of select=\"$defaultComment\"/>');                    </xsl:attribute>                    <xsl:attribute name=\"onblur\">                    	<xsl:value-of select=\"$clickResetCallback\"/>(this, '<xsl:value-of select=\"$defaultComment\"/>');                    </xsl:attribute>                </input>            </xsl:if>        </td>    </xsl:template>        <xsl:template name=\"prefix-filter\">        <xsl:param name=\"location\"/>        <xsl:choose>            <xsl:when test=\"$renderPrefixColumn = 1\">                <td title=\"Click to select all rows\" class=\"bbox\">                    <xsl:attribute name=\"onclick\">                        <xsl:value-of select=\"$selectAllRowsCallback\"/>(this);                    </xsl:attribute>                    <input type=\"hidden\" name=\"select_all_rows\">                        <xsl:attribute name=\"value\">                            <xsl:value-of select=\"$selectAllList\"/>                        </xsl:attribute>                    </input>                    <xsl:value-of select=\"$selectAllLabel\"/>                </td>            </xsl:when>            <xsl:when test=\"$renderPrefixColumn = 2\">                <td>                </td>            </xsl:when>        </xsl:choose>    </xsl:template>        <xsl:template name=\"processRow\">        <xsl:param name=\"TDlist\"/>        <xsl:param name=\"format\"/>        <xsl:param name=\"selector\"/>                <xsl:call-template name=\"prefix-column\">            <xsl:with-param name=\"ident\" select=\"$selector\"/>            <xsl:with-param name=\"format\" select=\"$format\"/>        </xsl:call-template>        <xsl:call-template name=\"columnIter\">            <xsl:with-param name=\"count\" select=\"1\"/>            <xsl:with-param name=\"colnums\" select=\"concat($columnOrder,',')\"/>            <xsl:with-param name=\"TDlist\" select=\"$TDlist\"/>        </xsl:call-template>        <td class=\"odd\"></td>        <td class=\"odd\"></td>    </xsl:template>        <xsl:template name=\"prefix-column\">        <xsl:param name=\"ident\"/>        <xsl:param name=\"format\"/>                <xsl:choose>            <xsl:when test=\"$renderPrefixColumn = 1\">                <td>                    <input id=\"cb-{$ident}\" type=\"checkbox\" name=\"cb-{$ident}\" value=\"cb-{$ident}\">                        <xsl:variable name=\"isSelected\">                            <xsl:call-template name=\"isSelected\">                                <xsl:with-param name=\"selector\" select=\"$ident\"/>                            </xsl:call-template>                        </xsl:variable>                        <xsl:if test=\"$isSelected = $selectedvalue\">                            <xsl:attribute name=\"checked\"/>                        </xsl:if>                    </input>                    <label for=\"cb-{$ident}\">                    </label>                </td>            </xsl:when>            <xsl:when test=\"$renderPrefixColumn = 2\">                <td>                </td>            </xsl:when>        </xsl:choose>    </xsl:template>        <!-- recursive template to loop over columns in columnOrder -->        <xsl:template name=\"columnIter\">        <xsl:param name=\"count\"/>        <xsl:param name=\"colnums\"/>        <xsl:param name=\"TDlist\"/>        <xsl:if test=\"$colnums and $count &lt;= $maxColumns\">            <xsl:variable name=\"posit\" select=\"number(substring-before($colnums,','))\"/>            <xsl:for-each select=\"$TDlist[position()=$posit]\">                <xsl:call-template name=\"processColumn\">                    <xsl:with-param name=\"TDlist\" select=\"$TDlist\"/>                    <xsl:with-param name=\"posit\" select=\"$posit\"/>                </xsl:call-template>            </xsl:for-each>            <xsl:call-template name=\"columnIter\">                <xsl:with-param name=\"count\" select=\"1+$count\"/>                <xsl:with-param name=\"colnums\" select=\"substring-after($colnums,',')\"/>                <xsl:with-param name=\"TDlist\" select=\"$TDlist\"/>            </xsl:call-template>        </xsl:if>    </xsl:template>        <xsl:template name=\"processColumn\">        <xsl:param name=\"TDlist\"/>        <xsl:param name=\"posit\"/>        <td>            <!--            For show and debugging            -->            <xsl:attribute name='val'>                <xsl:value-of select=\"@val\"/>            </xsl:attribute>            <xsl:choose>                <xsl:when test=\"$posit = $urlColumnNum\">                    <xsl:call-template name=\"processURL\">                        <xsl:with-param name=\"TDlist\" select=\"$TDlist\"/>                    </xsl:call-template>                </xsl:when>                <xsl:when test=\"$posit = $decColumnNum\">                    <xsl:call-template name=\"processSex\">                        <xsl:with-param name=\"precision\" select=\"$decPrecision\"/>                        <xsl:with-param name=\"scale\" select=\"'1'\"/>                    </xsl:call-template>                </xsl:when>                <xsl:when test=\"$posit = $raColumnNum\">                    <xsl:call-template name=\"processSex\">                        <xsl:with-param name=\"precision\" select=\"$raPrecision\"/>                        <xsl:with-param name=\"scale\" select=\"'15'\"/>                    </xsl:call-template>                </xsl:when>                <xsl:otherwise>                    <!-- Trim long columns (need to make this show full text if clicked)  -->                    <xsl:choose>                        <xsl:when test=\"substring(.,101) and not(contains(.,'&lt;'))\">                            <xsl:value-of select=\"concat(substring(.,1,97),'...')\"/>                        </xsl:when>                        <!--                        added the arraysize check to make them show up on                        the same line when there was an array                        some people may prefer the other way                        -->                        <xsl:when test=\"contains('|float|int|double|',concat('|',$fieldlist[position()=$posit]/@datatype,'|')) and not($fieldlist[position()=$posit]/@arraysize)\">                            <xsl:value-of select=\".\"/>                        </xsl:when>                        <xsl:otherwise>                            <!-- replace spaces with non-breaking spaces -->                            <xsl:call-template name=\"replace\"/>                        </xsl:otherwise>                    </xsl:choose>                </xsl:otherwise>            </xsl:choose>        </td>    </xsl:template>        <xsl:template name=\"replace\">        <xsl:param name=\"text-string\" select=\".\"/>        <xsl:param name=\"find-word\" select=\"' '\"/>        <xsl:param name=\"replace-with\" select=\"'&#160;'\"/>        <xsl:choose>            <xsl:when test=\"contains($text-string,$find-word)\">                <xsl:call-template name=\"replace\">                    <xsl:with-param name=\"text-string\" select=\"concat(substring-before($text-string,$find-word),$replace-with,substring-after($text-string,$find-word))\"/>                    <xsl:with-param name=\"find-word\" select=\"$find-word\"/>                    <xsl:with-param name=\"replace-with\" select=\"$replace-with\"/>                </xsl:call-template>            </xsl:when>            <xsl:otherwise>                <xsl:value-of select=\"$text-string\"/>            </xsl:otherwise>        </xsl:choose>    </xsl:template>            <xsl:template name=\"processURL\">        <xsl:param name=\"TDlist\"/>        <xsl:variable name=\"format\" select=\"$TDlist[position()=$formatColumnNum]\"/>        <xsl:variable name=\"href\" select=\"normalize-space(.)\"/>        <xsl:variable name=\"sformat\" select=\"translate(substring-after($format,'/'),$lc,$uc)\"/>        <xsl:variable name=\"label\">            <xsl:choose>                <xsl:when test=\"$sformat\">                    <xsl:value-of select=\"$sformat\"/>                </xsl:when>                <xsl:otherwise>Link</xsl:otherwise>            </xsl:choose>        </xsl:variable>        <a href=\"{$href}\" target=\"_blank\">            <xsl:value-of select=\"$label\"/>        </a>    </xsl:template>        <!-- Convert to sexagesimal format dd:mm:ss -->        <xsl:template name=\"processSex\">        <xsl:param name=\"precision\">10</xsl:param>        <xsl:param name=\"scale\">1</xsl:param>        <xsl:variable name=\"original\">            <xsl:choose>                <xsl:when test=\"@val\">                    <xsl:value-of select=\"translate(@val,'+','')\"/>                </xsl:when>                <xsl:otherwise>                    <!-- Some tables have a leading + which causes problems, so remove it -->                    <xsl:value-of select=\"translate(.,'+','')\"/>                </xsl:otherwise>            </xsl:choose>        </xsl:variable>        <xsl:choose>            <xsl:when test=\"string-length(normalize-space($original)) &gt; 0\">                <xsl:variable name=\"numb\" select=\"number($original)\"/>                <xsl:variable name=\"absnumb\"                 select=\"round((1-2*($numb &lt; 0))*$numb*3600*$precision div $scale + 0.5)\"/>                                <xsl:variable name=\"degr\"                 select=\"floor($absnumb div (3600*$precision))\"/>                                <xsl:variable name=\"mn\"                 select=\"floor(($absnumb - $degr*3600*$precision) div (60*$precision))\"/>                <xsl:variable name=\"sc\"                 select=\"($absnumb - $precision*(3600*$degr + 60*$mn)) div $precision\"/>                <xsl:if test=\"$numb &lt; 0\">-</xsl:if>                <xsl:value-of select=\"concat(format-number($degr,'00'), $sexSeparator, format-number($mn,'00'), $sexSeparator, format-number($sc, '00.0##'))\"/>            </xsl:when>            <xsl:otherwise>                ---            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <!--    Returns $selectedvalue if the selector is in the comma-delimited    list of selectedRows.    Stupid Xpath 1.0 does not have the $*(#@ ends-with function, so have to    check that by hand.    -->        <xsl:variable name=\"selectedvalue\">selectedimage</xsl:variable>        <xsl:template name=\"isSelected\">        <xsl:param name=\"selector\"/>        <xsl:if test=\"$selectedRows\">            <xsl:choose>                <xsl:when test=\"$selector = $selectedRows or contains($selectedRows,concat(',',$selector,',')) or starts-with($selectedRows,concat($selector,','))\">                    <xsl:value-of select=\"$selectedvalue\"/>                </xsl:when>                <xsl:otherwise>                    <xsl:call-template name=\"endswithSelected\">                        <xsl:with-param name=\"selector\" select=\"concat(',',$selector)\"/>                        <xsl:with-param name=\"sparam\" select=\"$selectedRows\"/>                    </xsl:call-template>                </xsl:otherwise>            </xsl:choose>        </xsl:if>    </xsl:template>        <xsl:template name=\"endswithSelected\">        <xsl:param name=\"selector\"/>        <xsl:param name=\"sparam\"/>        <xsl:if test=\"contains($sparam,$selector)\">            <xsl:variable name=\"tail\" select=\"substring-after($sparam,$selector)\"/>            <xsl:choose>                <xsl:when test=\"$tail\">                    <xsl:call-template name=\"endswithSelected\">                        <xsl:with-param name=\"selector\" select=\"$selector\"/>                        <xsl:with-param name=\"sparam\" select=\"$tail\"/>                    </xsl:call-template>                </xsl:when>                <xsl:otherwise>                    <xsl:value-of select=\"$selectedvalue\"/>                </xsl:otherwise>            </xsl:choose>        </xsl:if>    </xsl:template>    </xsl:stylesheet>";
voview.getTableRow_xsl = "<xsl:stylesheet xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:vo=\"http://www.ivoa.net/xml/VOTable/v1.1\" xmlns:v1=\"http://vizier.u-strasbg.fr/VOTable\" xmlns:v2=\"http://vizier.u-strasbg.fr/xml/VOTable-1.1.xsd\" xmlns:v3=\"http://www.ivoa.net/xml/VOTable/v1.0\" xmlns:v4=\"http://www.ivoa.net/xml/VOTable/v1.2\" exclude-result-prefixes=\"vo v1 v2 v3 v4\" version=\"1.0\">  	<xsl:param name=\"rowNumber\">10</xsl:param>  	<xsl:variable name=\"allRows\" select=\"/VOTABLE/RESOURCE/TABLE/DATA/TABLEDATA/TR\"/>	<xsl:variable name=\"allRows0\" select=\"/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:DATA/vo:TABLEDATA/vo:TR\"/>	<xsl:variable name=\"allRows1\" select=\"/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:DATA/v1:TABLEDATA/v1:TR\"/>	<xsl:variable name=\"allRows2\" select=\"/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:DATA/v2:TABLEDATA/v2:TR\"/>	<xsl:variable name=\"allRows3\" select=\"/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:DATA/v3:TABLEDATA/v3:TR\"/>	<xsl:variable name=\"allRows4\" select=\"/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:DATA/v4:TABLEDATA/v4:TR\"/>	<xsl:variable name=\"filterRows\" select=\"$allRows[position()=$rowNumber]\"/>	<xsl:variable name=\"filterRows0\" select=\"$allRows0[position()=$rowNumber]\"/>	<xsl:variable name=\"filterRows1\" select=\"$allRows1[position()=$rowNumber]\"/>	<xsl:variable name=\"filterRows2\" select=\"$allRows2[position()=$rowNumber]\"/>	<xsl:variable name=\"filterRows3\" select=\"$allRows3[position()=$rowNumber]\"/>	<xsl:variable name=\"filterRows4\" select=\"$allRows4[position()=$rowNumber]\"/>             <xsl:variable name=\"fieldlist\" select=\"/VOTABLE/RESOURCE/TABLE/FIELD|/vo:VOTABLE/vo:RESOURCE/vo:TABLE/vo:FIELD|/v1:VOTABLE/v1:RESOURCE/v1:TABLE/v1:FIELD|/v2:VOTABLE/v2:RESOURCE/v2:TABLE/v2:FIELD|/v3:VOTABLE/v3:RESOURCE/v3:TABLE/v3:FIELD|/v4:VOTABLE/v4:RESOURCE/v4:TABLE/v4:FIELD\"/>        <xsl:variable name=\"lc\" select=\"'abcdefghijklmnopqrstuvwxyz'\"/>    <xsl:variable name=\"uc\" select=\"'ABCDEFGHIJKLMNOPQRSTUVWXYZ'\"/>            <xsl:template name=\"getColumnByName\">        <xsl:param name=\"value\"/>        <xsl:variable name=\"tvalue\" select=\"translate($value,$lc,$uc)\"/>        <xsl:for-each select=\"$fieldlist\">            <xsl:variable name=\"ID\">                <xsl:call-template name=\"getID\"/>            </xsl:variable>            <xsl:if test=\"translate($ID,$lc,$uc) = $tvalue\">                <xsl:value-of select=\"position()\"/>            </xsl:if>        </xsl:for-each>    </xsl:template>        <!-- ID is primary FIELD identifier (fall back to name if ID is not available) -->        <xsl:template name=\"getID\">        <xsl:choose>            <xsl:when test=\"@ID\">                <xsl:value-of select=\"@ID\"/>            </xsl:when>            <xsl:otherwise>                <xsl:value-of select=\"@name\"/>            </xsl:otherwise>        </xsl:choose>    </xsl:template>        <xsl:template match=\"TABLEDATA|vo:TABLEDATA|v1:TABLEDATA|v2:TABLEDATA|v3:TABLEDATA|v4:TABLEDATA\">           	<xsl:for-each select=\"$filterRows|$filterRows0|$filterRows1|$filterRows2|$filterRows3|$filterRows4\">   	            <xsl:copy>       	            <xsl:apply-templates select=\"@*|node()\"/>           	    </xsl:copy>            </xsl:for-each>    </xsl:template>    <xsl:template match=\"TR//@*|TR//node()|vo:TR//@*|vo:TR//node()|v1:TR//@*|v1:TR//node()|v2:TR//@*|v2:TR//node()|v3:TR//@*|v3:TR//node()|v4:TR//@*|v4:TR//node()\">        <xsl:copy>            <xsl:apply-templates select=\"@*|node()\"/>		</xsl:copy>    </xsl:template>        <xsl:template match=\"text()\"/>        <xsl:template name=\"start\" match=\"/\">            <xsl:apply-templates/>    </xsl:template></xsl:stylesheet>";
