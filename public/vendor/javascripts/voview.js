// VOTable viewer
// R. White, 2007 October 25

function votviewer(vot_name) {

    // Note all initialization is at the end (after the methods are defined)
    var me          = this;       
    // FELIX: changed to 12 columns as the default. This has to be changed in voview.xsl, too. 

    me.maxColumnsOriginal = 14;
 
    this.clearOutput = function(newChild, base) {
        if (!base) {
	    base = me.output;
	}
    
	while (base.hasChildNodes()) {
	    base.removeChild(me.output.firstChild);
	}
	
	if (newChild) {
	    base.appendChild(newChild);
	}
    };

    this.clearPageInfo = function() {
	me.sortColumn = undefined;
	me.maxColumns = me.maxColumnsOriginal;
	me.columnOrder = undefined;
	me.page = 1;
    };

    this.clearForm = function() {
    
	// reset the form and restore most things to default state

	// start with a blank line and empty display
	me.clearOutput();

	me.xml = undefined;
	
	// extra XSLT parameters
	me.xslParams = {};
	me.selectedRows = [];

	me.pageLength = 20;
	me.clearPageInfo();
	me.sortToggle = true;

	if (me.form) {
	    me.form.reset();
	}

    };

    this.getParameter = function(namespace, name) {
	// get XSLT parameter
	return me.xslParams[name];
    };

    this.setParameter = function(namespace, name, value) {
	// set XSLT parameter
	me.xslParams[name] = value;
    };

    this.getXML = function() {
	return me.filter.getDocument();
    };

    this.setMaxColumns = function(maxcolumns) {
    
	if (maxcolumns != me.maxColumns) {
	    me.maxColumns = maxcolumns;
	    me.sortToggle = false;
	    me.sort();
	}
    };

    this.setActColumnOrder = function(maxcolumns, order) {
	if ((maxcolumns == me.maxColumns) || (maxcolumns==null && me.maxColumns==null)) {
	    if (me.columnOrder) {
		if (me.columnOrder.length == order.length) {
		    // just return if the order is unchanged
		    var equals = true;
		    for (var i=0; i<order.length; i++) {
			if (order[i] != me.columnOrder[i]) {
			    equals = false;
			    break;
		        }
		    }
		    if (equals) {
		        return;
		    }
		}
	    } else if (!order) {
		// both old and new order are undefined (default)
	        return;
	    }
	}
	
	me.columnOrder = order;
	me.maxColumns  = maxcolumns;
	me.sortToggle  = false;
	me.sort();
    };

    this.selectAllRows = function(state) {
       // FELIX added select buttons

       // this is the table containing all the data
       var tablecontent = document.getElementById("datatable").getElementsByTagName("tbody")[0];
       // now get a list of all the rows in that table. 
       var rows = tablecontent.getElementsByTagName("tr");
       
       for (var i=0; i<rows.length; i++) {
          // we have to find out if the row is already selected or not.
          var boxes = rows[i].getElementsByTagName("input");
          if (boxes.length>0) {
             var boxischecked = boxes[0].checked;
             if ((state=='select' && boxischecked==false) || (state=='unselect' && boxischecked==true)) {
                rows[i].onclick();
             }
          }      
       }
    };

    this.moveItemUpOrDown = function(posit, row) {
       // FELIX 
       // This function acts on me.columnOrder and on me.maxColumns
       // The element that is right now in the row "row" (and has its original place in the table at posit)
       // should now go either above or below the line depending on where it is right now.
       var order      = me.columnOrder;
       var maxcolumns = me.maxColumns;
       
       if ((order.indexOf(posit)+1) != row) {
          alert("ERROR: column order is wrong");
          return
       }          
       // remove the element from where it is now
       order.splice(row-1,1);
       
       if (row<=maxcolumns) {
          // we have to move the element below the bar          
          order.splice(maxcolumns-1,0,posit);
          maxcolumns -= 1;
       } else {
          // we have to bring the element up
          order.splice(maxcolumns,0,posit);
          maxcolumns += 1;
       }
       this.setActColumnOrder(maxcolumns,order);
    };

    this.clear = function() {
        me.clearSelection();
        me.clearFilter();
    };

    this.clearSelection = function() {
        if (me.preSelects) {
            me.selectedRows = me.preSelects;
        } else {
            me.selectedRows = [];
        }
    };
    
    this.setCanSelectRows = function(val) {
        me.canSelectRows = val;
    }
    
    this.setSelectRowUCD = function(val) {
        me.selectRowUCD = val;
    }
    
    this.clearFilter = function() {
        if (me.filter) {
            if (me.filter.clear()) {
                me.sort();
            }
        }
        return true;
    };


    this.setSelection = function(selectors) {
	// set selection from a list or a comma-separated string of selectors
	me.clearSelection();
	return me.extendSelection(selectors);
    };
    
    this.getSelections = function() {
        return me.selectedRows;
    }

    this.extendSelection = function(selectors) {
	// extend current selection from a list or comma-separated string of selectors
	if (! selectors) {
	    return true;
	}
	if (selectors.split) {
	    // looks like a string
	    me.selectedRows = me.selectedRows.concat(selectors.split(","));
	} else if (selectors.length) {
	    // looks like a list
	    me.selectedRows = me.selectedRows.concat(selectors);
	}
	
	// remove any duplicate selectors from the selection
	var uniq = [];
	var dict = {};
	for (var i=0, selector; i < me.selectedRows.length; i++) {
	    selector = me.selectedRows[i];
	    if (dict[selector] == undefined) {
		dict[selector] = 1;
		uniq.push(selector);
	    }
	}
        // keep selectors in sorted order
	uniq.sort();
	me.selectedRows = uniq;
	return true;
    };

    this.selectingRow = function(el, dataset) {
	var cclass = el.className;
        // only allow row selection in rows with a checkbox ???
        var boxes = el.getElementsByTagName("input");
        if (boxes.length > 0) {
	    for (var i=0; i < me.selectedRows.length; i++) {
		if (me.selectedRows[i] == dataset) {
		    // second click disables selection
		    me.selectedRows.splice(i,1);
		    if (cclass) {
			el.className = removeSubstring(cclass,"selectedimage");
		    }
                    boxes[0].checked = false;
                    if (this.selectDel) {
                        me.selectDel(dataset);   // I don't think that this is ever defined?
                    }
		    return;
	        }
	    }
            boxes[0].checked=true;
	    // not in current selection, so add this to selection
	    me.selectedRows.push(dataset);
	    
	    me.selectedRows.sort();
            if (me.selectAdd) {
                me.selectAdd(dataset);   // I don't think that this is ever defined?
            }
	    
	    if (cclass) {
		el.className = cclass + " selectedimage"; 
	    } else {
	        el.className = "selectedimage"; 
	    }
        }
    };

    this.setSelectedRows = function(rows) {
        me.preSelects = rows;
    }
    
    this.setSelectCallBack = function(add, del) {
        me.selectAdd = add;
        me.selectDel = del;
    }

    this.setPageLength = function(pageLength) {
	// change number of rows per page
	if ((!pageLength) || me.pageLength == pageLength) {
	    return;
	}
	
	var start = me.pageLength*(me.page-1);
	me.pageLength = pageLength;
	me.sort(undefined, undefined, Math.floor(start/pageLength)+1);
    };

    this.xsltProcessCallBack = function() {
       // This is an empty function that can be overridden. It gets executed when the HTML page has been created through xslt and has
       // been inserted into the output div.    
    }

    this.sort = function(sortColumn, sortOrder, newpage) {
    
	if (newpage) {
	    me.page = newpage;
	}
	
	// sort direction gets toggled only if the page does not change
	var pchanged = newpage != undefined;

	if (!sortColumn) {
	    sortColumn = me.sortColumn || "";
	}
	
	if (!sortOrder) {
	    if (me.sortToggle && sortColumn == me.sortColumn && (! pchanged)) {
		// toggle sort order
		if (me.sortOrder[sortColumn] == "ascending") {
		    sortOrder = "descending";
		} else {
		    sortOrder = "ascending";
		}
	    } else {
		// restore previous sort order or use default
	        sortOrder = me.sortOrder[sortColumn] || "ascending";
	    }
	}
	
	me.sortColumn            = sortColumn;
	me.sortOrder[sortColumn] = sortOrder;
	
	me.sortToggle = true;
	// save state so back button works

        // If the XML has not had values converted do so.
	// We should only do this once.
	if (!me.valueAttributeAdded ) {
	    var valueXslProc = new XSLTProcessor();
	    valueXslProc.importStylesheet(me.valueXsl);
	    tmpDoc = valueXslProc.transformToDocument(me.xml);
	    me.xml = tmpDoc;
	    me.filter.setBaseDocument(me.xml);
	    me.valueAttributeAdded = true;
	}
	
	if (! me.myXslProc) {
	    // Mozilla/IE XSLT processing using Sarissa
	    if (!window.XSLTProcessor) {
	        return me.noXSLTMessage();
	    }

	    me.myXslProc = new XSLTProcessor();
	    if ((!me.myXslProc) || (!me.myXslProc.importStylesheet)) {
		return me.noXSLTMessage();
	    }
	    
	    // attach the stylesheet; the required format is a DOM object, and not a string
	    me.myXslProc.importStylesheet(me.xslt);
	}

	// do the transform
	me.myXslProc.setParameter(null, "sortOrder",  sortOrder);
	me.myXslProc.setParameter(null, "sortColumn", sortColumn);
	me.myXslProc.setParameter(null, "page",       ""+me.page);
	me.myXslProc.setParameter(null, "pageLength", ""+me.pageLength);
	me.myXslProc.setParameter(null, "widgname",   me.widgname);
	
	if (me.canSelectRows) {
	    me.myXslProc.setParameter(null, "canSelectRows", "true");
	} else {
	    me.myXslProc.setParameter(null, "canSelectRows", "");
	}
	
	if (me.selectRowUCD) {
	    me.myXslProc.setParameter(null, "selectRowUCD", me.selectRowUCD);
	}
	
	for (var p in me.xslParams) {
	    me.myXslProc.setParameter(null, p, me.xslParams[p]);
	}
	
	if (me.maxColumns) {
	    me.myXslProc.setParameter(null, "maxColumns", ""+me.maxColumns);
	} else {
	    if (me.myXslProc.removeParameter) {
		me.myXslProc.removeParameter(null, "maxColumns");
	    } else {
		// IE doesn't have removeParameter
		// me.myXslProc.setParameter(null, "maxColumns", null);
                
                // FELIX: this code was added by TomMcGlynn to overcome the 
                // IE8 Problem.
                //IE doesn't have removeParameter -- so we set back to 11
		me.myXslProc.setParameter(null, "maxColumns", me.maxColumnsOriginal);
	    }
	}
	
	if (me.columnOrder) {
	    me.myXslProc.setParameter(null, "columnOrder", (me.columnOrder.join(","))+",");
	} else {
	    if (me.myXslProc.removeParameter) {
	        me.myXslProc.removeParameter(null, "columnOrder");
	    } else {
	        me.myXslProc.setParameter(null, "columnOrder", null);
	    }
        }
	
	if (me.selectedRows) {
	    me.myXslProc.setParameter(null, "selectedRows", me.selectedRows.join(","));
	}
	
	// set extra XSLT parameters
	for (var p in me.xslParams) {
	    me.myXslProc.setParameter(null, p, me.xslParams[p]);
	}
	
	var xmlDoc   = me.getXML();
	var tables = xmlDoc.getElementsByTagName("TABLE");
		
	me.clearOutput();
	if (!tables || tables.length <= 0) {
	    me.printErrorDoc(me.output, xmlDoc);
		    
	} else {

	    // create the HTML table and insert into document
	    var finishedHTML = me.myXslProc.transformToFragment(me.getXML(), document);
//	    alert("doc is:"+new XMLSerializer().serializeToString(finishedHTML));
	    try {
	         me.output.appendChild(document.adoptNode(finishedHTML));
	    } catch (e) {
		try {
		    me.output.appendChild(document.importNode(finishedHTML,true));
		} catch (e) {
		    me.output.appendChild(finishedHTML);
		}
	    }
	    
	    var ctablename = me.widgname+'.fields';
	    var ftable = document.getElementById(ctablename);
	    
	    if (ftable) {
		var tablednd = new TableDnD.TableDnD();
		tablednd.onDrop = me.setColumnOrder;
		tablednd.init(ftable);
	    }
            
            me.xsltProcessCallBack();
	}
	return false;
    };
	
    this.printErrorDoc = function(node, xmlDoc) {
       node.innerHTML = "No data table found";
    }  
            
    this.errorMessage = function(msg) {
	var p = document.createElement('p');
	p.innerHTML = msg;
	me.clearOutput(p);
	return false;
    };

    this.noXSLTMessage = function() {
	me.errorMessage("Sorry, your browser does not support XSLT -- try Firefox, Safari (version 3), Mozilla (version > 1.3), Internet Explorer, or other compatible browsers.");
	return false;
    };

    this.updateViewParams = function(view, name, value) {
        if (!me.specView) {
            me.specView = new Object();
        }
        if (!me.specView[view]) {
            me.specView[view] = new Object();
        }
        me.specView[view][name] = value;
    };

    // callbacks for selection list
    this.selectRow = function(el,dataset,event) {
	var ev = event || window.event;
	// don't select when links are clicked
	if (ev && ev.target && ev.target.tagName.toLowerCase() == "a") return;
	me.selectingRow(el,dataset);
    }

    // insert a term into a search box
    this.clearAll = function() {
	if (confirm("Clear form and results?")) {
	    // Reset form and clear saved state
	    me.clearForm();
	    me.clearState();
	}
	return false;
    }
    
    this.getFilterForm = function() {
        return document.getElementById(me.widgname+".filterForm");
    }

    // filtering hooks
    this.filterByColumn = function(form) {
        if (!form) {
	    form = me.getFilterForm();
	}
	var changed = me.filter.filterByColumn(form);
	if (changed) {
	    me.sortToggle = false;
	    me.page = 1;
	    me.sort();
	}
	return false;
    }

    this.resetFilter = function(form) {
        if (!form) {
	    form = me.getFilterForm();
	}
	var changed = me.filter.clear(form);
	if (changed) {
	    me.sortToggle = false;
	    me.page = 1;
	    me.sort();
	}
	return false;
    }

    this.setColumnOrder = function(table, row) {
	// determine the column order from the table
	var rows       = table.tBodies[0].rows;
	var maxcolumns = rows.length-1;
	var order      = [];
	for (var i=0; i<rows.length; i++) {
	    var classname = rows[i].className || "";
	    if (classname.indexOf("separator") >= 0) {
		maxcolumns = i;
	    } else {
		// ID for row is 'fieldrow_<number>'
		var f = rows[i].id.split('_');
		order.push(parseInt(f[f.length-1],10));
	    }
	}
	me.setActColumnOrder(maxcolumns, order);
    }
    
    this.init  = function(url, output, post) {
        try {
	    me.xinit(url, output, post);
	} catch (e) {
	    alert("Initialization Error:"+e);
	}
        return alert;
    }
    
    
    this.xinit = function(url, output, post) {
	if (!output) {
	    alert("You must specify an output DOM element!");
	    return;
	} else {
	    me.baseElement = document.getElementById(output);
	    if (! me.baseElement) {
	        alert("The specified output element does not exist");
		return;
	    }
	}
	if (!me.output) {
	    me.output = document.createElement("div");
	}
	
	me.baseElement.appendChild(me.output);
	
	me.filter     = new XSLTFilter(null, this);
	me.xslParams  = {};
 
	me.errorMessage("Searching...");
	me.filter.clearXSL();
        me.filter.setBaseDocument(null);
	me.clearSelection();
	
	me.valueAttributeAdded  = false;
	me.sortOrder              = [];
	me.selectedRows         = [];
	
	me.page                 = 1;
	me.pageLength           = 20;
	
	me.url                  = url;
        me.post                 = post; 
	
        me.getXMLDoc(me, "valueXsl", "xsl/addValue.xml", me.secondFile);
    }
    
    // Continuation functions -- these are called in turn
    // after successful loads of the previous document.
    // 
    // This function is now part of the votviewer class. This has the advantage that
    // we can easily register a callback
    this.secondFile = function() {
        me.getXMLDoc(me, "xslt", "xsl/voview.xml", me.thirdFile);
    }
    
    this.thirdFile = function() {
        me.getXMLDoc(me, "xml", me.url, me.sort, me.post);
    }   
    
    this.loadCallBack = function(prop, error) {
      // This is an empty function that can be overridden. It gets executed when 
      // the page is loaded completely or an error has occurred. This is before the xslt processing.
    }
    
    // Get the document and then call the next function
    // in the chain when it's ready.
    this.getXMLDoc = function(obj, prop, url, func, post) {       

       var proxyURL = "proxy.py?url=";
       
       var req = new XMLHttpRequest();
       try {
           if (post) {
               req.open("POST", url, true);
	   } else {
	       req.open("GET", url, true);
	   }
       } catch (e) {
           if (! (url.substring(0,proxyURL.length) == proxyURL) ) {
	       url = proxyURL + url;
	       return me.getXMLDoc(obj, prop, url, func, post);
	   } else {
	       if (url.substring(0,proxyURL.length) == proxyURL){
	           url = url.substring(proxyURL.length);
	       }
	       throw "Unable to open "+url;
	   }
       }    
       var body = document.lastChild.lastChild;
       if (body) body.className = "busy";

       if (req.overrideMimeType) { 
          req.overrideMimeType("text/xml");
       }       
       
       if (post) {
          req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
       }   
       
       req.onreadystatechange = function() {
           if (req.readyState == 4) {
	       var body = document.lastChild.lastChild;
	       if (body) {
		   // keep both of these so it works on IE too (maybe)
		   body.removeAttribute("class");
		   body.removeAttribute("className");
	       }
	       if (req.status != 200) {
	           alert("Error accessing URL:"+url+", "+req.status); 
                   me.loadCallBack(prop, true);
	       } else {               
                   var xml   = req.responseXML;
                   if (!xml || !xml.firstChild) {
                       // IE does not implement the overrideMimeType function which is however, standard w3c.
                       // We check if we can use an ActiveXObject instead.
                       
                       //google: convert an responseText into a DOM document object
                       
                       try {
                          var active = new ActiveXObject("Msxml2.DOMDocument");                   
                       } catch(err) {
                          alert( "Data is not xml and can not use overrideMimeType nor ActiveXObject: "+url );
                          me.loadCallBack(prop, true);
                          return null;
                       }   
                    active.loadXML(req.responseText);
                    xml = active;
                   }
                   me.loadCallBack(prop, false);
                   obj[prop] = xml;
		   func();
	       }
	   }
       }
       req.send(post);
       
       return null;
    }

    if (name) {
        me.widgname = vot_name;
    } else {
        me.widgname = 'rd';
    }
    me.canSelect = false;    
    return false;
}
