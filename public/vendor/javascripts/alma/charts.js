function PlotUtils(){
	this.degrees2HSM = function(degrees){
	    var deg = degrees | 0; 
	    var frac = Math.abs(degrees - deg);
	    var min = (frac * 60) | 0; 
	    var sec = Math.round(frac * 3600 - min * 60);
	    return deg + ":" + min + ":" + sec + "";
	}	
}


function ChartsHandler(voView){
	var plotUtils = new PlotUtils();
	var self = this;
	var last_rendered = null;
	
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
		
		console.log('[LOG] voViewUpdatehandler:')
		console.log(voTableDOM);
		
	}


	this.parseVOTableDOM = function(voTableDOM){
		var columns_length = voView.renderObject.getColumnNames().length;
		var columns = voTableDOM.getElementsByTagName("TD");
		var values = [[]];
		
		row_index = 0;
		
		
		return values;
	}


	this.formatData = function(data){
	
		//data[0] = data[0]; //Project Code (String)
		//data[1] = data[1]; // Source Name (String)
		data[2] = parseFloat(data[2]); // Ra (Float)
		data[3] = parseFloat(data[3]); // Dec (Float)
		data[4] = parseInt(data[4]); // Band (Int)
		data[5] = parseFloat(data[5]);  //Integration (Float)
		data[6] = new Date(data[6]); // Release Date (Datetime)
		data[7] = parseFloat(data[7]); //	Vel. Resolution (Float)
	  //date[8] = date[8]; // Pol. Products (String)
		//data[9] = new Date(data[9]); // Start Date (Datetime)
		//date[10] = date[10]; // PI_NAME (String)
		data[11] = parseFloat(data[11]); // PWV (Float)
		//data[12] = data[12]  //ASDM_UID (String)
		//data[13] = data[13]  //TITLE (String)
		//data[14] = data[14]  //TYPE (String)
		//data[15] = data[15]  //SCAN_INTENT (String)
	
		return data;
	}


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

	this.radecPlot = function(){
		// RA = 2, DEC = 3
		var plot_config = self.radecConfig();

		var data_length = voView.renderObject.getFilteredRowsNum();
		var data_categories = voView.renderObject.getColumnNames();
		
		var	series_index = -1;
			
		var data_row, 
				previous_source_name,
				current_source_name;
			
		
		for (var i = 1; i <= data_length; i++) {
			data_row = self.formatData(voView.filterObject.getRowValues(i));
			
			current_source_name = data_row[1]; 
			if(i == 1 || current_source_name != last_source_name){					
				plot_config.series.push({
					name: current_source_name, 
					data: [[data_row[2],data_row[3]]]
				});
			
				last_source_name = current_source_name; 
				series_index+=1;
			}else if (current_source_name == last_source_name){
				plot_config.series[series_index]
					.data.push([data_row[2],data_row[3]])
			}
			
		}
		
		
		last_rendered = this;
		new Highcharts.Chart(plot_config);
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
		
		var total_filtered_observations = voView.renderObject.getFilteredRowsNum();

		for (var i = 1; i <= total_filtered_observations; i++) {
			data_row = self.formatData(voView.filterObject.getRowValues(i));
			console.log('data_row['+i+'] = '+data_row[4])
			
			console.log('percentage_per_band index = ' + voView.filterObject.getRowValues(i)[4]);
			//update occurence freq.
			percentage_per_band[data_row[4]-1] += 1/total_filtered_observations; 
		}
		
		console.log(percentage_per_band);

		plot_config.series[0].data = [
			['Band 1',percentage_per_band[0]],
			['Band 2',percentage_per_band[1]],
			['Band 3',percentage_per_band[2]],
			['Band 4',percentage_per_band[3]],
			['Band 5',percentage_per_band[4]],
			['Band 6',percentage_per_band[5]],
			['Band 7',percentage_per_band[6]],
			['Band 8',percentage_per_band[7]],
			['Band 9',percentage_per_band[8]],
			['Band 10',percentage_per_band[9]]
		];
	
		last_rendered = this;
		new Highcharts.Chart(plot_config);
	}

	this.renderChart = function(){
		$("#queryOverlay>p").text('loading');
		$("#queryOverlay").overlay().load();

		console.log(arguments.length);
		console.log(last_rendered);

		if(arguments.length == 0 && last_rendered != null){
			last_rendered[0]();
			console.log('[LOG] executing last rendered function');
		}

		if(arguments.length == 1) {
			console.log('[LOG] executing function:');
			arguments[0]();
		}
			

	
		$("#queryOverlay").overlay().close();
	}
	
	
	
}




