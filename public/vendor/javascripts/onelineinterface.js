idleTimer = null;		// Timer for idleUpdater
idleValue = "";			// Last input value, to avoid double updates
idleActive = true;		// if false, idleUpdater does nothing
Texpr.submit = false;		// if true, the input is being submitted
autocompletespecial = false;	// true if "more..." is selected in autocomplete
autocompletefield = false;	// ???
autocompletevalues = false;	// ???
autocompleteauto = true;	// autocompletion mode: automatic, or tab
autocompletefirst = (autocompleteauto) ? false : true;

mykeys = function(dict) {
  var k = [];
  for (i in dict) k.push(i);
  return k;
};

tabber = function (event, ui) {
  if (event && (event.keyCode || event.which) == 9) { 
    var field = $("#oneline_input")[0].value, autocomp = lexautocomp(field);
    autocompletefirst = false;
    event.preventDefault();
    if (autocomp.length > 1) {
      $("#oneline_input").autocomplete("option", "minLength", 0).autocomplete("search");
    } else if (autocomp.length == 1) {
      $("#oneline_input")[0].value = 
	lexautocompselect(field.slice(0, autocomp[0][0]) + autocomp[0][1]);
      if (!autocompleteauto) $("#oneline_input").autocomplete("close");
      else $("#oneline_input").autocomplete("search");
    }
  }
}

autoopen = function (event, ui) {
  if (idleTimer) clearTimeout(idleTimer);
  idleActive = false;
};

autoclose = function (event, ui) {
  if (autocompletespecial) {
    setTimeout('$("#oneline_input").autocomplete("search")', 10);
  } else {
    if (!autocompleteauto)
      $("#oneline_input").autocomplete("option", "minLength", 9999);
    idleActive = true;
    idleValue = $("#oneline_input")[0].value;
    idleUpdater();
  }
};

autofocus = function (event, ui) {
  event.preventDefault();
};

autoselect = function (event, ui) {
  if (autocompletefirst) {
    $("#oneline_input").autocomplete("option", "minLength", 9999);
    autocompletefirst = false;
  } else {
    if (ui.item.special) {
      event.preventDefault();
      /* The following line decides if we want to show a new
       * autocompletion list using autocompletespecial=true.  This is
       * needed if the user selects the "<i>xxx more values...</i>"
       * label; if instead, there is a target name to resolve, and
       * thus the label is "<i>No match found...", then the
       * autocompletion window should be closed.
       */ 
      if (ui.item.label[3] != "N") autocompletespecial = true;
    } else {
      ui.item.value = lexautocompselect(ui.item.value);
      if (autocompleteauto) 
	setTimeout('$("#oneline_input").autocomplete("search")', 30);
    }
  }
}

updater = function (event) {
  if (idleActive && (event == null || (event && event.keyCode != 13))) {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout("idleUpdater()", 500);
    idleValue = $("#oneline_input")[0].value;
    Texpr.submit = false;
  }
};

sesameUpdater = function () {
  if (!idleTimer) idleTimer = setTimeout("idleUpdater()", 100);
};

idleUpdater = function () {
  var emptystring = "Constraints entered into this one-line query field are combined with those entered into the form interface below. Keywords can be dragged&dropped from below.";
  idleTimer = null;
  clearErrors();
  sesameErrors = {};
  sesameWarnings = {};
  if (($("#oneline_input")[0].value != idleValue) &&
      ! Texpr.submit) return false;
  var line = idleValue.toLowerCase(), words = tokenize(line), vords, lex, res;
  words = retrace(line, words);
  words = classify(words);
  if (words.length > 1 || words[0][1] > words[0][0]) {
    if (errors.p.length > 0) 
      return displayErrors(words, false);
    lex = lexer(words);
    if (errors.p.length > 0) {
       if (Texpr.submit) { 
          alert("WARNING: the one-line query interface has recognized a synatax error. The query therefore can not be carried out.\n\nPlease correct the issue first and then submit the query again.");
      } 
      return displayErrors(words, false);
    }  
    res = Texpr.verify(lex[1]);
    if (!res[0] && !res[1]) {
      var es = Texpr.getErrors();
      for (var n=0; n<es.length; n++) 
	addError(es[n][0], es[n][1], es[n][2]);
      return displayErrors(words, false);
    }
    if (errors.p.length > 0)
      return displayErrors(words, false);
    if (Texpr.submit) {
      if (! checkComplete(lex[2], line.length)) {
         alert("WARNING: the one-line query interface has recognized an uncomplete input. The query therefore can not be carried out.\n\nPlease correct the issue first and then submit the query again.");
         return false;  
      }   
      if (errors.p.length > 0) 
        return displayErrors(words, false);
      line = Texpr.getText("SQL"); 
      if (! checkSesame()) {
         if (mykeys(sesameErrors).length > 0) 
           alert("WARNING: the one-line query interface has recognized an unresolved target name. The query therefore certainly will fail.\n\nPlease correct the issue first and then submit the query again.");
         return false;
      }
      if (errors.p.length > 0) 
        return displayErrors(words, false);
      $("#oneline_output").html(Texpr.getText("HTML"));
      if (Texpr.submit != true) Texpr.submit(line);
    } else {
      line = Texpr.getText("Human");
      if (errors.p.length > 0)
        return displayErrors(words, false);
      line = Texpr.getText("HTML");
      if (line=="") {
         line=emptystring;
      }
      var sqlline;
      if (res[0]) sqlline = Texpr.getText("SQL");
      else sqlline = "";
      $("#oneline_output").html(line);
      $("#oneline_sql_output").html(sqlline);
    }
  } else {
    $("#oneline_output").html(emptystring);
  }
  return true;
};

callback = function (field, func) {
  var res, len;
  if (autocompletefirst) {
    res = [{ label: "Autocompletion in this line can be activated using the TAB key.  (Select this line to dismiss the message)",
	    value: field.term }];
  } else {
    var autocomp = lexautocomp(field.term.toLowerCase());
    if (!autocomp) {
      $("#oneline_input").autocomplete("close");
      return false;
    }
    if (autocomp !== true) {
      res = autocomp.map(
	function (w) { 
	  return { label: (w[1][0] == "'" || w[1][0] == '"') ? 
		   w[1].slice(1) : (w[1][0] != "#") ? w[1] :
		   "<i>" + w[1].slice(1, w[1].lastIndexOf("#")) + "</i>", 
		   value: field.term.slice(0, w[0]) + 
		   ((w[1][0] != "#") ? w[1] : 
		    w[1].slice(w[1].lastIndexOf("#") + 2))};
	});
      len = res.length;
      if (len > 15 && autocompletespecial == false) {
	res = res.slice(0, 10);
	res.push({label: "<i>" + (len - 10) + " more values...</i>", 
		  value: field.term, special: true});
      } else if (res.length == 0) {
	res.push({label: "<i>No match found.</i>", 
		  value: field.term});
      }
      autocompletespecial = false;
    } else {
      res = [{label: "<i>No match found: value will be taken as a target name (you can press the SPACE key to check the name resolution of the target)</i>", 
	      value: field.term, special: true}];
    }
  }
  func(res);
};

formatResult = function(row) {
  return row.to;
}


fields = {
  "Target (SIMBAD name)": [Ttarget, "target_name"],
  "Target (HST name)": [Thsttarget, "target_name_hst"],
  "Target name (Solar body name)": [Tskybot, "skybot_name"],
  "Target description": [Tdescription, "target_description"],
  "File upload": [null, "filename"],
  "RA Dec": [Tequat, "coord"],
  "Galactic coordinates": [Tgalac, "coord_gal"],
  "Ecliptic coordinates": [Teclip, "coord_ecl"],
  "Search box": [Tradius, "search_box"],
  "Spatial resolution": [Tresolution, "spatial_resolution"],
  "Moving objects": [Tslew, "slew"],
  "Wavelength or band": [Twavelength, "wave_user_input"],
  "Bandwidth": [Tbandwidth, "fwhm_user_input"],
  "Filter/Grism/Prism": [Topt_elem, "opt_element"],
  "Optical element type": [Topt_elem_type, "c_opt_type"],
  "Spectral resolution": [Tspecres, "spectral_resolution"],
  "Spectral resolving power": [Trespower, "wave_respower"],
  "Observation date": [Tdate, "obs_date"],
  "Exposure time": [Texptime, "time_exposure"],
  "Time start": [Tstart, "time_start"],
  "Time end": [Tend, "time_end"],
  "Data type": [Tdata_type, "is_type"],
  "PI name": [Tpi, "pi_name"],
  "Proposal ID": [Tproposal, "proposal_id"],
  "Proposal title": [Ttitle, "proposal_title"],
  "Release date": [Trelease_date, "release_date"],
  "Dataset name": [Tdataset, "dataset_name"],
  "Science extension": [Textension, "science_extension"],
  "Number of members": [Tmembers, "no_members"],
  "Instrument": [Tinstrument, "instrument"],
  "Detector": [Tcamera, "detector"],
  "Photon mode": [Tmode, "phot_mode"]
}

dropper = function(name, value) {
  if (fields[name] && fields[name][0]) {
    var res = fields[name][0].getName("Human");
    if (res) res += "=";
    else res = fields[name][0].metatags[0].getName("Human") + "= " + 
      fields[name][0].metatags[1].getName("Human") + "=";
    return res;
  } else return "";
};


t = function(line) {
  var words, lex;
  words = tokenize(line);
  words = retrace(line, words);
  words = classify(words);
  lex = lexer(words);
  return lex[1];
}

/*
$(document).ready(function () {
   $("#oneline_input").keyup(updater);
   idleUpdater();
});
*/

/*
formatItem: function(row, i, max) {
  return i + "/" + max + ": \"" + row.name + "\" [" + row.to + "]";
},

formatMatch: function(row, i, max) {
  return row.name + " " + row.to;
},

formatResult: function(row) {
  return row.to;
}
*/
