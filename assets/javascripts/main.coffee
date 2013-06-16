displayVOTable = (votable_url) ->
	(new voview({input: {url: votable_url}, widgetID: "voview_table"})).start()

$ ->
	$('#tabs a').click((e) ->
		e.preventDefault()
		$this = $(this)
		if $this.parent().hasClass('disabled')
			return false
		else
			$this.tab('show')
	)

	$("#search_form").submit((e) ->
		e.preventDefault()
		displayVOTable('/search?'+$(this).serialize())
		$('#tabs li.disabled').removeClass('disabled')
		$('#tabs a[href="#results_tab"]').tab('show')
	)
	
	$('#reset').click( ->
		# clear form
		$('#tabs a[href="#results_tab"],[href="#charts_tab"]').each((tab) ->
			tab.addClass('disabled')
		)
		alert('asd')
	);