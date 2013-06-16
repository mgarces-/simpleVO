/* These are the image variables for the arrow images. They do not reside in e.g. interface.js in order 
   to keep the latter more generic.*/
var oimg   = "images/arrow_down.png";
var cimg   = "images/arrow_right.png";         

/* This is the input string for wdb. The proxy does extensive input validation on this string */
/* var wdburl = "http://acwebint.eso.org/wdb/wdb/hst/hst_meta_science_votable/query";*/

/* we use the relative wdb url */
var wdburl = "http://archives.esac.esa.int/hst/cgi-bin/wdb/wdb/hst/hst_meta_science_votable/query";

var pedigreecgiurl = "http://archives.esac.esa.int/hst/cgi-bin/pedigree.cgi?dataset_name=";
/*For CADC: var pedigreecgiurl = "/cadcbin/hst/pedigree.cgi?dataset_name=";*/

/*var aladinurl      = "http://archive.eso.org/preview/p2aladin/"; For CADC: var aladinurl = "/cadcbin/hst/p2aladin/";*/
var aladinurl      = "http://aladin.u-strasbg.fr/java/nph-aladin.pl?frame=launching&script=grid+on%3Bget+Local%28";
var specviewurl    = "http://archive.eso.org/preview/p2specview/";
/*For CADC: var specviewurl    = "/cadcbin/hst/p2specview/";*/
var vospecurl      = "http://esavo.esac.esa.int/vospec/jsp/openSpectrum.jsp?fileName=";
// For CADC: need to add the url of the CADC host to vospec because not relative anymore
//var vospecurl      = "http://esavo.esac.esa.int/vospec/jsp/openSpectrum.jsp?fileName=http://test.cadc.hia.nrc.gc.ca";

// link to the proposal form
var propabswdburl = "http://archives.esac.esa.int/hst/cgi-bin/wdb/wdb/hst/propabs/query/";

// For CADC: use a different wdb url relative
//var wdburl = "/cadcbin/hst/wdb2eso.cgi/hst/hst_meta_science_votable/query";

// This is the version on the production server. We use the mapping from archive.eso.org
// to the production linux server. Then, the javascript on the user's machine sees
// both sources coming from the same site and XHR works. 
//var wdburl = "http://archive.eso.org/wdbl/wdb/hst/hst_meta_science_votable/query";

$(document).ready(function(){

   // This function prepares the startup configuration of the interface. This function is only executed when the page is reloaded (e.g. manually).
 
   // At first we detect if someone is using IE. If so warn them
   if (navigator.appName=="Microsoft Internet Explorer") {
      toggleDisplay(document.getElementById("browserwarning"), 'yes', 'no');
   }
     
   // if the page is reloaded, make sure that all fields are set back
   // This works for now. If however we will use the state manager and reload the page frequently, this behaviour has to be changed.
   var viewformnode = document.getElementById("viewForm");
   viewformnode.reset();
   
   // maximize input field length of the onelineinterface
   changeInputLength($("#oneline_input").get(0));

   // open the search box field
   toggleInput(document.getElementById("searchboxfield"),oimg,cimg,'yes', 'no', 'DIV', 'open');
   
   // open the Target name field
   toggleInput(document.getElementById("targetnamefield"),oimg,cimg,'yes', 'no', 'DIV', 'open');  
   
   // now the user can work already and we can preload the image(s) without disturbance
   addPreloadImage("images/out.gif");
   addPreloadImage("images/ajax-loader.gif");
   
   $(".draggable").draggable({helper:'clone'});  
   
   $("#oneline_input").droppable({
      drop: function(ev, ui) { 
         $("#oneline_input").val($("#oneline_input").val() + " " + dropper(ui.draggable.text().replace(/^\s+/, '').replace (/\s+$/, ''),""));
         updater();         
         $("#oneline_input").focus();
      }
    });
   
   $("#oneline_input").keyup(updater);
   $("#oneline_input").keydown(tabber);
   $("#oneline_input").autocomplete({source: callback, 
                                     scroll: true,
                                     scrollHeight: 120,
                                     minLength: 1,
                                     open: autoopen,
                                     close: autoclose,
                                     focus: autofocus,
                                     select: autoselect});
   idleUpdater();

   $(":input[name=target_name]").keydown(formTargetKeyPressed);

   // We add here the autocompletion (using the one-line code) to the form interface
   
   addautocompletion("detector",           Tcamera);
   addautocompletion("science_extension",  Textension);
   addautocompletion("pi_name",            Tpi2);
   addautocompletion("target_description", Tdescription);
   addautocompletion("opt_element",        Topt_elem);

   // initialize the history function      
   // Set the default of the history function to the standard state. This state is the one present in the HTML. 
   // This is not functionality provided by the history plugin. We just add the default value here, so that
   // we can in setView(Hash) use it should the hash be empty
   $.historyDefaultValue = statezipper(getCurrentViewState(),'zip');   
   $.historyInit(setView);
   
   // per default, images in FF and Safari can be dragged and dropped into input fields (where the link of the image is entered)
   // we prevent this functionality for all images on the page because it conflicts with our own drag&drop
   $("img").mousedown(function(event){if (event) event.preventDefault();});
         
   $("#tooltiptest").tooltip("#demotip");      
   $("#download_now").tooltip({
               tip:"#demotip2",
               offset: [0,10],
               position: 'center right',
               relative: true,
               delay: 300
               }
   ); 
});


