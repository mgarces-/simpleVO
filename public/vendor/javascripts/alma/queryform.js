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
* javascript that drives the search interface and calls the rendering package voview.
* a voview instance has to be passed as argument to the conctructor of this package.
* @author F. Stoehr
*/
var queryForm = function (vov) {
	// use myself instead of 'this' to differentiate between the javascript OO 'this' and
	// the 'this' used in the context of jquery callbacks which refers to the current DOM
	// element
	var myself         = this;
	var id_column_name = "";
	var resolverTimer  = null;
	var resolverCache  = {};
	var tooltipTimer = null;

	// getting a local name for the vov object. The object is still referenced and not copied as it should be.
	var myvov = vov;

	this.init = function () {
		// Only the first tab is enabled
		$("#tabs").tabs({
			disabled: [1,2]
			// disabled: []
		});
      
		$(".inputdiv").mouseenter(function () {
			// This function starts a timer after which the input field is shown. If the mouse
			// leaves the field before the delay, then this timer can be deleted
			var thiselement = $(this);
			// the delay must be less than 100 so that the trigger goes off before
			// the slideDown is completed. If larger values need to be accommodated the sliding 
			// must be slowed down accordingly.
			var openTimeoutId = setTimeout(function () {
				myself.openInputField(thiselement);
			}, 200);
			thiselement.data('openTimeoutId', openTimeoutId);
		});

		$(".inputdiv").mouseleave(function () {
			myself.closeInputField($(this));
		});

		$('.inputdiv select').each(function () {
			$(this).multiselect({
				noneSelectedText: '',
				selectedList: 5,
				header: false,
				minWidth: '140',
				height: "auto",
				classes: 'multiselectclass'
			});
		});

		// The tooltips of the input fields
		$(".elementdiv").tooltip({
			position: "bottom right",
			// The horizontal spacing is 0 so that when hovering from the input
			// field to the tooltip, the parent div is not left (and the tooltip
				// stays open
				offset: [-30, 0],
				effect: "toggle",
				// we completely override the standard tooltip triggers and 
				// show and hide the tooltips ourselves
				events: {
					def: "none,none",
					input: "none,none",
					widget: "none,none",
					tooltip: "none,none"
				}
			}).dynamic({});

			// Mask that is put over the query page when searching
			$("#queryOverlay").overlay({
				mask: {
					color: '#F6F6F6',
					loadSpeed: 200,
					opacity: 0.85
				},
				closeOnClick: false,
				closeOnEsc: false,
				top: 'center'
			});

			$('#queryForm input[type="reset"]').click(function () {
				// attach resetInputFields function to Reset button
				myself.resetInputFields();
				return false;
			});

			$('#queryForm').submit(function () {
				return myself.queryFormSubmit(this);
			});

			$('#resultForm').submit(function () {
				return myself.resultFormSubmit();
			});

			myself.initCallBack();
			myself.resetInputFields();

			// takes the focus from the URL bar to the window
			window.focus();
		};

		this.setIdColumnName = function (id_column_name) {
			myself.id_column_name = id_column_name;
		};

		this.openInputField = function (thiselement) {
			// This function opens an input field and opens (with some delay)
			// the corresponding tooltip. Because this should also remove the
			// selection box when content has been selected no :hidden is used here
			thiselement.find('.inputfielddiv').slideDown(150,function () {
				// if it is a selection box, then after the input field is open,
				// pop the selection box open
				thiselement.find('.inputfielddiv button').width("100%").each(function () {
					// Instead of using $(this).prev().multiselect('open');
					// We just show and hide the menu as the multiselect.("close") does give us
					// a "too much recursion" error. We inherit the width from the button
					$(this).next().width($(this).width() - 6).slideDown(150);         
				});
			});               

			thiselement.find('.inputfielddiv input:first').focus();

			// open the tip with some delay   
			tooltipTimer = setTimeout(function () {
				// before opening the tooltip make sure that no other tooltip is open
				$(".tooltip").hide();
				thiselement.find(".elementdiv").data('tooltip').show();
			}, 200);
		};

		this.closeInputField = function (thiselement) {
			// prevent the tooltip from showing now that we've left the field
			clearTimeout(tooltipTimer);
			// If the mouse leaves an input field, an potentially existing timer to open
			// the input field and the corresponding tooltip is deleted: Only if the mouse 
			// rests a certain time over the input field, the latter is opened. This prevents
			// flicerking if the mouse is moved quickly over the fields.
			clearTimeout(thiselement.data('openTimeoutId'));         

			// close the field if it is empty. The filter is required as jQuery does not understand
			// find(".class tag:text[value='']"). It does work without the .class, though.
			var inputfielddiv = thiselement.find('.inputfielddiv:visible');         
			if (inputfielddiv.find('input:first:text').val() == "") {
				inputfielddiv.slideUp(400);             
			} else {
				// check if the field contains a selection box      
				var thisselect = thiselement.find('.inputfielddiv button:first');
				if (thisselect.length > 0) {
					// unfortunately we can not use multiselect('close') here as this seems to produce
					// a recursion. We therefore have to remove the div.
					thisselect.next().hide();

					if (thisselect.prev().val() == null) {
						inputfielddiv.slideUp(400);
					}
				} else {
					inputfielddiv.find('input').blur();
				}
			}

			// in any case: remove the tooltip
			thiselement.find(".elementdiv").data('tooltip').hide();
		};

		this.resolverCallBack = function (result, inputfield) {};

		this.resetInputFieldsCallback = function () {};

		this.initCallBack = function () {};

		this.resultFormSubmitCallback = function (id_column_name, resultlist) {};

		this.sourceResolver = function(inputfield, serviceurl) {         
			// this function issues an ajax request to the serviceurl?name (expecting SESAME output)
			// which can be e.g. an apache ProxyPass to the http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox/SNV         
			var result = ['empty', 0.0, 0.0, 0, "", "", ""];
			var source = $.trim($(inputfield).val());
			
			if (source != "") {
				if (resolverCache[source]) {
					myself.resolverCallBack(resolverCache[source], inputfield);
				} else {
					var resolver, nmatches, url;
					result[0] = 'work';
					url       = serviceurl + "?" + source;
					myself.resolverCallBack(result, inputfield);
            
					{$.ajax({url: url,
						type: "GET",
						dataType: "xml",
						success: function (data) {                      
							nmatches = 1;
							if ($($(data).find('jpos')).length > 0) {
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
								result = ['ok', $($(data).find('jpos')[0]).text(),
								nmatches, resolver, $($(data).find('otype')[0]).text(), $($(data).find('oname')[0]).text(),$($(data).find('MType')[0]).text()];
							} else {
								result[0] = 'bad';
							}
							resolverCache[source] = result;
							myself.resolverCallBack(result, inputfield);
						},
						error: function(XMLHTTPRequest, textStatus, errorThrown) {
							result[0] = 'error';
							resolverCache[source] = result;
							myself.resolverCallBack(result, inputfield);
						}}
					)};
				}
			} else {
				myself.resolverCallBack(result, inputfield);
			}   
		};

		this.resolverKeyPressed = function (inputfield, serviceurl, timerdelay) {
			if (resolverTimer) {
				clearTimeout(resolverTimer);
			}   
			resolverTimer = setTimeout(function () {
				myself.sourceResolver(inputfield, serviceurl);
			}, timerdelay);         
		};

		this.cleanSerializedValues = function(values) {
			// This function removes all field names from the form that have no input values as well as the
			// multiselect checkboxes. The latter is possible as the multiselect keeps the original field
			// filled correctly.
			var valuelist    = values.split("&");
			var newvaluelist = [];
			for (i=0; i < valuelist.length; i++) {
				if ((valuelist[i].split("=")[1]!="") && (valuelist[i].split("=")[0].indexOf('multiselect_') == -1)) {
					newvaluelist.push(valuelist[i]);
				}
			}
			return newvaluelist.join("&");
		};

		/*
		* 
		*/
		this.queryFormSubmit = function(queryForm) {
			var queryUrl = myself.buildQueryUrl(queryForm);
			//alert('queryUrl: ' + queryUrl);
			queryForm['query_string'].value = queryUrl;
			//alert(thisfield['query_string'].value);

			$("#queryOverlay>p").text('Searching');
			$("#queryOverlay").overlay().load();
			// Keep the search screen under the overlay until the result page is 
			// fully rendered. Then remove it and switch tabs
			
			myvov.renderObject.setUpdateCallback(function () {
				myself.postQueryFormSubmission();
			});

			myvov.setErrorCallBack(function(errorMessage){
				alert(errorMessage);
				$("#queryOverlay").overlay().close();
			});
      
			myvov.renderObject.setDisplayedColumns(9);
			myvov.start();

			// prevent standard behaviour (action) to take place
			return false;
		};

		/*
		* private method to strip out certain elements from a URL query string
		* @param queryParameters e.g. a=5%&ra=100.3&dec=3.213
		* @return queryParameters with the "query_string" and "multiselect_" elements removed
		* 	and "download=true" appended
		*/
		this.buildQueryUrl = function(queryForm) {
			// alert('form: ' + $(queryForm).serialize());
			// jquery function returns all form elements and creates a name=value URL encoding
			var values = $(queryForm).serializeArray();
			var valuesArray = $.grep(
				values,
				function(element) {
					return element.value != "" && 
					element.name != "query_string" &&
					element.name.indexOf("multiselect_") == -1;
				}
			);
			var stringParts = [];
			for (i in valuesArray) {
				stringParts.push(valuesArray[i].name + "=" + valuesArray[i].value);
			}
			stringParts.push("download=true");
			// make sure only an asterisk is used for wildcards
			var url = "search?" + stringParts.join("&");
			url = url.replace(/\%/g, '*');
			// alert('url: ' + url);
			return url;
		};
   
		this.postQueryFormSubmission = function () {
			// enable tab number two, only tab number 1 [0..1 counting] is disabled
			$("#tabs").tabs({
				disabled: [0]
			});
			$("#tabs").tabs('select', 1);
			$("#queryOverlay").overlay().close();

			myself.postTableRenderFunction();
			// replace the callback by the postTableRenderFunction
			myvov.renderObject.setUpdateCallback(function () {
				myself.postTableRenderFunction();
			});
			
			
			
		};

		this.postTableRenderCallback = function(){}

		this.postTableRenderFunction = function () {
			// adding the Help text
			// add a class to be able to set the width of the parent <td>
			var helpcolumn = $("#resultTableClass_parameters").parent();
			helpcolumn.addClass("helpandparameters");
			helpcolumn.html(function (index, oldhtml) {
				return "<div><h2>Help</H2>You can:<br><ul><li>change the <b>sorting</b> by clicking on the column headers of the data table <li>change the <b>order</b> of the columns by draging & dropping the column headers or the rows in the column table on the left.<li><b>add</b> or <b>remove</b> columns to be displayed by dragging&dropping columns above or below the red bar (or the red bar itself)<li><b>filter</b> the search results </ul></div>" + oldhtml;
			});
			
			// myself.postTableRenderCallback();
		};



		this.resetInputFields = function () {
			// function that resets all fields to default values
			$('.inputfielddiv').hide();
			$('.inputfielddiv input:text').val('');
			$('.inputdiv .inputfielddiv select').each(function () {
				$(this).multiselect('uncheckAll');
			});         
			myself.resetInputFieldsCallback();
		};

		this.focusInputTextField = function (thisfield) {
			// focus goes to the first element.
			$(thisfield).find('.inputfielddiv input:first:text').focus();         
		};

		this.resultFormSubmit = function () {
		      // uses this.id_column_name
		      // This is the name of the column of which to obtain the values 
		      // to be delivered to the 
		      var columnnames = myvov.renderObject.getColumnNames();
		      var selectedrows = myvov.renderObject.getSelectedRows();

		      var idx = -1;
		      for (var k = 0; k < columnnames.length; k++) {
		         if (columnnames[k] == myself.id_column_name) {
		            idx = k;
		            break;
		         }
		      }
		      var resultlist = [];
		      for (var k = 0; k < selectedrows.length; k++) {
		         resultlist.push(myvov.filterObject.getRowValues(selectedrows[k])[idx]);
		      }

		      // enable tab number three, no tab is disabled
		      $("#tabs").tabs({
		         disabled: []
		      });
		      $("#tabs").tabs('select', 1);

		      myself.resultFormSubmitCallback(myself.id_column_name, resultlist);

		      // prevent standard behaviour (action) to take place
		      return false;
		   };
   
	};
