// Javascript code directly used by the interface 
// the config.js script must be run before as there some variables and functions are initialized

idleFormTimer = null;

function toggleInput(thisnode, openimage, closeimage, immediate, clean, element, direction) {
   // This is the standard function for toggling a normal input field. The field should be cleaned at closing
   // and it should open immediately.
   
   // This returns the next element in the tree. 
   
   var nextsibling = thisnode.nextSibling;

   if (typeof(element)=='undefined') {
      element = 'DIV';
   }

   // we go down the tree from where we are (same level) until we hit the next node that is of type element   
   while (nextsibling != null) {
      if (nextsibling.nodeName == element) {
         break;
      } else {
         nextsibling = nextsibling.nextSibling;
      }   
   }
   
   if (nextsibling != null) {
       
      // If there is a element (e.g. a DIV element) toggle the display
      var changestate = toggleDisplay(nextsibling, immediate, clean, direction);
      
      // try to toggle an image if there is one present
      if (changestate != false) {
         flipImage(thisnode, changestate, openimage, closeimage);
      }

      // If that div has a text input field, change its length
      var inputfields = nextsibling.getElementsByTagName("INPUT");  
      if ((inputfields.length>0) && (changestate=="open")) {
         changeInputLength(inputfields[0])
      }
   }
}

function toggleDisplay(thisnode, immediate, clean, direction) {
   // This function toggles the display status of the next subelement 'DIV' of the parent node "this".
   // Alternatively one can specity the element that should be toggled. If there are input fields in thisnode
   // then per default they are cleaned. If this is not wished, specify clean=anything.
               
   if (typeof(immediate)=='undefined') {
      immediate = 'yes';
   }
               
   var changestate = false;   
   if (thisnode != null) {       
      // Found one or more elements. Will toggle only the first one!
      var displayattribute = thisnode.style.display;
        
      if (((displayattribute=="none") && (typeof(direction)=='undefined')) || (direction=='open')) {
         if (immediate=="yes") {
            thisnode.style.display = "";
         } else { 
            slidedown(thisnode);         
         }
         changestate = "open";
      } else {
         if (immediate=="yes") {
            thisnode.style.display = "none";
         } else {   
            slideup(thisnode);         
         }   
         
         changestate = "closed"
         
         if (clean != "no") {
            // if clean is not given, the values of the first subsequent text inputfield is set to ""
            var inputfields = thisnode.getElementsByTagName('INPUT');
            
            for (var i=0; i<inputfields.length; i++) {
               if (inputfields[i].type=='text') {
                  inputfields[i].value="";
                  break;
               }   
            }
            
            // we also will clean any file input fields if they are contained within a IFRAME which
            // is part of the current node (if there is one)
            var iframes = thisnode.getElementsByTagName('IFRAME');
            for (var j=0; j<iframes.length; j++) {
               var iframebody = iframes[j].contentWindow.document.body;
               
               var inputfields = iframebody.getElementsByTagName('INPUT');
               for (var i=0; i<inputfields.length; i++) {
                  if (inputfields[i].type=='file') {
                     inputfields[i].value="";
                     break;
                  }   
               }               
            }
         }   
      }
   }
   return changestate;
}
   
function changeColor(color,e) {
   var element = document.getElementById(e);

   if (element) {
      ( (element["value"]!="nothing") && (element["value"]!="") && (element["value"]!="%")) ?
      element.style.color = color :
      element.style.color = "#565656";
   }
}


function changeInputLength(thisnode, focus) {
   // Function to change the horizontal length of the first following INPUT field. It is resized so that it fits in the parent
   // TD element. This function will crawl up the DOM tree until a TD element is found or stop if the BODY element
   // is encountered. After the input field is opened, it gets the focus.
   
   // We remove a buffer of a few pixels from the real maximal size to avoid that the page has to be reloaded
   // two pixels is not enough.
   var buffer = 3;
      
   var parentnode = thisnode.parentNode;
   if (thisnode != null) {
      // at least one input fueld has been found
      
      // get the node of the next parent td cell (break if it is the body of the document)
      while (parentnode.nodeName != 'TD') {
         if (parentnode.nodeName == 'BODY') {
            // can not set any lengths, then.
            return;
         }
         parentnode = parentnode.parentNode;
      }
      // once the correct td is identified, set the width of the input element to the width of the td
      thisnode.style.width = (parentnode.offsetWidth-buffer)+"px";
      if ((typeof(focus)=='undefined') || (focus=="yes")) {
         thisnode.focus();
      }
   }
}

function toggleDisplayAndFlipArrow(thisnode, openimage, closeimage, immediate, clean, direction) {
   var changestate = toggleDisplay(thisnode, immediate, clean, direction);
   if (changestate != false) {
      flipImage(thisnode, changestate, openimage, closeimage);
   }
   return changestate;
}

function toggleDisplayAndChangeInputLength(thisnode, openimage, closeimage, immediate, clean, direction) {
   // Combination of toggling the display and changing the length of the input text field.
   var changestate = toggleDisplayAndFlipArrow(thisnode, openimage, closeimage, immediate, clean, direction);
   if (changestate == "open") {
      changeInputLength(thisnode);
   }   
}

function flipImage(thisnode, changestate, openimage, closeimage) {
   // This function flips the source of the first IMG element in thisnode. 

   // find the image fields (take the first one) within this element and 
   var imagefields = thisnode.getElementsByTagName("IMG");

   if (changestate == 'closed') {
      imagefields[0].src = closeimage;
   } else {
      imagefields[0].src = openimage;
   }
}

function encodeParamString(params) {
   // This function encodes the parameter string.
   var newparameters = new Array();
   var parameters    = params.split("&");
   
   for (var i=0; i<parameters.length; i++) {
      newparameters.push(encodeURI(parameters[i]).replace(/#/g,'%23').replace(/\+/,'%2B').replace(/\;/g,'%3B'));
   }
   
   return newparameters.join("&");

}

function updateProgrammaticAccessInfo(programmaticid, url, params) {
   // This id must be in an A element i.e. the href can be updated
   
   var programmaticdiv = document.getElementById(programmaticid);
   clearNode(programmaticdiv);

   programmaticdiv.appendChild(document.createTextNode("The present query result can be "));
   
   var aelement      = document.createElement('a');

   var encodedparams = encodeParamString(params);

   aelement.href = url + "?" + encodedparams;
   aelement.appendChild(document.createTextNode("obtained from this link"));
   programmaticdiv.appendChild(aelement);
   programmaticdiv.appendChild(document.createTextNode(". The following parameters have been specified:"));
   programmaticdiv.appendChild(document.createElement('br'));

   var parameterlist = params.split("&");
   var thislist = document.createElement('ul');
   for (var i=0; i<parameterlist.length; i++) {
       var li = document.createElement('li')
       li.appendChild(document.createTextNode(parameterlist[i]));
       thislist.appendChild(li);
   }
   programmaticdiv.appendChild(thislist);
}

function simplifyParameterString(params) {
   // this function removes "empty" parameters from a encoded string
   
   var newparameters = new Array();
   var parameters    = params.split("&");
   
   for (var i=0; i<parameters.length; i++) {
      // only if the first occurence of the = character is the last character we skipt the entry.
      // This safeguards against the (improbably case) that a search string ends with a =.
      if (parameters[i].indexOf("=") != parameters[i].length-1) {
         if (parameters[i].indexOf("oneline_input")!=0) {
            // we also want to remove the original entry of the form from the output.
            // however, it should not be deleted. We just discard it here.
            
            // This is the first step of harmonizing the operators of the two interfaces. 
            // We do offer the ? operator and translate it to the _ operator here.
            // The downside is that the input and the actual fields (programmatic access) are not identical
            // any more.
            
            // A better solution would be to upgrade WDB to have all that functionality            
            
            // Secondly the + sings are escaped. They are not escaped later as we do use the 
            // encodeURI instead of the encodeURIComponent. There was a good reason for that:
            // encodeURIComponent does not 
            newparameters.push(parameters[i].replace("?","_"));
         }
      }
   }   
   return newparameters.join("&");

}


// We are going to reference this widget from a form, so we
// need to have a variable we can reference it through.
// We could have multiple widgets.
var   rd;

// Here's where we instatiate the widget.
function validate(f, url, programmaticid) {

    // We first close (= hide) all autocompletion boxes
    $(".ui-autocomplete").hide();
    // and remove all tips and timers
    UnTip();
    if (idleFormTimer) clearTimeout(idleFormTimer);

    if (!rd) {
        // We need to tell the widget how we are going to refer to it
	// externally because it's going to create the forms that
	// do this referring.

        rd = new votviewer("rd");

	// Let the user select rows. Without this the user can display
	// and filter but not select.

	rd.setCanSelectRows(true);

	// When selecting rows collect the values associated
	// with this UCD.

	rd.setSelectRowUCD("meta.id;meta.main;meta.select");
    }

    // we override the loadCallBack function here
    rd.loadCallBack = function(prop, error) {
       if (prop=="xml") {
          // this is the table output!
          
          // remove the search image                   
          searchImage(document.getElementById("output"), "remove");
          
          if (!error) {              
             // if there is no error, show the download buttons
             var urldiv = document.getElementById("urldiv");
             urldiv.style.display="";
             
          } else {
             // an error occurred: show the form again
             toggleInput(document.getElementById("queryformid"),oimg,cimg,'no','no','DIV','open');
          }
       }
    }
    
    // we override the Error message function here.
    rd.printErrorDoc = function(node, xmlDoc) {
        // Here we check what type of error we have encountered. 
        // 
        // WARNING: this is hardcoded to go along with the WDB votable. 
        //          Either the VOTable becomes generic in the error message sense, or
        //          we should try to overload the function in our own code.

        var messagetext = "<a class='warningmessage'>No records were returned.</a><br><br>You could try to<br><ul><li>increase the value in the Search box field<li>unselect the Type checkbox if the target is a calibration target<li>uncheck the Availability checkbox if the observation is still in its proprietary period</ul>";
        var info = xmlDoc.getElementsByTagName('INFO');

        for (var i=0; i<info.length; i++) {
           if (info[i].hasChildNodes()) {
              var thismessagetext = info[i].firstChild.data;

              if ((thismessagetext.search(/not\ found/)>-1) || (thismessagetext.search(/SIMBAD/)>-1)) {
                 // We know that WDB forms the message as HTML message in h2 and there is nothing we can
                 // do about it.
                 messagetext = thismessagetext.replace(/\<h2\>/g, "");
                 messagetext =     messagetext.replace(/\<\/h2\>/g, "");
                 messagetext = "<a class='warningmessage'>" + messagetext + "</a>";
                 // This means, we KNOW that the first INFO element contains the message. 
                 // This should be changed as soon as wdb has a standard implemented.
                 break;
              }
           }
        }
        
        node.innerHTML = messagetext;
        // If there is a parsing error, then the xmlDoc will contain some error message in the first child
        if (xmlDoc.hasChildren) {
           node.appendChild(xmlDoc.firstChild);
        }   
    }
     
    // we override the xsltProcessCallBack here
    rd.xsltProcessCallBack = function() {
       // clear the div that holds the thumbnails
       clearNode(document.getElementById("preloadthumbnails"));
       
       // change the preview URL into a link and a tooltip, column=0 is the checkbox, the preview is column 1
       
       // This can not be done with firstChild etc. because different browsers interpret that
       // differently. Should be done with jQuery.
       var thisdatatable = document.getElementById("datatable");
   
       rewriteOutputTable(thisdatatable);
       
       $("#datatable .selectedimage :input:checkbox").attr("checked","checked").val("1");

    }
    
    // check if there was a file uploaded
    var dofileupload = false;

    // get the iframe id
    var fuf = document.getElementById("fileuploadframe");    
    // this is the trick of how to get into the frame    
    var iframecontent = fuf.contentWindow.document;
    // and this is the form
    var iframeform = iframecontent.forms[0];
        
    var filename = iframecontent.getElementsByName("filename");

    if (filename.length ==0) {
       alert("ERROR: the file upload text input field is not present. Must stop here!");
    }

    if (filename[0].value !="") dofileupload = true;
  
    rd.input_f              = f;
    rd.input_url            = url;   
    rd.input_programmaticid = programmaticid;
    
    // when the user submits a file for upload, we do want to show that column in the output.
    // This is done by setting a (hidden) input field of the name tab_inline_file to on
    rd.dofileupload = dofileupload;
    rd.iframeform   = iframeform;        
    
    var dooneline = false;
    if ($("#oneline_input").val()!="") {
       dooneline = true;
    }
        
    // we have the cases: yes/no fileupload, yes/no oneline interface entry. Both are asynchonous. In the case where both
    // are needed we chain: the oneline is done first, then the fileupload is executed and finally the sumbission takes place
    // (started from within fileupload)
          
        
    // check if the onelineinterface was filled
    if (dooneline) {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = null;
        // this is the callback function of the one-line interface. We chain the next function at the end
        Texpr.submit = function (sqlstring) {
           $('input[name="oneline_string"]').val(sqlstring);
           
           if (dofileupload) {
              fileupload_validate_submit();
           } else {
              validate_submit();
           }   
        };
        // this function updates the sqlstring and knows that sumbit was executed. If this is successfull, the Texpr.submit function
        // is called and the chain is continued. If there is an error, no submission is done.
        idleUpdater();
        return false;    
    } else {
      $('input[name="oneline_string"]').val("");
    }   

    if (dofileupload) {
       fileupload_validate_submit();
    } else {
       validate_submit();
    }   
    
    return false;
}
            
function fileupload_validate_submit() {
   // this function executes the file-upload process and afterwards the validate_submit function.
   // The input form for the fileupload is not empty. We have to submit the form first. As for the validate_submit
   // we add the necessary information to the rd object.
      
   if (rd.iframeform.onsubmit) {
      var result = rd.iframeform.onsubmit();
   }   

   rd.iframeform.submit();

   //We need a call back for the upload and only should continue when that has happened.
   //http://www.openjs.com/articles/ajax/ajax_file_upload/response_data.php
   // I think we need to put what's below in a new function, if not dofileupload, just exectue the 
   // function. If do fileupload, add the function to the stuff that is done at the very last after the submit (e.g.
   // onload) by making sure that it is removed afterwards/or not executed when the second query is run etc.
   // and pass that on to the execution.
   // somehow this function must be put at the end of the the onload

   //this is done now
}      
      
            
function validate_submit() {
    // this function does NOT have parameters so that it can be launched also from within the submit
    // function of the file_upload. The variables are put into the rd element which is unfortunately
    // global, but there does not seem to be a way around this. 
        
    // Hide the download buttons
    var urldiv = document.getElementById("urldiv");
    urldiv.style.display="none";
    
    searchImage(document.getElementById("output"), "insert");
    
    // here call setView where the form is standard, the resulttable is selected and the download is hidden
    var statearray = new Array("tabcontent_query-","tabcontent_result-selectedtab", "tabcontent_data-disabledtab");
    
    // instead of setting the view here ourselfs, we have the state manager do it
    $.historyLoad(statezipper(statearray.join('+'),'zip'));
    
    // clear the download page, the output page is cleared but the votviewer itself. As the tab is hidden anyway, this
    // is not really necessary but seems to be good practice
    clearNode(document.getElementById("downloadframe"));

    // Now get the URL and load it.
    var params   = getFormPars(rd.input_f.name,'no');

    // we do a post message. Therefore we can remove all the "empty" fields as in POST they can not
    // be distinguished from 'unset' fields, anyway.
    params   = simplifyParameterString(params);

    // Now update the link for the VOTable output
    updateProgrammaticAccessInfo(rd.input_programmaticid, rd.input_url, params);

    // Now set the tab_wdb_inline_file to "on" if this was a file_upload
    params = setwdbinlinefile(rd.dofileupload, params)

    // Now start the output table generation        
    rd.init(rd.input_url, "output", encodeParamString(params));
}      

function setwdbinlinefile(dofileupload, params) {
   // in the WDB fdf all output fields are forced to be open using forcetab. We do assure that we always get the full
   // table back. However, for the file upload we want to show or hide the first column in case a file was (or not) uploaded.
   // This is done here.   
   
   if (dofileupload) {
      params += "&tab_wdb_inline_file=on";
   }
   return params;
}
      
function submitSelection(action, resultlocation) {
   // This function creates a new form an submits it with the action specified.
   // The form inputs are those from the selected fields
   //
   // - action can contain an additional specifyer that allows jQuery.load to sub-select an element
   // - resultlocation is either "local" or "external" (the same frame or a new frame)

   var selections = rd.getSelections();   
   
   if (selections.length >0 ) {
      // check if there is already a download form in the page (from an earlier search). If so, remove it.
      var downloadformdocument = document.getElementById("downloadform");
      if (downloadformdocument) {
         downloadformdocument.parentNode.removeChild(downloadformdocument);
      }

      var downloadform = document.createElement('form');
      downloadform.setAttribute('action', action);
      downloadform.setAttribute('name', 'downloadform');
      downloadform.setAttribute('id', 'downloadform');
      downloadform.setAttribute('method','post');
      
      if (resultlocation=="local") {
         downloadform.setAttribute('target','downloadframe');
      } else {
         downloadform.setAttribute('target','new');
      }   
      
      for (var i=0; i<selections.length; i++) {
         var hiddeninput = document.createElement("input");
         hiddeninput.setAttribute("type","hidden");
         hiddeninput.setAttribute("name","dataset");
         hiddeninput.setAttribute("checked","checked");
         hiddeninput.setAttribute("value",selections[i]);
         downloadform.appendChild(hiddeninput);
      }
      
      // It is not enough to create the form in order to submit it. It must necessarily be part of the 
      // document.
      var submitform = document.getElementById("submitform"); 
      submitform.appendChild(downloadform);
      var statearray = new Array("tabcontent_query-","tabcontent_result-", "tabcontent_data-selectedtab");

      $.historyLoad(statezipper(statearray.join('+'),'zip'));
      // clear the download frame       
      var downloadframeid = document.getElementById("downloadframe");

      if (downloadframeid) {
         if (resultlocation=="local") {
            downloadframeid.innerHTML="Preparing files ..."; 
         } else {
            downloadframeid.innerHTML="See new window ..."; 
         }            
      }

      // downloadform.submit() is not used as in some browsers after the appending, the object can not be modified 
      // any more without getting a new pointer.
      var downloadformdocument = document.getElementById("downloadform");           

      if (resultlocation=="local") {
         params     = $("#downloadform").serializeArray();
         $("#downloadframe").load(action, params);
      } else {
         downloadformdocument.submit();
      }   
      
   } else {
      alert("Please select one or more datasets first. \nThis can be done by clicking on a row or the corresponding checkbox.");
   }  
}

function statezipper(statestring, zipaction) {
   // This function just reformats the string so that it looks nice in the URL. It is a purely aesthetical thing.
   var tabarray = statestring.split('+');
       
   if (zipaction=="zip") {
      for (var i=0; i<tabarray.length; i++) {
         tabarray[i] = tabarray[i].replace("tabcontent_query",  "Q");
         tabarray[i] = tabarray[i].replace("tabcontent_data",  "D");
         tabarray[i] = tabarray[i].replace("tabcontent_result",  "R");

         tabarray[i] = tabarray[i].replace("-selectedtab", "-S");
         tabarray[i] = tabarray[i].replace("-disabledtab2","-2");
         tabarray[i] = tabarray[i].replace("-disabledtab", "-1");
      }            
   } else {
      for (var i=0; i<tabarray.length; i++) {
         tabarray[i] = tabarray[i].replace("Q","tabcontent_query");
         tabarray[i] = tabarray[i].replace("D","tabcontent_data");
         tabarray[i] = tabarray[i].replace("R","tabcontent_result");
         
         tabarray[i] = tabarray[i].replace("-S", "-selectedtab");
         tabarray[i] = tabarray[i].replace("-2", "-disabledtab2");
         tabarray[i] = tabarray[i].replace("-1", "-disabledtab");
      }    
   }
   return tabarray.join('+');
}      
      
function getCurrentViewState() {

   var tabcontentarray = getElementArrayFromIdParts("div","tabcontent");
   var tabarray = new Array();
   for (var i=0; i<tabcontentarray.length; i++) {
      var contentname = tabcontentarray[i].id;
      var tabnames = getElementsByNameIESafe(contentname);
      element= tabnames[0];
      while (element && element.tagName != "LI") {
         element = element.parentNode;
      }   
      var thistabid = element.id;
      tabarray.push(tabcontentarray[i].id+"-"+thistabid);
   }
   return tabarray.join('+');   
}   


function setNewTabState(thisnode) {
   // The user has submitted a query or a data request: The tab state changes. 
   /* If the clicked tab is "disabled" or is the current tab anyway, nothing happens. If the clicked tab is not the current
      and not selected, then the current becomes standard and the new one becomes selected. */
      
   // walk up the tree to find the parent LI element.
   var element = thisnode;
   while (element && element.tagName != "LI") {
      element = element.parentNode;
   }    

   if (element && (element.id == "")) {
      // only if the tab selectable (i.e. not the current one nor a disabled one) continue 

      // remove the current selected status
      var current = document.getElementById("selectedtab");
      if (current) {
         current.removeAttribute("id");
      }

      // set the parent LI element to "selected"
      if (element) {
         element.id = "selectedtab";
      }         

      // set the view to the tab of the element of thisnode and disable all the others.
      // The logic is as follows: each tab has as name attribute the id of the content div that it corresponds to.
      // The divs that correspond to tabs have not tabcontent in their name because the name tag has to be unique in strict
      // standard. We have to encode it therefore in the id_field.  tabs that correspond to the entries
      // do start with tabcontent_ in their id field.

      // If the state has to change, then we let use the history plugin to call the setView function so that
      // the change is recorded in the browser history.      
      $.historyLoad(statezipper(getCurrentViewState(),'zip'));      
   }
}    
      
function setView(hashvalue) {
   /* This function switches between the different tab views. 
      It takes the zipped hash value as input (if this is empty or undefined, the value previously stored in .historyDefaultValue is used)
      decodes it and sets the new state if this has to be done.
   */
   
   
   // if the hash is empty we use the default state that has been stored in config.js
   if ((typeof(hashvalue)=="undefined") || (hashvalue=="")) {
      hashvalue = $.historyDefaultValue;
   }
   var tabarray = statezipper(hashvalue,'unzip').split('+');
   
   var selectedidarray = new Array();

   for (var i=0; i<tabarray.length; i++) {         
      // for each entry in the array, set the corresponding tab to the required state
      var tabinfo = tabarray[i].split("-");
      var tabnames = getElementsByNameIESafe(tabinfo[0]);

      if (tabnames.length!=1) {
         alert("ERROR: there is not exactly one element with " + tabinfo[0] + "-" + tabinfo[1] + " present! " + tabnames + "-" + tabnames.length + "_" + tabarray.length);
      }
      // get the parent LI
      var element = tabnames[0];

      while (element && element.tagName != "LI") {
         element = element.parentNode;
      }

      if (element) {
         element.id = tabinfo[1];

         if (tabinfo[1]=="selectedtab") {
            selectedidarray.push(tabinfo[0]);
         }
      }
   }

   if (selectedidarray.length!=1) {
      alert("ERROR: there is not exactly one id that is selected! " + selectedidarray);
   }
   selectedid = selectedidarray[0];

   // the name attribute must be unique, just as the id attribute. We therefore have to use 
   // a loop over the id where the values are encoded 

   var tabcontentarray = getElementArrayFromIdParts("div","tabcontent");

   // disable the display of all tablecontentarray divs and enable the display of the selected one

   for (var i=0; i<tabcontentarray.length; i++) {
      toggleDisplay(tabcontentarray[i], "yes","no", "closed");
   }

   // enable the display of the selected one
   var selectednode = document.getElementById(selectedid);
   var fch = selectednode.firstChild;
   toggleDisplay(selectednode, "yes", "no", "open");
}   

function getElementsByNameIESafe(namestring) {
   // This function is necessary because IE does not adhere to standards. It returns
   // elements where names OR ids are equal to "name". We ONLY want the names one, though
   // just as the function is expected to work.
   var resultarray = new Array();
   var elementarray = document.getElementsByName(namestring);

   for (var i=0; i<elementarray.length; i++) {
      // only if the element really has a name attribute with content of the name string, we keep it
      if (elementarray[i].name==namestring) {
         resultarray.push(elementarray[i]);
      }
   }
   return resultarray;
}

function getElementArrayFromIdParts(tagname, idstart) {
   // This function returns an array of elements that are  tags of type tagname and have their id fields starting
   // with idstart

   var tagarray = document.getElementsByTagName(tagname);

   var elementarray = new Array();
   var tagid = "";
   for (var i=0; i<tagarray.length; i++) {
      tagid = tagarray[i].id;
      if ((tagid) && tagid.indexOf(idstart)>-1) {
         elementarray.push(tagarray[i]);
      }
   }

   return elementarray;

}

function clearNode(thisnode, node) {
   /* This function removes any children from the specified node and adds (if specified) the given node instead.*/
   
   if (thisnode) {
   
      while (thisnode.hasChildNodes()) {
         thisnode.removeChild(thisnode.firstChild);   
      }
	
      if (typeof(node) != "undefined") {
         thisnode.appendChild(node);
      }   
   }   
}

function resizeIframe(thisnode) {
   var addmargin    = 50;
   var frameheight  = 2000;
   
   /* this function resizes an iframe after the content has been loaded */
   try {
      var frameheight = thisnode.contentWindow.document.body.offsetHeight;
   } catch(e) {
      // If we can not get the height (due to cross-site-scripting prevention), we
      // set it to a large value.
   }   

   //IE syntax??? var height2 = thisnode.contentDocument.body.offsetHeight;

   thisnode.height = (frameheight+addmargin)+"px";
}

function searchImage(thisnode, operation) {
   /* This function inserts or removes the search image into thisnode*/
   var searchimage = "images/out.gif";    /* no ../ . This seems to be antisymmetric to the css behaviour. */
   
   if (operation=="insert") {
       // Create an image node with the image
       var imgnode   = document.createElement('img');
       imgnode.src = searchimage;
       imgnode.id  = "searchimage";

       thisnode.appendChild(imgnode);
    
   } else {
      // removes the image
      var imgnode   = document.getElementById("searchimage");
      if (imgnode) {
         imgnode.parentNode.removeChild(imgnode);
      }
   }
}

function addPreloadImage(imagename, element) {
   /* this function adds a hidden image to the body (or a given element) of the document so that it is present in the browser cache */
   /* Images that are needed anyway can be added to the body of the document. Images that might be necessary only for a shorter
      time can be added to a special div element that can then be emptied when the images are not necessary any more */
   
   if (typeof(element)=="undefined") {
      element = document.body;
   }
   
   var preloadimage       = document.createElement('img');
   preloadimage.src       = imagename;
   preloadimage.className = "preloadimage";
   preloadimage.alt       = "preloading...";
   element.appendChild(preloadimage);
}


function hasLookAtTip(thisnode) {
   var lookattip = document.getElementById("lookattip");
   if (lookattip) {
      return true;
   } else {
      return false;
   }
}

function stickyToolTip(thisnode, action) {
   // This function does not work because the mouseout event of a is fired before the mouseover event of div can be used.
   
   var activetooltip  = document.getElementById("activetooltip");
   var mouseontooltip = document.getElementById("mouseontooltip");
   
   if (action=="linkover") {
      if ((!activetooltip) && (!mouseontooltip)) {
         thisnode.id = "activetooltip";
         return true;
      }
   }
   
   if (action=="linkout") {
      if (!mouseontooltip) {
         thisnode.id = "";
         return true;
      }
   }
   
   if (action=="tipover") {          
         alert("tipover" + " " + document.getElementById("activetooltip")+ " " + document.getElementById("mouseontooltip"));        
         activetooltip.id = "mouseontooltip";
         alert("tipover" + " " + document.getElementById("activetooltip")+ " " + document.getElementById("mouseontooltip"));
   }

   if (action=="tipout") {
      mouseontooltip.id = "activetooltip";
      activetooltip     = document.getElementById("activetooltip");
      activetooltip.onMouseOut();
   }
   
   return false;

}

function arrayIndexOf(arrayname, value) {

   for (var i=0; i<arrayname.length; i++) {
      if (arrayname[i]==value) {
         return i;
      }
   } 
   return -1;
}

function returnPedigreeSelected(name, dataset_name) {
  var newname = trim(name);
  if (newname==trim(dataset_name)) {
     newname = '<span class="pedigreeselected">' + newname  + '</span>';     
  }  
  return newname;
}

function waitAndLaunchPedigreeRetrieval(dataset_name, div_dataset_name) {
   // There might be too many requests submitted if the user goes with the mouse over the full list of dataset
   // names. We therefore only want to launch an actual XHR when the user has paused a bit on that particular 
   // dataset name. This can be checked easily by verifying if after a given short timespan, the div in which
   // the result has to be written still exists or not.
   
   // This function is called a certain time after the tooltip has opened. We now check if the target div is still there (i.e. if the
   // tooltip is still open. If so, we launch the XHR.
   
   if ($("#"+div_dataset_name).length) {
   
      $.get(pedigreecgiurl+encodeURIComponent(dataset_name), function(data){
         var resultstring = "";
         resultstring+='<table class="pedigreetable"><tr><td colspan="4">This table shows in which other products (if any) the photons of the dataset '+returnPedigreeSelected(dataset_name, dataset_name)+' are used and out of which datasets (if any) it was constructed.<hr></td><tr><tr><td colspan="4">Archive</td><tr><td></td><td colspan="3">Association</td><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>Member</td><td>(original HST name)</td></tr>'

         $($(data).find('archive')).each(function () {
            var archivename = trim($(this).attr("name"));
            resultstring += '<tr><td colspan="4"><b>'+ returnPedigreeSelected($(this).attr("name"),dataset_name) + '</b></td></tr>';
            $($(this).find('association')).each(function () {
               resultstring += '<tr><td></td><td colspan="3">' + returnPedigreeSelected($(this).attr("name"), dataset_name) + '</td></tr>';
               $($(this).find('member')).each(function () {
                  var thisdatasetname  = returnPedigreeSelected(trim($(this).find('dataset_name').text()), dataset_name);
                  var thisoriginalname = returnPedigreeSelected(trim($(this).find('original_name').text()), dataset_name);
                  if (thisdatasetname!="") {
                     if (thisoriginalname!="") {
                        thisoriginalname="("+thisoriginalname+")";
                     }
                     resultstring += '<tr><td></td><td></td><td>'+ thisdatasetname+ ' </td><td>'+ thisoriginalname+'</td></tr>';
                  }
               });
            });
            resultstring +='<tr><td colspan="4"></td></tr>';
         });
         resultstring += "</table>";
         $("#"+div_dataset_name).html(resultstring);
       });
   }
}


function getPedigree(dataset_name) {
   // This function returns a string containing the DIV with id pedigreediv_[dataset_name] and starts
   // an async call to the pedigree cgi which will after success fill this div. By adding the dataset
   // name to the div, conflicts between several running pedigrees are removed.
   // 
   // The function uses the global variable pedigreecgiurl defined in config.js that must point to the cgi script
   
   var waiting = 250; // milliseconds
   
   // the dataset_name is used as div name but can not contain + or .
   var div_dataset_name = "pedigreediv_"+dataset_name.replace(/\./g,'').replace(/\+/g,"");
   
   // we wait a bit and then launch the actual retrieval if the tooltip is still there
   window.setTimeout(function(){waitAndLaunchPedigreeRetrieval(dataset_name, div_dataset_name);}, waiting);
        
   return '<DIV id="'+div_dataset_name+'">Retrieving pedigree ... &nbsp;&nbsp;&nbsp;&nbsp;<img src="images/ajax-loader.gif"></DIV>';
}


function getValueFromGet(contentarray, key) {
   // This function returns the value (if there is one) from the contentarray that starts with the key.
   // e.g. (["science_extension=DRZ"],'science_extension') will return DRZ
   var result = null;
   for (var i=0; i < contentarray.length; i++) {
      if (contentarray[i].indexOf(key)==0) {
            result = contentarray[i].split("=")[1];
         break;
      }
   }
   return result;
}

function rewriteOutputTable(thisnode) {
   // This function expects the node of a table to be passed on. Then the actions specified in the function will be carried out
   // on the column given (default = 1) for each table row of the table body.   
   // This function uses global variables from config.js (pedigreecgiurl, aladinurl)
   // 
   
   var tipspecification = {offset: [0,10],
               position: 'center right',
               relative: true,
               delay: 300,
               lazy: true
               };
   
   if (!thisnode) {
      alert("ERROR: there is NO datatable present");
   }
   
   // we look for the table head and extract the array of the headlines so that we
   // lan later on use that as index
   var tablehead = thisnode.getElementsByTagName('THEAD');   
   if (!tablehead.length) {
      alert("ERROR: there is NO table head present");
   }
   tablehead         = tablehead[0];
   var headrows      = tablehead.getElementsByTagName('TR');
   var headercolumns = headrows[0].getElementsByTagName('TH');
   var headers       = new Array();
   // we need to put 1 here because the first element is the checkbox
   
   for (var i=0; i<headercolumns.length; i++) {
      if (headercolumns[i].hasChildNodes()) {
         headers.push(headercolumns[i].firstChild.nodeValue);
      } else {
        headers.push('null');
      }   
   }
   // headers contains now the array of the headlines. 
      
   // look for the first table body within the given node   
   var tablebody = thisnode.getElementsByTagName('TBODY');   
   if (!tablebody) {
      alert("ERROR: there is NO table body present");
   }   
   tablebody = tablebody[0];
   
   var rows = $(tablebody).children('tr');

   // --- PREVIEW ---
   // The link coming from the VOTable is converted into a link of the preview.
   var column = arrayIndexOf(headers, 'Preview');   
   
   if (column>-1) {
      for (var i=0; i<rows.length; i++) {
         // For each row select the column number column
         var columns = $(rows[i]).children('td');
         
         //Note, however, that the column has to be increased by 1 because the xslt adds the checkbox in front of the table
         var field   = columns[column];

         // We expect that the content of that TD is a TextNode! if not, then we leave the function
         // If the field is empty (wdb), then indeed, there are no childNodes
         if (field!=null && field.hasChildNodes()) {

            var content = field.firstChild.nodeValue;
            // The content now holds the link with the preview. We KNOW that there are other previews available
            // FITS, 256, 512. This is hardcoded here as I can see no way to put that outside in a generic way
            // that really helps the cause.

            // We could also have WDB feed some "trunk" without the extension or a list of extensions or whatever. 
            // However, in that case the VOTABLE would not contain very usefull information for others where in this
            // case, it does. As we however still want to carry over more information and can not in a different field
            // with the current svwiew code, we add the additional values as parameters to the GET. This does not hurt
            // the VO table is still valid, but we can use them.
            if ((content != "") && (content!=null)) {
            
               var contentarray = content.replace("&amp;","&").replace("%26;","&").split("&");
               
               // there need to be some assumptions made about the structure of the link. We try to be as general as possible
               // as CADC has a different structure than we have. We assume here that everything that is before the file_id field belongs
               // to the "general" link
               
               for (var ii=0; ii < contentarray.length; ii++) {
                  if (contentarray[ii].indexOf("file_id")>=0) {
                     break;
                  }
               }

               content          = contentarray.slice(0,ii+1).join("&");
               
               var content_256  = content.replace("_PREV.JPG","_PREV_256.JPG");
               var content_FITS = content.replace("_PREV.JPG","_PREV");
               var content_name = content.replace("_PREV.JPG","")

               var sciencelink = getValueFromGet(contentarray, 'science_extension');
               if (sciencelink) {
                  sciencelink = content.replace("_PREV.JPG",sciencelink)
               } else {
                  sciencelink = "";
               }
               
               var externallink = ""
               var spectrumorimage = getValueFromGet(contentarray, 'data_type');
               if (spectrumorimage=="I") {
                   externallink = '<a href="'+aladinurl+content_FITS+')%3Bsync%3Bget%20VizieR%28USNO-B1%29%3Bsync%3Bget%20VizieR%282MASS%29%3Bsync%3B" target="_blank">Send preview image to Aladin ...</a>'
                   //externallink = '<a href="'+aladinurl+getValueFromGet(content_name.replace("?","&").split("&"),"file_id")+'" target="_blank">Send preview image to Aladin ...</a>'
               } else if (spectrumorimage=="S"){
                   if (getValueFromGet(contentarray, 'cache_archive')=="HLA") {
                      // we know that the HLA archive has spectral containers and thus can(must) send that to VOSpec
                      externallink = '<a href="'+(vospecurl+content_FITS).replace("&","%26")+'" target="_blank">Send spectrum to VOSpec ...</a>'
                   } else {
                      // the classical spectra can be served through specview
                      externallink = '<a href="'+(vospecurl+content_FITS).replace("&","%26")+'" target="_blank">Send spectrum to VOSpec ...</a>'
//externallink = '<a href="'+specviewurl+getValueFromGet(content_name.replace("?","&").split("&"),"file_id")+'" target="_blank">Send spectrum to Specview ...</a>'
                   }
               }
               
               $(field).html('<a href="'+content+'" target="_blank">Preview</a><div class="previewtooltip"><table><tr><td><img src="'+content_256+'" alt="Loading ..."></td></tr><tr><td align="left">Download large preview as <a href="'+content+'" target="_blank">JPG</a> or <a href="'+content.replace(".JPG","")+'" target="_blank">FITS</a></td></tr><tr><td>'+externallink+'</td></tr></table></div>');
               $(field).children('a:first').tooltip(tipspecification);

               // In order to speed up the tooltip presentation, we do want to preload the images into the cache
               // of the browser of the user. This had to be done before by hand, but is now automatic, as the tip is 
               // now included in the HTML directly.
               // addPreloadImage(content_256, document.getElementById("preloadthumbnails"));
            }
         }   
      }
   }
   // Making the proposal id a link to the proposal webform
   var column = arrayIndexOf(headers, 'Proposal ID');   
   
   if (column>-1) {
     for (var i=0; i<rows.length; i++) {
         var columns = $(rows[i]).children('td');
         var field   = columns[column];
         if (field!=null && field.hasChildNodes()) {
            var content = field.firstChild.nodeValue;
            if ((content != "") && (content!=null)) {
               $(field).html('<a href="' + propabswdburl + encodeURIComponent(content) + '" target="_blank">'+content+'</a>');
            }
         }
      }      
   }
 
   // Adding the pedigree information to the Dataset Name column
   var column = arrayIndexOf(headers, 'Dataset Name');   
   
   if (column>-1) {
     for (var i=0; i<rows.length; i++) {
         var columns = $(rows[i]).children('td');
         var field   = columns[column];
         if (field!=null && field.hasChildNodes()) {
            var content = field.firstChild.nodeValue;
            if ((content != "") && (content!=null)) {
               $(field).html('<a href="' + pedigreecgiurl + encodeURIComponent(content) + '" onmouseover="Tip(getPedigree(\''+content+'\'), WIDTH,400);" onmouseout="UnTip()" target="_blank">'+content+'</a>');
            }
         }
      }      
   }
   
   /*
   The problem is, that the table ONLY contains the columns the user has chosen
   We can therefore NOT enforce a column here. This wouls have to be done in xslt but then,
   that means that the variable names have to be encoded there statically? Grrr.
   Or to be configured over the UCDs like the other ones?
   
   
   // -- CHECKBOX --
   var cal_flag = arrayIndexOf(headers, 'Cal flag');
   var raw_flag = arrayIndexOf(headers, 'Raw flag');
   
   for (var i=0; i<rows.length; i++) {
      // The column with the checkbox is added by voview.xsl in any case. Selection function, however, only allows
      // selections of the lines that do have checkboxes! That's good, so we can remove the checkboxes on all rows
      // that should not be selectable. We can also set the class of that row to something else, if we want.   

      //the column of the checkbox is ALWAYS 0
      
      // geth the values of the flags inside those columns
      // decide upon the values firstChild (Y or N)
      
      if ((cal_flag<0) && (raw_flag<0)){
         // we have nothing in the archive for whatever reason
         var columns = rows[i].getElementsByTagName('TD');
         var field   = columns[0];
         field.removeChild(field.firstChild);

      }
   }
   */
   
   // The last action should be to resize the input fields for the filters
   var filterfields = tablehead.getElementsByTagName("INPUT");
   for (var i=0; i<filterfields.length; i++) {
      changeInputLength(filterfields[i], "no");
   }
}   

function resetfileupload(fileuploadiframeid) {
   // the changestate function also clears input fields if they are contained within an iframe.
   // This is really tied a lot to the way the tree of the input fields is done.
   
   // if the fileupload is open, then close it and open it again so that it gets cleared
   var fileuploadiframe = document.getElementById(fileuploadiframeid);

   if (fileuploadiframe!=null) {
      var parentnode = fileuploadiframe.parentNode;
      
      if (parentnode!=null) {
         // get the node of the next parent td cell (break if it is the body of the document)
         while (parentnode.nodeName != 'DIV') {
            if (parentnode.nodeName == 'BODY') {
               // can not toggle anything here
               return true;
            }
            parentnode = parentnode.parentNode;
         }
         
         if (parentnode.style.display!="none") {
            parentnode = parentnode.parentNode;
            var aelements =parentnode.getElementsByTagName("A");
            
            if (aelements.length>0) {
                       
               toggleInput(aelements[0], oimg, cimg);
               toggleInput(aelements[0], oimg, cimg);         
            }   
         }      
      }
   }
   
   // we have to return true so that the rest of the form is resetted, too.
   return true;
}

function resetreopensearchbox() {
   // Upon reset the fileupload and the searchbox field have to be treated differently
   // The search box should be opened as the default value is added in the reset
   toggleInput(document.getElementById("searchboxfield"), oimg, cimg, 'yes', 'no', 'DIV', 'open');
}


function addautocompletion(fieldname, resolveobject) {
   // The callback of the jquery autocomplete function does not contain a caller field. 
   // We therefore have to define new callback functions for each of the fields. This is the 
   // purpose of the present function
   
   // input: 
   //    fieldname:      the name tag of the (text)input field to attach the autocompletion to
   //    resolveobject:  object from parser.json that is used for the autocompletion
   //                    The objects provide completion of the form Tcamera.complete(['acs'])
   // example:
   //    addautocompletion("detector", Tcamera);
      
   $(":input[name="+fieldname+"]").autocomplete({source:function(field,func){
                                             var input  = field.term.toLowerCase();
                                             var result = resolveobject.complete([input]);
                                             return func(result);
                                           },
                                           focus: autofocus,
                                           scroll: true,
                                           scrollHeight: 120,
                                           minLength: 1});
}

function sesameFormResolver() {
  // Function that is called by sesameResolver upon resolution of the target name. This changes the highliting of the box
  // and adds a tooltip to the input field
   
  var position    = $(":input[name=target_name]").offset();
  var pos         = [position.left,position.top+$(":input[name=target_name]").height()+4];
  var tipstring   = "ERROR: could not resolve this target";

  // checkSesame is true if the target could be resolved
  if (! checkSesame()) {
     $(":input[name=target_name]").removeClass("resolved").addClass("unresolved");  
  } else {
     $(":input[name=target_name]").removeClass("unresolved").addClass("resolved");
     var result = sesameCache[$(":input[name=target_name]").val()];
 
     if (result[2]==1) {
        // here we use the Ttarget from the online interface for the formatting in order not to duplicate code
        var titleandlink = Ttarget.getTitleAndLink(result);
        tipstring = titleandlink[0]+"<b>Coordinates</b><br>RA:&nbsp;&nbsp;&nbsp;&nbsp;"+result[0]+"<br>DEC:&nbsp;&nbsp;&nbsp;"+result[1];
     } else {
        tipstring = "Resolved but the result is ambigous";
     }
  }    
  // creating a tooltip on the focus event and calling it
  $(":input[name=target_name]").attr("onfocus",Tip(tipstring,DURATION,4000,FADEOUT,500,FOLLOWMOUSE,false,FIX,pos,WIDTH,($(":input[name=target_name]").width()-4),TITLE,'Target name resolution'));
  $(":input[name=target_name]").focus();
  // attaching oncklick or hover event handlers to UnTip the tip does not seem to work
}

function idleFormUpdater() {
   // The timeout has passed without a key being pressed and the current content of the field has to be
   // resolved.

   idleFormTimer = null;
   // here, need to generalize sesameResolver, so that it can be used from
   // both. The cache works, the resolving not.
   // Then have to invent a way of telling the user that the name was resolved.
   // A quick tooltip? background color=green/red?
   sesameWarnings = {};
   sesameErrors   = {};
   
   var inputvalue = $(":input[name=target_name]").val();

   // if the field is empty remove the highliting   
   if (inputvalue != "") {
      var res  = sesameResolver($(":input[name=target_name]").val(),sesameFormResolver);
      // if the result is empty, then the sesameResolver will call the chained sesameFormResolver function
      // if not, the result had been cached and we must call the resolver ourselves here. We know that the value
      // is in the sesameCache and do not have to pass it.
      if (res[2]!=-1) {
         sesameFormResolver();
      }
   } else {
      $(":input[name=target_name]").removeClass("unresolved").removeClass("resolved");
   }   
}

function formTargetKeyPressed() {
   // This function is called everytime a key in the Target field of the form is pressed
   // It clears out the highlighing border, a possibly existing tooltip and (re)starts the timer.
   var resolvingdelay = 750;
   
   $(":input[name=target_name]").removeClass("unresolved").removeClass("resolved");
   UnTip();
   
   if (!idleFormTimer) {
      idleFormTimer = setTimeout("idleFormUpdater()", resolvingdelay);
   } else {
      clearTimeout(idleFormTimer);
      idleFormTimer = setTimeout("idleFormUpdater()", resolvingdelay);
   }   
}
