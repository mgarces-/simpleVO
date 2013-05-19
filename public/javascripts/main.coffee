displayVOTable = (votable_url) ->
	(new voview({input: {url: votable_url}, widgetID: "voview_table"})).start();

$ ->
	$("#search_form").submit((e) -> 
		e.preventDefault()		
		displayVOTable('/search?'+$(this).serialize())
	)