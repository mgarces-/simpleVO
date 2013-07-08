/*
 *    ALMA - Atacama Large Millimeter Array

 *    (c) European Southern Observatory, 2002
 *    Copyright by ESO (in the framework of the ALMA collaboration),
 *    All rights reserved
 *
 *    This library is free software; you can redistribute it and/or
 *    modify it under the terms of the GNU Lesser General Public
 *    License as published by the Free Software Foundation; either
 *    version 2.1 of the License, or (at your option) any later version.
 *
 *    This library is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *    Lesser General Public License for more details.
 *
 *    You should have received a copy of the GNU Lesser General Public
 *    License along with this library; if not, write to the Free Software
 *    Foundation, Inc., 59 Temple Place, Suite 330, Boston, 
 *    MA 02111-1307  USA
 */

/*
 * Javascript (document ready function) for the
 * science query search interface. It uses (and overrides) javascript from the 
 * the queryform and the voview packages
 * @author F. Stoehr, ESO/ALMA, 2011
 */
function AsaQuery(rhUrl) {
	// this is deliberately global at the moment
	requestHandlerUrl = rhUrl;
	
	var voViewStateSeparator = "__separator";
	var voView = null;

	/*
	 * called from the javasript document ready in the JSP
	 */
	this.init = function() {
		//$("#radio").buttonset();

		voView = new voview({
			input: {
				form: "queryForm"
			},
			widgetID: "resultTableClass"
		});
		voView.renderObject.enableRowSelection();
		voView.renderObject.setTitle("");
		
		// chartsHandler
		var chartsHandler = new ChartsHandler(voView);
		// Preload Charts and Event Handlers
		chartsHandler.init();
		
		// queryForm
		var qform = new queryForm(voView);
		
		qform.setIdColumnName("ASDM_UID");
		qform.resetInputFieldsCallback = this.resetQueryFormInputFields;
		qform.initCallBack = this.queryFormPostInitCallback;
		qform.resultFormSubmitCallback = this.queryFormRequestDataSets;
		qform.resolverCallBack = this.queryFormResolverCallback;
		qform.postTableRenderCallback = chartsHandler.renderChart;
		qform.init();
	
		$("#source_name_sesame").keydown(function() {      
			qform.resolverKeyPressed($(this), "proxySesame", 750);
		});
		
		var myself = this;
		// trap the radio buttons which switch between the asadm and project views
		$("[name='viewFormat']").click(function() {
			try {
			  var activeValue = $(this).val();
			  if ("asdm" == activeValue) {
 				  qform.setIdColumnName("ASDM_UID");
				  myself.saveVoViewState("project");
				  myself.restoreVoViewState("asdm");
			  }
			  else {
 				  qform.setIdColumnName("project_uid");
				  myself.saveVoViewState("asdm");
				  myself.restoreVoViewState("project");				  
			  }
			}
			catch (e) {
				alert("ft: " + e.message);
			}
		});
		// set the initial state
		myself.restoreVoViewState("asdm");		
	};
	
	/*
	 * 
	 */
	this.resetQueryFormInputFields = function () {
		
		$('#searchRadius').parent().show();
		$('#searchRadius').val('0:10:00');
		
		$('#scan_intent').parent().show();
		$('#scan_intent').val("=%TARGET%");
		$('#scan_intent').multiselect('refresh');
		$('.inputfielddiv button').width("100%");
		
		$('#radiobuttons').parent().show();
			
		$('#source_name_ok_img').hide();
		$('#source_name_bad_img').hide();
		$('#source_name_work_img').hide();
		
		$('#tooltipresolverdiv').html("");
		$('#tooltipresolverdiv').parent().css('width','');    
	};
	
	/*
	 * 	
	 */
	this.queryFormPostInitCallback = function () {
		// special set-up scan: limit the height of the selection box
		$('#scan_intent').multiselect({
			height: 180
		});
	
		// band: only show the band (taken from the value) and not the string (including the GHz)
		$('#band').multiselect({
			selectedText: function (n, ntot, a) {
				var alist = [];
				for (var i = 0; i < a.length; i++) {
					alist.push($(a[i]).val());
				}
				return alist.join(", ");
			},
			selectedList: false
		});
	
		//$(".inputdiv").click(function () {
		//	qform.focusInputTextField(this);
		//});
	};

	/*
	 * Dynamically create a new form to request the selected datasets
	 * and submit it.
	 */
	this.queryFormRequestDataSets = function (id_column_name, resultlist) {
				
		var form = document.createElement("form");

		if(resultlist.length == 0){
			return;
		}
		
		form.setAttribute("method", "post");
		form.setAttribute("name", "retrieve");
		form.setAttribute("action", requestHandlerUrl);
		
		// eliminate duplicates from the selected rows. It looks odd
		// if the RH displays the same result many times
		var set = {};
		for (var n = 0; n < resultlist.length; n++) {
			// when selecting "all" in the voview we have an "undefined" entry
			if (undefined != resultlist[n]) set[resultlist[n]] = true;
		}
		
		// construct a form to pass on to the RH
		for (var nextUid in set) {
	        var input = document.createElement("input");
	        input.setAttribute("type", "hidden");
	        input.setAttribute("name", "dataset");
	        // the request handler expects all colons and slashes to be replaced by underscores
	        var niceUid = nextUid.replace(/\//g, '_').replace(/:/g, '_');
	        input.setAttribute("value", "ALMA+" + niceUid); 
	        form.appendChild(input) ;
	    }
		document.body.appendChild(form);
		
		// COMP-8457 AQ: open RH page in a new tab/window
		form.setAttribute("target", "_");
		
		form.submit() ;

	};

	/**
	 * Set the state of the results table
	 */
	this.restoreVoViewState = function(viewName) {
		var state = $("#" + viewName + "VovState").val();
	        // The first number to columnFormat is the 0-based column number 
	        // in the VOTable
	        //voView.renderObject.enableRowSelection();
	        //voView.renderObject.columnFormat(0, aqASDMDownload);
	        //voView.renderObject.columnFormat(1, raTooltip);
	        //voView.renderObject.columnFormat(2, decTooltip);
	        //voView.renderObject.columnFormat(5, aqField2ProjectLink);
	        // sorting
	        //if (state && state.length > 0) {
	        //    if (state[0] != aqNoSorting) {
	        //        var sortCol = state[0].substr(1);
	        //        var sortDir = state[0].substr(0, 1) == "a" ? "ascending" : "descending";
	        //        voView.filterObject.setSortColumns({
	        //            sortKeys:
	        //                [voView.makeSortColumnKey({
	        //                        column:sortCol, 
	        //                        direction:sortDir
	        //                    })
	        //                ]
	        //        });
	        //    }
	        //}

	        // order
	        if (state && state.length > 0) {
			    var fields = state.split(',');
	            var realCols = [];
	            var endOfCols = fields.length - 2;
	            for (var i = 0; i < fields.length; i++) {
	                if (fields[i] == voViewStateSeparator) {
	                    endOfCols = i;
	                }
	                else {
	                	var fieldAsInt = parseInt(fields[i]);
	                    realCols.push(fieldAsInt);
	                }
	            }
	            voView.renderObject.setDisplayedColumns(realCols);
	            voView.renderObject.setDisplayedColumns(endOfCols);
	        } 
	        else {
	            var realCols = [];
	            for (var i = 0; i < 100; i++) realCols[i] = i;
	            voView.renderObject.setDisplayedColumns(realCols);
	            voView.renderObject.setDisplayedColumns(8);
	        }
	        // always sort by release date by default
	        // TODO store the sort column in the state and re-instate it
	        voView.filterObject.setSortColumns({
	            sortKeys: [
	                voView.makeSortColumnKey({
	                    column: 'RELEASE_DATE', 
	                    direction: 'ascending'
	                })
	             ]
	        });
//	        voView.start();
	        // Needed for voView 1.2
	        //voView.renderObject.setTitle(" Results ");
	};
	
	/**
	 * 
	 * @returns {Boolean}
	 */
	this.saveVoViewState = function(viewName) {
	    var state = [];
	    // sorting
//	    var isSorting = false;
//	    $("table.data thead tr:first th").each(function (index, th) {
//	        var jth = $(th);
//	        if (jth.hasClass("descending")) {
//	            state.push("d" + th.innerHTML);
//	            isSorting = true;
//	        } else {
//	            if (jth.hasClass("ascending")) {
//	                state.push("a" + th.innerHTML);
//	                isSorting = true;
//	            }
//	        }
//	    });
//	    if (!isSorting) {
//	        state.push(voViewStateNoSorting);
//	    }
	    // order
        $("table#voview_column_fields tbody tr").each(function (index, tr) {
	        // ID for row is 'fieldrow_<number>'
            if (tr.id && tr.id.indexOf("fieldrow") > -1) {
	            var idParts = tr.id.split("_");
            	var columnIdIndex = idParts[idParts.length - 1];
	            state.push(columnIdIndex);
	        }
	        else {
	            state.push(voViewStateSeparator);
	        }
	    });
        var fieldName = '#' + viewName + 'VovState';
	    $(fieldName).val(state);
	    return true;
	};

	/*
	 * 
	 */
	this.queryFormResolverCallback = function (result, inputfield) {
		// this function formats the output of the source name resolution and updates
		// the page accordingly
		var objecttype = "";
		
		// Fix for COMP-8168 AQ: name resolver timing problem
		// hide all images up front and only display the right one if/when required 
		$('#source_name_ok_img').hide();
		$('#source_name_bad_img').hide();
		$('#source_name_work_img').hide();	
		
		if (result[0]=='empty') {
			$('#tooltipresolverdiv').html("");
			$('#tooltipresolverdiv').parent().css('width','');
		} 	
		else if (result[0]=='ok') {
			$('#searchRadius').parent().show();
			$('#searchRadius').val("0:10:00");
			
			$('#source_name_ok_img').show();
			if (result[3]=="S") {
				resolverlink = 'Sesame using <a href="http://simbad.u-strasbg.fr/simbad/sim-id?NbIdent=1&Ident='+result[5]+'">Simbad</a>';
				objecttype = (simbad_class[result[4]] || result[4]);
			} 
			else if (result[3]=='N') {
				resolverlink = 'Sesame using <a href="http://nedwww.ipac.caltech.edu/cgi-bin/nph-objsearch?extend=no&objname='+result[5]+'">NED</a>';
				objecttype = (ned_class[result[4]] || result[4]);
			} 
			else if (result[3]=='V') {
				resolverlink = 'Sesame using <a href="http://vizier.u-strasbg.fr/viz-bin/VizieR?-source=&-out.add=_r&-out.add=_RAJ%2C_DEJ&-sort=_r&-to=&-out.max=20&-meta.ucd=2&-meta.foot=1&-c.rs=10&-c='+result[5]+'">VizieR</a>';
			} 
			else {
				resolverlink = 'Unknown Resolver';         
			}
			var morphologystring = "";
			if (result[6]!="") {
				morphologystring = "<b>Morphology Type</b><br>"+result[6]+"<br><br>";
			}    
			$('#tooltipresolverdiv').parent().css('width','400px');         
			$('#tooltipresolverdiv').html('<div><b>Source</b><br>'+result[5]+'<br><br><b>Coordinates (RA Dec)</b><br>'+result[1]+"<br><br><b>Object type</b><br>"+result[4] +" ("+objecttype+")<br><br>"+morphologystring+"<b>Resolver</b><br>"+resolverlink+"</div>");    
		} 
		else if (result[0]=='bad') {
			$('#source_name_bad_img').show();
			$('#tooltipresolverdiv').parent().css('width','400px');
			$('#tooltipresolverdiv').html("</div>ERROR: Souce name could not be resolved.</div>");
		} 
		else if (result[0]=='work') {
			$('#source_name_work_img').show();			
			$('#tooltipresolverdiv').html("");
			$('#tooltipresolverdiv').parent().css('width','');
		} 
		else if (result[0]=='error') {
			$('#source_name_bad_img').show();
			$('#tooltipresolverdiv').parent().css('width','400px');
			$('#tooltipresolverdiv').html("<div>ERROR: Could not access SESAME resolver!</div>");
		}
	};

	// // 
	// // Charts Rendering
	// // 
	// 
	// var ChartHandler = function(){
	// 	
	// 
	// 	var plot_options;
	// 	
	// 	
	// 	this.init = function(){			
	// 		plot_options = {
	// 	    chart: {
	// 	        renderTo: 'chartsContainer',
	// 	        defaultSeriesType: 'column'
	// 	    },
	// 			series: []
	// 		};
	// 		
	// 		$("#plot-x").change(renderChart);
	// 	}
	// 
	// 	this.formatData = function(data){
	// 		
	// 		//data[0] = data[0]; //Project Code (String)
	// 		//data[1] = data[1]; // Source Name (String)
	// 		data[2] = parseFloat(data[2]); // Ra (Float)
	// 		data[3] = parseFloat(data[3]); // Dec (Float)
	// 		data[4] = parseInt(data[4]); // Band (Int)
	// 		data[5] = parseFloat(data[5]);  //Integration (Float)
	// 		data[6] = new Date(data[6]); // Release Date (Datetime)
	// 		data[7] = parseFloat(data[7]); //	Vel. Resolution (Float)
	// 	  //date[8] = date[8]; // Pol. Products (String)
	// 		data[9] = new Date(data[9]); // Start Date (Datetime)
	// 		//date[10] = date[10]; // PI_NAME (String)
	// 		data[11] = parseFloat(data[11]); // PWV (Float)
	// 		//data[12] = data[12]  //ASDM_UID (String)
	// 		//data[13] = data[13]  //TITLE (String)
	// 		//data[14] = data[14]  //TYPE (String)
	// 		//data[15] = data[15]  //SCAN_INTENT (String)
	// 		
	// 		return data;
	// 	}
	// 
	// 	this.renderChart = function(){
	// 		$("#queryOverlay>p").text('loading');
	// 		$("#queryOverlay").overlay().load();
	// 		
	// 		
	// 		var votable_rows_num = voView.renderObject.getFilteredRowsNum();
	// 		
	// 		var votable_categories = voView.renderObject.getColumnNames(),
	// 				selected_category_index = $("#plot-x :selected").val();
	// 
	// 
	// 		var	plot_options_index = -1;
	// 				
	// 		var data_row, //used to obtain plotta
	// 				previous_source_name,
	// 				current_source_name;
	// 		
	// 
	// 		plot_options.series=[];
	// 				
	// 		for (var i = 1; i <= votable_rows_num; i++) {
	// 			data_row = formatData(voView.filterObject.getRowValues(i));
	// 
	// 			// get SOURCE_NAME value
	// 			current_source_name = data_row[1]; 
	// 			
	// 			if(i == 1 || current_source_name != last_source_name){					
	// 				plot_options.series.push({
	// 					name: current_source_name, 
	// 					data: [data_row[selected_category_index]]
	// 				});
	// 				
	// 				last_source_name = current_source_name; 
	// 				plot_options_index+=1;
	// 			}else if (current_source_name == last_source_name){
	// 				plot_options.series[plot_options_index]
	// 					.data.push(data_row[selected_category_index])
	// 			}
	// 		}
	// 
	// 		var chart = new Highcharts.Chart(plot_options);
	// 		$("#queryOverlay").overlay().close();
	// 	}
	// 	
	// 	
	// }

	
};

