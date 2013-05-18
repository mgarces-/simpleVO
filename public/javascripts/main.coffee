renderTable = (votable) ->
	(new voview({input: {url: votable}, widgetID: "voview_table"})).start();

$ ->
	renderTable("example_input.xml")