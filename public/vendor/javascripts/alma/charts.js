function PlotUtils(){
	this.degrees2HSM = function(degrees){
	    var deg = degrees | 0; 
	    var frac = Math.abs(degrees - deg);
	    var min = (frac * 60) | 0; 
	    var sec = Math.round(frac * 3600 - min * 60);
	    return deg + ":" + min + ":" + sec + "";
	}
	
	this.getVOTableRowValues = function(index,voTableRows){
		var rows = $('TD',voTableRows[index]);
		var rows = $(rows);
		
		var row_values = [];
		
		for(var i=0;i<rows.length;i++){
			var row = $(rows[i]);
			
			if(row.attr('val'))
				row_values.push(parseFloat(row.attr('val')));
			else
				row_values.push(row.text());
		}

		return row_values;
	}
	
}


function ChartsHandler(voView){
	var plotUtils = new PlotUtils();
	var self = this;
	var last_rendered = null;
	var voTableRows = null;
	
	
	this.init = function(){			
		
		voView.filterObject.postFilterCallback = self.voViewUpdatehandler;
		
		// Fill Select in Chart Section
		plot_options = [{
	    value: 1,
	    text: "Percentage of Band Usage"
		},{
			value: 2,
			text: "Observations in RA/DEC"					
		}];
		
		for(var i in plot_options){
			$('#chart_select').append($('<option>', plot_options[i]));
		}

		$("#chart_select")[0].selectedIndex = -1;
		$("#chart_select").change(function(){
			var selected_category = $("#chart_select :selected").val();

			// RA/DEC Scatter Plot
			if(selected_category == 1) self.renderChart(self.bandsPlot);
			// Band Usage Circle Plot
			if(selected_category == 2) self.renderChart(self.radecPlot);
		});
	}

	this.voViewUpdatehandler = function(voTableDOM){
		$("#queryOverlay>p").text('loading');
		$("#queryOverlay").overlay().load();
		
		
		// refresh data from VOView		
		voTableRows = $('TABLEDATA TR',voTableDOM);
		
		test = voTableRows;
		
		// render (re-render) chart
		self.renderChart();
		
		// read Data, store it somewhere and change getRowValues to some procedure that parse this voTable
		$("#queryOverlay").overlay().close();
	}


	// router to charts
	this.renderChart = function(){
		if(arguments.length == 0 && last_rendered != null) last_rendered[0]();
		if(arguments.length == 1) arguments[0]();
	}
	
	
	// ********************
	// Charts Construction
	// ====================

	this.radecPlot = function(){
		var plot_config = self.radecConfig();
		
		var series_index = -1;
		
		var row, 
				previous_source_name,
				current_source_name;
		
		
		for (var i = 0; i < voTableRows.length; i++) {
			row = plotUtils.getVOTableRowValues(i,voTableRows);

			current_source_name = row[1]; 
			if(i == 0 || current_source_name != last_source_name){					
				plot_config.series.push({
					name: current_source_name, 
					data: [[row[2],row[3]]]
				});

				last_source_name = current_source_name; 
				series_index+=1;
			}else if (current_source_name == last_source_name){
				plot_config.series[series_index]
					.data.push([row[2],row[3]])
			}

		}

		console.log(plot_config.series);

		last_rendered = this;
		new Highcharts.Chart(plot_config);
	
		
	}

	

	this.bandsPlot = function (){	
		
		var plot_config = self.bandsConfig();

		var percentage_per_band = [
			0.0, //Band 1
			0.0, //Band 2
			0.0, //Band 3
			0.0, //Band 4
			0.0, //Band 5
			0.0, //Band 6
			0.0, //Band 7
			0.0, //Band 8
			0.0, //Band 9
			0.0, //Band 10
		];
		
		for (var i = 0; i < voTableRows.length; i++) {
			row = plotUtils.getVOTableRowValues(i,voTableRows);
		
			//update occurence freq.
			percentage_per_band[row[4]-1] += 1/(i+1); 
		}
		
		console.log(percentage_per_band);

		// uncommented only Bands offered now by ALMA (also the available ones in the Form)
		plot_config.series[0].data = [
			// ['Band 1',percentage_per_band[0]],
			// ['Band 2',percentage_per_band[1]],
			['Band 3',percentage_per_band[2]],
			// ['Band 4',percentage_per_band[3]],
			// ['Band 5',percentage_per_band[4]],
			['Band 6',percentage_per_band[5]],
			['Band 7',percentage_per_band[6]],
			// ['Band 8',percentage_per_band[7]],
			['Band 9',percentage_per_band[8]],
			// ['Band 10',percentage_per_band[9]]
		];
	
		last_rendered = this;
		new Highcharts.Chart(plot_config);
	}



	// ********************
	// Charts Configuration
	// ====================

	this.radecConfig = function(){
		return {
			chart: {
				renderTo: 'chartsContainer',
				type: 'scatter',
				zoomType: 'xy'
			},
			title: {
				text: "Observations in RA/DEC"
			},
			xAxis: {
				title: {
					enable: true,
					text: 'Ra'
				},
				startOnTick: true,
				endOnTick: true,
				showOnLabel: true,
				type: 'datetime',
				dateTimeLabelFormats: {
					hour: '%H:%M:%S',
					minutes: '%H:%M:%S',
					seconds: '%H:%M:%S'
				}
			},
			yAxis: {
				title: {
					text: 'Dec'
				}
			},
			legend: {
				layout: 'vertical',
				align: 'left',
				verticalAlign: 'top',
				x: 100,
				y: 70,
				floating: true,
				backgroundColor: '#FFFFFF',
				borderWidth: 1
			},
			plotOptions: {
				scatter: {
					marker: {
						radius: 5,
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					states: {
						hover: {
							marker: {
								enabled: false
							}
						}
					},
					tooltip: {
						headerFormat: '<b>Source Name: {series.name}</b><br>',
						pointFormat: '{point.x} [RA], {point.y} [DEC]'
					}
				}
			},
			series: []
		};
	}

	this.bandsConfig = function(){
		return {
			chart: {			
				renderTo: 'chartsContainer',
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false
			},
			title: {
				text: 'Percentage of Band Usage'
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
		    pie: {
	        allowPointSelect: true,
	        cursor: 'pointer',
	        dataLabels: {
	          enabled: true,
	          color: '#000000',
	          connectorColor: '#000000',
	          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
	        }
		    }
			},
			series: [{
	      type: 'pie',
	      name: 'Percentage of Searched Observations',
			}]
		};
	}

};