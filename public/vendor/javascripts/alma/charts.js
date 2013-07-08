function ChartsHandler(voView){
	var plot_options;
	var $this = this;
	
	this.init = function(){			
		plot_options = {
	    chart: {
	        renderTo: 'chartsContainer',
	        defaultSeriesType: 'column'
	    },
			series: []
		};
	
		$("#plot-x").change(this.renderChart);
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
		data[9] = new Date(data[9]); // Start Date (Datetime)
		//date[10] = date[10]; // PI_NAME (String)
		data[11] = parseFloat(data[11]); // PWV (Float)
		//data[12] = data[12]  //ASDM_UID (String)
		//data[13] = data[13]  //TITLE (String)
		//data[14] = data[14]  //TYPE (String)
		//data[15] = data[15]  //SCAN_INTENT (String)
	
		return data;
	}

	this.renderChart = function(){
		$("#queryOverlay>p").text('loading');
		$("#queryOverlay").overlay().load();
	
	
		var votable_rows_num = voView.renderObject.getFilteredRowsNum();
	
		var votable_categories = voView.renderObject.getColumnNames(),
				selected_category_index = $("#plot-x :selected").val();


		var	plot_options_index = -1;
			
		var data_row, //used to obtain plotta
				previous_source_name,
				current_source_name;
	

		plot_options.series=[];
			
		for (var i = 1; i <= votable_rows_num; i++) {
			data_row = $this.formatData(voView.filterObject.getRowValues(i));

			// get SOURCE_NAME value
			current_source_name = data_row[1]; 
		
			if(i == 1 || current_source_name != last_source_name){					
				plot_options.series.push({
					name: current_source_name, 
					data: [data_row[selected_category_index]]
				});
			
				last_source_name = current_source_name; 
				plot_options_index+=1;
			}else if (current_source_name == last_source_name){
				plot_options.series[plot_options_index]
					.data.push(data_row[selected_category_index])
			}
		}

		var chart = new Highcharts.Chart(plot_options);
		$("#queryOverlay").overlay().close();
	}	
}

