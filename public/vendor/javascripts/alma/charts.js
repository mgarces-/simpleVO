function ChartsHandler(voView){
	var plot_config;
	var $this = this;
	
	this.init = function(){			
		plot_config = {
	    chart: {
	        renderTo: 'chartsContainer'
	    },
			series: []
		};
	
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

	
		$("#chart_select").change(function(){
			var selected_category = $("#chart_select :selected").val();

			// RA/DEC Scatter Plot
			if(selected_category == 1) $this.renderChart($this.bandsPlot);
			// Band Usage Circle Plot
			if(selected_category == 2) $this.renderChart($this.radecPlot);
		});
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
	
	this.radecPlot = function(){
		// RA = 2, DEC = 3
		
		plot_config.xAxis = {
			title: {
				enable: true,
				text: 'Ra'
			},
			type: 'datetime',
			labels: {
				formatter: function() {
					return Highcharts.dateFormat('%H:%M:%S', this.value);
			  }
			},
			startOnTick: true,
			endOnTick: true,
			showOnLabel: true
		};
		
		plot_config.yAxis = {
			title: {
				text: 'Dec'
			},
			type: 'datetime',
			labels: {
				formatter: function() {
					return Highcharts.dateFormat('%H:%M:%S', this.value);
			  }
			}
		};
		
		plot_config.plotOptions = {
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
					headerFormat: '<b>{series.name}</b><br>',
					pointFormat: '{point.x} RA, {point.y} DEC'
				}
			}
		}
		
				
		var data_length = voView.renderObject.getFilteredRowsNum();
		var data_categories = voView.renderObject.getColumnNames();
		
		var	series_index = -1;
			
		var data_row, 
				previous_source_name,
				current_source_name;
			
		
		for (var i = 1; i <= data_length; i++) {
			data_row = $this.formatData(voView.filterObject.getRowValues(i));
			
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
		
	}

	this.bandsPlot = function (){
		
		
	}


	this.renderChart = function(chart_generator){
		$("#queryOverlay>p").text('loading');
		$("#queryOverlay").overlay().load();

		// clean old data of chartContainer
		plot_config.series=[];
		
		chart_generator();
		
		var chart = new Highcharts.Chart(plot_config);
		$("#queryOverlay").overlay().close();
	}	
}

