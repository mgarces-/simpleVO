renderTable = (votable_url) ->
	(new voview({input: {url: votable_url}, widgetID: "voview_table"})).start();

$ ->
	$("#search_form").submit((e) -> 
		e.preventDefault()
	
		renderTable('https://almascience.nrao.edu/aq/search\?source_name_sesame\=m87\&radius\=0:10:00\&scan_intent-asu\=\=\*TARGET\*\&viewFormat\=asdm\&download\=true')
	)