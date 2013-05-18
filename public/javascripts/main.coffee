renderTable = (votable) ->
	(new voview({input: {url: votable}, widgetID: "voview_table"})).start();


$ ->
	$("#search_btn").submit((e) -> 
		e.preventDefault()
		console.log('Search Button Clicked')
		
		$.ajax({
			url: "/search",
			data: $(this).serialize(),
			dataType: "json",
			success: (data) ->
				console.log('AJAX Success data:'+data)
				renderTable("data")
		})
	)