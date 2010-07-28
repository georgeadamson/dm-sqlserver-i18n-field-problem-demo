// Common JavaScript code applies across all pages

// Tabs:
// Level 1 tags are those accross the top of the page.
// Level 2 tabs are those down the left hand side.
// Level 3 tabs are those separating the facets of a trip.


if( !window.console ) var console = {}; if( !console.log ) console.log = function(){};

// test:
//window.location.href = 'file:///%5C%5Cselsvr01%5Cdocuments/2010%5CSteppes%20East%5CLetter%5CLetter-de%20Lance-Holmes-Oman%20final.doc-Donna%20Baker.04.03.2010%2010.31.47.doc'


// Note: The test for FIREFOX happens in the parent page. (So it can run even when this script is not compatible with browser)

(function($){

	// Define the jQuery delay() method if not present in this version of jQuery: http://api.jquery.com/delay
	if( !$.fn.delay ){

		$.fn.delay = function(time, type){
			time = $.fx && $.fx.speeds && $.fx.speeds[time] || time || 600;
			type = type || "fx";
			return this.queue(type, function() {
				var elem = this;
				setTimeout(function(){ $.dequeue( elem, type ) }, time);
			});
		};

	}

})(jQuery);



jQuery(function($) {

	// Allow alternative styles because js is enabled:
	$('BODY').removeClass('nojs').addClass('js')


	var guid = 0,											// Used by the jQuery.fn.id() method.
		undefined,											// Speeds up test for undefined variables.
		spinnerTimeoutId,

		UK_COUNTRY_ID					= 6,				// TODO: Find a data-drive way of settings this!

		DOCUMENT_TYPE_ID_FOR_LETTERS	= 8,				// TODO: Find a data-drive way of settings this!

		SYSTEM_ADMIN_LABEL				= 'System admin',
		WEB_REQUESTS_ADMIN_LABEL		= 'Web requests',
		BROCHURE_REQUESTS_ADMIN_LABEL	= 'Brochure requests',
		ALLOW_DOWNLOAD_OF				= { doc:true, pdf:true },
		ELEMENT_URL_ATTR				= 'data-ajax-url',

		// Global ajax timeout:
		AJAX_TIMEOUT					= 30000,			// Milliseconds.

		// Settings for client-search:
		CLIENT_SEARCH_MAX_ROWS			= 15,				// Will be sent as &limit=n parameter when searching for clients via ajax.
		CLIENT_SEARCH_DELAY_BEFORE_AJAX	= 500,				// Slight delay before searching for the keywords being typed in client search box.

		// Settings for postcode-lookup:
		POSTCODE_LOOKUP_MAX_ROWS			= 20,				// Will be sent as &limit=n parameter when searching for postcodes via ajax.
		POSTCODE_LOOKUP_DELAY_BEFORE_AJAX	= 200,				// Slight delay before searching for the keywords being typed in postcode search box.

		// Delay before generating the overview just below the timeline when the Trip Builder tab is opened:
		TIMELINE_DELAY_BEFORE_GENERATE_OVERVIEW	= 3000,

		// Regexes for parsing content from ajax html responses:
		FIND_DATA_CONTENT				= /<!--<DATA>-->([\s\S]*)<!--<\/DATA>-->/,
		FIND_MESSAGE_CONTENT			= /<!--<MESSAGES>-->([\s\S]*)<!--<\/MESSAGES>-->/,

		// Test for "Access to restricted URI denied" (NS_ERROR_DOM_BAD_URI) in error text: (Only Mozilla raises the error. Opera and Chrome just ignore restricted link completely)
		IS_BROWSER_DOC_LINK_SECURITY_ERROR	= /NS_ERROR_DOM_BAD_URI/,

		// Constant to help make code more readable: ( Eg: if( event.button == BUTTON.LEFT )... )
		BUTTON							= { LEFT:0, MIDDLE:1, RIGHT:2 },

		// Horizontal line displayed in some javascript alert() boxes etc:
		MESSAGE_BOX_HR					= new Array(81).join('_'),

		// Settings for displaying notices and error messages:
		DELAY_BEFORE_MESSAGE_SHOW		= 1000,				// Wait before showing messages from server.
		DELAY_BEFORE_MESSAGE_HIDE		= 4000,				// Wait before hiding messages from server, after showing them.
		DURATION_OF_MESSAGE_SHOW		= 250,				// Animation speed when showing messages.
		DURATION_OF_MESSAGE_HIDE		= 2000,				// Animation speed when hiding messages.

		$messages						= $('H2.noticeMessage, H2.errorMessage'),	// See showMessage() function.
		messageTimeoutID				= null,

		// IMPORTANT: These Lookups must match codes in the corresponding TripElementTypes database table!
		lookupTripElementType = { 1:'flight', 2:'flightagent', 4:'accomm', 5:'ground', 8:'misc' },
		
		COMMA							= ',',
		
		KEY = {

			digits			: /[0-9]|[\x60-\x69]/,						// Allows for number-pad digits too.
			integer			: /[0-9]|[\x60-\x69]|[\x6D]/,				// Same as digits but allow minus (-) too.
			'decimal'		: /[0-9]|[\x60-\x69]|[\x6D]|[\xBE\x6E]/,	// Same as digits but allow minus (-) and dot (.) too.
			dot				: /[\xBE\x6E]/,								// Allows for number-pad dot too (AKA period, full-stop).
			comma			: 188,
			minus			: 109,
			tab				: 9,
			enter			: 13,
			backspace		: 8,
			'delete'		: /[\x2E\x90]/,								// Allows for number-pad delete too.
			pageUpDown		: /[\x21-\x22]/,
			pageUp			: 33,
			pageDown		: 34,
			arrows			: /[\x25-\x28]/,
			arrowLeft		: 37,
			arrowUp			: 38,
			arrowRight		: 39,
			arrowDown		: 40,
			end				: 35,
			home			: 36,
			homeEnd			: /[\x23-\x24]/,
			navigation		: /[\x25-\x28]|[\x21-\x22]|[\x23-\x24]/,	// Arrows or PageUp/Down or Home/End
			fkeys			: /[\x70-\x7C]/								// Function keys F1-F13
		};



	// Alias to workaround a typo in callout plugin where it tries to call "corners" plugin instead of "corner":
	$.fn.corners = $.fn.corner;






	// Initialise global ajax settings:

	$.ajaxSetup({

		// Custom callback that fires just before ajax complete: (See customised ajax method in helpers.js)
		beforeComplete : function(xhr, status, options) {

			// Set a custom 'data-ajax-url' attribute on the target element if we have the necessary details:
			if( xhr && xhr.options && xhr.options.target && xhr.options.url ) {
				$(xhr.options.target).attr( ELEMENT_URL_ATTR, xhr.options.url );
			}
			//alert(xhr.options.url )
		},

		// Initialise any new tabs etc in client or trip pages AFTER EVERY AJAX LOAD:
		complete : onAjaxComplete,

		error : function( xhr, status, error ){

			$(document.body).removeClass('waiting-for-ajax');
			console.log( 'AJAX ERROR:', error );

			// Intercept browser error when attempting to open a network file link:
			if( error && IS_BROWSER_DOC_LINK_SECURITY_ERROR.test(error) ){

				alert("Whoopsie! Don't panic. To edit documents on our network you need to:" +
					"\n\n\ - Right-click on the link then " +
					"\n - Click 'Open Link in Local Context  >  in This Tab'" +
					"\n\nWhy? Because of boring browser security restrictions." +
					"\n\nWhat if I don't see those options when I right-click? " +
					"\n - You'll need to add the 'LocalLink' plugin from: " +
					"\n    https://addons.mozilla.org/en-US/firefox/addon/281 ")

				return false

			}else{
			
				if( status == 'timeout' && !xhr.responseText ){
					return false;
				}
			
				var response = xhr.responseText
				//var response = xhr.responseText.split( /<\/?body[^>]*>/i )[1] || xhr.responseText;

				var $errorMessage = $('<h2 class="errorMessage ui-state-highlight ui-corner-all">Uh-oh, something went wrong.<br/>You could copy and paste these nerdy details into a support email: <input type="text"/></h2>');
				$errorMessage.find('>INPUT').val( response );
				
				showMessage($errorMessage);

			}

		},

		// Workaround employing custom comment tags so we can parse the content out of the server response when Firefox on Windows occasionally receives entire page in ajax response! %>
		dataFilter : function(data,type){

			if( ( type == undefined || type == 'html' ) && FIND_DATA_CONTENT.test(data) ){

				// Parse content from between custom <!--<DATA>--> comment tags:
				// Workaround is not working though! jQuery sometimes ignors our parsed data and uses the original responseText data.
				// alert( data.length + ' \n ' + FIND_DATA_CONTENT.exec(data)[1].length + ' \n ' + FIND_DATA_CONTENT.exec(data)[1] )
				return FIND_DATA_CONTENT.exec(data)[1];

			}

			// Typically we just return response as is:
			return data;

		}

		,timeout	: AJAX_TIMEOUT	// Milliseconds

	});



	$(document.body).ajaxComplete(function(e, xhr, settings) {

		$("DIV.ajaxPanel:not(.ajaxPanelBound)").ajaxComplete(function(e, xhr, ajaxOptions) {
			//console.log(ajaxOptions.type,ajaxOptions.url)
			var $target = $(this);

			//alert( "ajaxPanel " + $target.outerHtml() )

		})
		.addClass("ajaxPanelBound");


		// Initialise jQuery UI-theming widget: (In the System Admin > Theme page)
		//$('#ui-theme-switcher:empty').themeswitcher();

	});


	// Display ajax spinner animation during any ajax calls:
	$(document.body)

		// Fires when ajax call starts as long as we're not already waiting for any other ajax responses:
		.ajaxStart(function(){

			$(document.body).addClass('waiting-for-ajax');

		})

		// Fires at the start of every ajax call:
		.ajaxSend(function(){

			// This is a belt and braces fallback for occasions when ajaxStop is not triggered and spinner remains on screen.
			// It will at least disappear after a while! However jQuery still thinks it's waiting for an ajax response so ajaxStart will never fire again.
			window.clearTimeout(spinnerTimeoutId);
			spinnerTimeoutId = window.setTimeout(function(){ $(document.body).removeClass('waiting-for-ajax') }, AJAX_TIMEOUT + 1000 );

		})

		// Fires when ajax call completes and we're not waiting for any more ajax responses:
		.ajaxStop(function(){

			$(document.body).removeClass('waiting-for-ajax');
			window.clearTimeout(spinnerTimeoutId);

		})
	;




	// Automagically hijax all AJAX FORM SUBMITs: (Even those that will be loaded later via ajax)

	$(":submit.ajax, .ajaxPanel :submit").live("click", function(e) {

		// Skip the clever stuff and bail out if the response will be a file to download:
		if( $(this).is('.download') || $(this).is('.ajaxDownload') ){ return }

		var success		= undefined;
		var complete	= onAjaxComplete;
		var $button		= $(this);
		var uiTarget	= $button.attr("rel");
		var ajaxBlank	= $button.is(".ajaxBlank");   // Optional flag to clear form container element after submit.
		var $parent		= $button.parents(".ajaxPanel").eq(0);
		var $form		= $button.closest("FORM");
		var thisForm	= $button.link()			// The link() method is a helper to parse details from a url etc.
		var alreadySucceeded	= false;

		// Attempt to derive target panel from the rel attribute, otherwise search up dom for .ajaxPanel:
		var $uiTarget = uiTarget ? $button.closest(uiTarget).eq(0) : $parent;

		// If we're targeting an ajaxPanel then try deriving the target's id instead if it has one:
		if( ( !uiTarget || uiTarget == '.ajaxPanel' ) && $uiTarget.attr('id') ){
			uiTarget = '#' + $uiTarget.attr('id');
		}

		// DERIVE uiTarget selector if we still don't know it:
		// TODO: Merge this with the previous condition?
		if( !uiTarget ){
			uiTarget = "#" + $uiTarget.id();
		}


		// Before creating new CLIENT or TRIP, prepare custom callbacks to add tabs etc:


		if( thisForm.method == 'post' || thisForm.method == 'put' ){


			// CREATE TRIP:
			if( $button.is('.createTrip') ){

				// These variables are shared by the success & complete callbacks:
				var urlTemplate	= thisForm.url + '/{trip_id}';		// Eg: /clients/12345678/trips/{trip_id}
				var trip_id		= 0;
				var tabLabel	= 'Trip';

				// For some reason, the success-callback was being fired multiple times so instead we just
				// use it to set a flag and then do the clever stuff in the complete-callback instead:
				success = function( data, status, xhr ){

					if( !alreadySucceeded ){

						alreadySucceeded = true;

						var $fields = $(data).find('INPUT:hidden');

						trip_id  = $fields.filter('[name = trip_id]').val();
						tabLabel = $fields.filter('[name = trip_title]').val();

					}

				}

				complete = function( xhr, status ){

					if( alreadySucceeded ){

						var tabUrl   = urlTemplate.replace( '{trip_id}', trip_id );

						// Add new trip tab to the tabs on the left hand side:
						$("UL:visible.clientPageTabsNav").parent().tabs( 'add', tabUrl, tabLabel, 3 );

					};

					onAjaxComplete( xhr, status );

				};

			}


			// CREATE CLIENT:
			else if( $button.is('.createClient') ){

				// These variables are shared by the success & complete callbacks:
				var urlTemplate		= thisForm.url + '/{client_id}';		// Eg: /clients/{client_id}
				var client_id		= 0;
				var tabLabel		= 'Client';

				// For some reason, the success-callback was being fired multiple times so instead we just
				// use it to set a flag and then do the clever stuff in the complete-callback instead:
				success = function( data, status, xhr ){

					if( !alreadySucceeded ){

						var $errorMessages	= $(data).find('.errorMessage');
						var saved_ok		= $errorMessages.length == 0 || $errorMessages.is(':empty');

						if( saved_ok ){

							alreadySucceeded = true;

							var $fields = $(data).find('INPUT:hidden');

							client_id = $fields.filter('[name = client_id]').val();
							tabLabel  = $fields.filter('[name = client_label]').val();

						}else{

							// Server reported validation errors.

						}

					}

				}

				complete = function( xhr, status ){

					if( alreadySucceeded && client_id ){

						var tabUrl		= urlTemplate.replace( '{client_id}', client_id );
						var tabIndex	= $('#pageTabs').tabs( "option", "selected" ) - 1;

						// Add new trip tab to the tabs on the left hand side:
						$('#pageTabs').tabs( 'add', tabUrl, tabLabel, 1 );

					};

					onAjaxComplete( xhr, status );

				};

			}


		}


		$form.ajaxSubmit({
			target		: uiTarget,
			success		: success,
			complete	: complete
		});

		return false;

	});



	// "auto-submit" is used submit the form when user selects a new item in a pick list:
	$('SELECT.auto-submit').live('change', function(){

		var $form		= $(this).parents("FORM").eq(0);
		var $submit		= $form.find('INPUT:submit').eq(0);
		var uiTarget	= $submit.attr("rel");
		var ajaxBlank	= $submit.is(".ajaxBlank");   // Optional flag to clear form container element after submit.
		var $parent		= $form.parents(".ajaxPanel").eq(0);
		var thisForm	= $submit.link()			// The link() method is a helper to parse details from a url etc.

		// Attempt to derive target panel from the rel attribute, otherwise search up dom for .ajaxPanel:
		var $uiTarget = uiTarget ? $submit.closest(uiTarget).eq(0) : $parent;

		// Derive uiTarget selector if we still don't know it:
		if( !uiTarget && $uiTarget.attr("id") ) uiTarget = "#" + $uiTarget.id();


		$form.ajaxSubmit({
			target		: uiTarget
			//success		: success,
			//complete	: complete
		});
		
	
	});



	// Called when any ajax calls complete:
	function onAjaxComplete(xhr, status, options) {

		var isHtml		= /^\s*\</;				// var isJson = /^\s*[\[\{]/;
		var findFormUrl	= / action="([^"]*)"/;

		// Only update UI elements if response is html:
		if( xhr && xhr.responseText && isHtml.test(xhr.responseText) ){

			// Derive a handy hash of url info kinda like window.location on steroids:
			// (Extract <form action="url"> using a regex because some responseText can be too big or complex for jQuery to parse)
			var formAction	= ( findFormUrl.exec(xhr.responseText) || [] )[1];
			var url			= parseUrl( formAction );
			var target		= xhr && xhr.options && xhr.options.target;
			var $target		= undefined;
			
			if( target ){ $target = $(target) }

			initLevel2Tabs_forClient($target);
			initLevel3Tabs_forTrip($target);
			initLevel2Tabs_forSysAdmin($target);
			initFormAccordions($target);
			initFormTabs($target);	// Eg: countriesTabs on Trip Summary page.
			initSpinboxes($target);
			initDatepickers($target);
			initPostcodeSearch($target);
			initMVC($target);
			triggerTripInvoiceFormChange();

			// Display any user-feedback messages found in the response:
			// (Extract message elements using a regex because some responseText can be too big or complex for jQuery to parse)
			var messagesFragment = ( FIND_MESSAGE_CONTENT.exec(xhr.responseText) || [] )[1];
			if( messagesFragment ){
				var $newMessages	 = $(messagesFragment).closest(".noticeMessage, .errorMessage");
				showMessage( $newMessages );
			}

			// TRIP ELEMENTs: Derive trip_element.id from the form url and refresh the element in the timeline:
			if( url.resource.trip_element ) {

//				var elemId			= url.resource.trip_element;
//				var elemIdFieldName = "trip_element[id]";
//				//var elemClass	 = elemIdFieldName + "=" + elemId;   // Eg: class="trip_element[id]=123456"
//				//	elemClass	 = elemClass.replace(/([\[\]\=])/g,"\\$1")
//				//var $timelineElem = $("LI." + elemClass);
//				var $timelineElem = $("INPUT:hidden[value='" + elemId + "'][name='trip_element[id]']").parents("LI.tripElement:first");

//				$timelineElem.reload(function() {
//					// Refresh timeline overview after ajax reload:
//					//$('DIV.timelineContent:visible').timelineOverview();
//				}, true);

			}


			// Check for a message from the server telling us to OPEN A CLIENT TAB for the specified client:
			if( $target && $target.length ){
			
				// Look for <input name="client_id" class="showClient" value="123456">
				$target.find('INPUT[name=client_id][value].showClient').each(function(){

					var client_id	 = $(this).val();									  // This extra search simple allows for when the field has been carelessly rendered in a <div class="formField">
					var client_label = $(this).siblings('INPUT[name=client_label]').val() || $(this).parent().siblings().children('INPUT[name=client_label]').val();

					openClientTab( client_id, client_label );

				});
			
			}
			
		}

	};





	// Initialise tabs:

		initLevel1Tabs_forPage(); // In turn this triggers initLevel2Tabs_forClient();
		initLevel2Tabs_forSysAdmin();

		$('#recentClients.tabs').tabs();


	// Initialise accordions:

		initFormAccordions();


	// Initialise Spinbox fields:

		initSpinboxes();




	// Initialise "mailto" links, including those next to an email textbox:

	$("xINPUT.mailto").prev("LABEL:not(:has(A:href))").each(function() {
		var $elem = $(this).next("INPUT.mailto");
		mailto = "mailto:" + ($elem.data("mailto") || $elem.attr("mailto") || $elem.val());
		$("<a>").attr({ href: mailto }).addClass("mailto").text(mailto).appendTo(this);
	});



// Initialise DATEPICKERs:

	initDatepickers();


// Initialise calculated fields etc:

	initMVC();	// Depricated

	initKeyPressFilters();

	initTripElementFormTotals();

	initTripInvoiceFormTotals();







// React to any "add NEW TRIP" links:

	$("A[href *= '/trips/new']").live('click', function() {

		var url		= $(this).attr('href');
		var newId	= '#' + url.replace('/', '');

		var $lhsTabs = $('UL:visible.clientPageTabsNav').parents('.ui-tabs:first');
		
		// Open the "New trip" tab: (The last one on the left hand side)
		if( $lhsTabs.length > 0 ){
			var newTripTabIndex = $lhsTabs.tabs('length') - 1;
			$lhsTabs.tabs( 'select', newTripTabIndex );
		}

		return false;
	});



// React to any "add NEW CLIENT" links:

	$("A[href *= '/clients/new']").live('click', function() {

		var url = $(this).attr('href');
		var newId = '#' + url.replace('/', '');

		$('#pageTabs').tabs('add', url, 'New client');

		return false;
	});



// React to any "OPEN CLIENT" links: (Eg: <a href="/clients/1234">)

	$("A:resource(/clients/[0-9]+), OPTION:resource(/clients/[0-9]+)").live('click', function() {
	//$("A[href *= '/clients/'], OPTION[value *= '/clients/']").live("click", function() {
	//$("A:regex(href,clients\\/[0-9]+$), OPTION:regex(value,clients\\/[0-9]+$)").live("click", function() {

		var url = $(this).attr("href") || $(this).val(); //url = "/clients/2/trips/3/edit?label=Mrs+K+Adamson#bm"
		var location = parseUrl(url);
		var resource = location.resource;

		if (resource.client && resource.client === resource.last && !location.action) {

			var id = location.resource.client;
			var label = location.params.label;

			openClientTab(id, label);
			return false;
		};

	});



// React to any "SHOW MORE..." option in pick lists:
// Simply fetch new list items from the specified url into the list:
// Eg: <option value="/suppliers/?list=option&type_id=4">+ Show more...</option>

	$("OPTION[value *= 'list=option']").live('click', function(){

		var $item	= $(this).text('Fetching more...');
		var url		= $item.val();

		// Load the new <option> items into the list and delete the "Show more" item:
		// Notice we use get() and append() instead of load() because we don't want to lose any existing list items.
		$.get( url, function(data){
			$item.closest('SELECT').append(data).end().remove();
		})

	});





// React to any link to open SYSTEM ADMIN page:

	$("A[href $= /system]").live("click", function() {

		existingTabIdx = $('#pageTabs > .sectionHead LI:contains(' + SYSTEM_ADMIN_LABEL + ')').prevAll("LI").length;

		if (existingTabIdx) {

			// System tab is already open, so select it:
			$("#pageTabs").tabs("select", existingTabIdx);

		} else {

			// Add a new tab for system admin:
			var lastButOne = $("#pageTabs").tabs('length') - 1;
			$("#pageTabs").tabs('add', '/system', SYSTEM_ADMIN_LABEL, lastButOne);
		}

		return false;

	});


// React to any link to open WEB REQUESTS page:

	$("A[href $= /web_requests]").live("click", function() {

		existingTabIdx = $('#pageTabs > .sectionHead LI:contains(' + WEB_REQUESTS_ADMIN_LABEL + ')').prevAll("LI").length;

		if (existingTabIdx) {

			// Web requests tab is already open, so select it:
			$("#pageTabs").tabs("load", existingTabIdx);

		} else {

			// Add a new tab for Web requests admin:
			var lastButOne = $("#pageTabs").tabs('length') - 1;
			$("#pageTabs").tabs('add', '/web_requests', WEB_REQUESTS_ADMIN_LABEL, lastButOne);
		}

		return false;

	});


// React to any link to open BROCHURE REQUESTS (aka Brochure merge) page:
// Eg: http://database2:82/brochure_requests?brochure_merge=true

	$("A[href *= /brochure_requests][href *= 'brochure_merge=true']").live("click", function() {

		existingTabIdx = $('#pageTabs > .sectionHead LI:contains(' + BROCHURE_REQUESTS_ADMIN_LABEL + ')').prevAll("LI").length;

		if (existingTabIdx) {

			// Web requests tab is already open, so select it:
			$("#pageTabs").tabs("load", existingTabIdx);

		} else {

			// Add a new tab for Brochure Requests admin:
			var lastButOne = $("#pageTabs").tabs('length') - 1;
			$("#pageTabs").tabs('add', $(this).attr('href'), BROCHURE_REQUESTS_ADMIN_LABEL, lastButOne);
		}

		return false;

	});



// React to any link to create a LETTER document:

//	$("SELECT.create-letter OPTION[value]").live('click', function(){

//		var params = {
//			document_template_file	: $(this).val(),
//			document_type_id		: DOCUMENT_TYPE_ID_FOR_LETTERS

//		$.post('/documents')
//		
//		return false;

//	});




// Initialise AJAX form links: (For hijaxing "Add new" and "Edit" links that have rel="#someElementID")
// TODO: Handle keyboard access on lists!
// TODO: Depricate our custom href attribute in favour of more compliant data-href attribute.

	$('A.ajax, .ajaxPanel A, SELECT[data-href] OPTION, SELECT[href] OPTION').live('click', function(e) {

		var $link	= $(this);
		var $list	= undefined;

		// Some links should not be interfered with so bail out if necessary:
		if( $link.is('.noajax, .scrollTo, [href^=mailto], [rel*=document]') || $link.parents().is('UL.ui-tabs-nav') || e.altKey || e.button == BUTTON.RIGHT ){
			return;
		}

		// Some links should not be left-clicked so bail out and cancel the event:
		if( $link.is('.right-click') && e.button == BUTTON.LEFT ){
			return false;
		}

		// Clicked element is usually <a href="url" rel="#elementid"> ...
		var url			= $link.attr('href') || '';
		var uiTarget	= $link.attr('rel' ) || '';

		// ...but it might be something like <option value="url"> or
		// <select href="/suppliers/{value}/edit"><option value="123">...
		// This technique also allows for placeholders in the url, eg: '/clients/{value}'
		if ( $link.is('OPTION') ){
			$list		= $link.parents('SELECT');
			uiTarget	= uiTarget || $list.attr('rel') || $list.attr('data-rel');
			url			= url || $list.attr('data-href') || $list.attr('href') || $link.val();
			url			= url.replace( '{value}', $link.val() ).replace( '{text}', $link.text() );
		}

		// TODO: Merge & refactor this uiTarget derivation with the similar code in the submit handler.

		// TODO: Find out why this caused trip_element cancel button to try to leave the page
		//	// If we're targeting an ajaxPanel then try deriving the target's id instead if it has one:
		//	if ( ( !uiTarget || uiTarget == '.ajaxPanel' ) && $uiTarget.attr('id') ){
		//		uiTarget = '#' + $uiTarget.attr('id');
		//	}

		// If target is .ajaxPanel then find parent ajaxPanel, otherwise search for closest match:
		if ( !uiTarget || uiTarget == '.ajaxPanel' ){
			var $uiTarget = $link.parents('.ajaxPanel');
		}else{
			var $uiTarget = $link.cousins(uiTarget, true);
		}

		// Only use the first target we found, unless selector begins with * :
		if (!uiTarget || uiTarget.charAt(0) !== '*'){
			$uiTarget = $uiTarget.eq(0);
		}

		// If $uiTarget has an id then ensure uiTarget refers to it's id to me more specific:
		//if (!uiTarget && $uiTarget.attr("id")) uiTarget = '#' + $uiTarget.attr('id');

		// Assign unique id to the element if it does not already have one: (Using our custom jQuery id() method)
		if ( !uiTarget || uiTarget.charAt(0) !== '#' ){
			uiTarget = '#' + $uiTarget.id();
		}


		// Specific handler for IMAGESELECTOR links to open popup:
		if (uiTarget == "#imageSelector") {

			var $this = $(this);

			$(this).qtip({
				content: {
					url: this.href,
					data: { country_id: 2 }
				},
				show: {
					ready: true,
					solo: true,
					when: { event: "click" }
				},
				hide: {
					fixed: true,
					when: { event: "unfocus" }
				},
				style: {
					name: "dark",
					width: 520,
					tip: "bottomLeft"
				},
				position: {
					corner: {
						target: "topMiddle",
						tooltip: "bottomLeft"
					},
					adjust: {
						y: 30
					}
				},
				api: {
					onHide: function() { $this.qtip('destroy') }
				}
			});


		// Generic handler for all AJAX CANCEL buttons on forms: (Eg when user clicks Cancel on "/clients/new" form)
		} else if( $link.is('.ajaxCancel') ) {

			// Assume link to Edit page if form's url ends with /id ?
			var formUrl		= $link.parents('FORM').attr('action');
			var formMethod	= $link.parents('FORM').attr('method');
			var wasEdit		= (formMethod === 'post');	  //  /\/([0-9]+)$/.test(formUrl);

			// "A.ajaxCancel.ajaxBlank" means simply clear the contents of $uiTarget:
			if ( $link.is('.ajaxBlank') ) {

				$uiTarget.animate({ height: 'hide', opacity: 0 }, 'slow', function() { $(this).empty(); });

				// Close EDIT form by loading the target url:
			} else if (wasEdit) {

				$uiTarget.load(url);

				// Close NEW form by selecting first tab in the containing tabs and discarding the 'new' tab:
			} else {

				$tabs = $("A[href='" + uiTarget + "']").parents('.ui-tabs:first');
				var selected = $tabs.tabs('option', 'selected');
				$tabs.tabs('remove', selected);

			};


		// Generic handler for other ajax links that have a REL attribute #target or are contained within an ajaxPanel:
		} else if( $uiTarget.length ) {

			var params		= { uiTarget: uiTarget };
			var do_post		= /_method=POST/i.test(url);
			var no_callback	= $link.is('.no-callback') || ( $list && $list.is('.no-callback') );

			var callback	= no_callback ? undefined : function(responseText, status, xhr) {

				// Custom animation for TripElements form ONLY:
				$uiTarget.filter('.tripElementFormContainer').animate({ height: 'show', opacity: 1 }, 'slow');

				// When content loads, set rel target on all links that don't already have a target:
				$uiTarget.find('A, :submit').not('[rel]').attr({ rel: uiTarget }).addClass('ajax');

				initLevel3Tabs_forTrip($uiTarget);
				initFormAccordions($uiTarget);
				initSpinboxes($uiTarget);
				initDatepickers($uiTarget);
				initPostcodeSearch($uiTarget);
				initMVC($uiTarget);

				// TODO: checkboxList style and testing:
				//$uiTarget.find( 'SELECT[multiple]' ).checkboxList();

			};


			// Special action for POST, otherwise assume we're doing a GET:
			if( do_post ){
			
				$.post(url, params, callback);

			}else{

				$uiTarget.load(url, params, callback);

			}

			// Custom animation for TripElements form ONLY: (while the ajax is loading)
			$uiTarget.filter(".tripElementFormContainer").animate({ height: "hide", opacity: 0 }, "slow");
		}

		// else $.get(this.href);

		return false;
	});





	// Handler for click on checkboxes in a checkbox list: (Eg: name="trip[countries_ids][]" )
	$(":checkbox[name *= '_ids' ]").live('click', function(){

		var $checkbox		= $(this),
			value			= $checkbox.val(),
			name			= $checkbox.attr('name'),
			$tabPanel		= $checkbox.closest('DIV.ui-tabs-panel'),	// This tab's content panel.
			$tabContainer	= $tabPanel.closest('DIV.ui-tabs');			// Tabs container element.

		// Un/tick the corresponding checkbox if there is one in another tab:
		var $otherCheckbox = $tabContainer
			.find(":checkbox[name='" + name + "'][value='" + value + "']")
			.not( $checkbox )
			.attr({ checked: $checkbox.attr('checked') });

		// Add a copy of the checkbox to the summary tab if there isn't one already:
		if( $otherCheckbox.length == 0 && !$tabPanel.is('.countriesSelected') ){

			$checkbox.closest('LI').clone()
				.appendTo( $tabContainer.find('DIV.countriesSelected UL.checkboxList') );
		
		}

	});





	// ???
	function onAjaxFormLoaded() {
		$("#bannerTarget").callout({
			className: "bannerCallout",
			arrowHeight: 20,
			arrowInset: 40,
			cornerRadius: 15,
			width: 700,
			content: "#imageEditor"
		});
	};






	// Initialise hash of helper callbacks for the autocomplete plugin:

	var autocomplete_helpers = {


		// Parse json as soon as it loads, to rearrange results as array of objects each with {data, value, result} attributes for autocompleter. More info: http://blog.schuager.com/2008/09/jquery-autocomplete-json-apsnet-mvc.html
		// TODO: Depricate this by beefing up the json preparation on the server.
		parseItems : function(rows) {

			return $.map(rows, function(client) {

				// Ensure missing fields are at least represented as blanks:
				// Set up a more friendly alias for active_trips and derive fullname & shortname if not provided in the json:
				// Note: client.shortname is used later to label the client tabs.
				if( !client.title		){ client.title		= '' };
				if( !client.forename	){ client.forename	= '' };
				if( !client.name		){ client.name		= '(no name)' };
				if( !client.trips		){ client.trips		= client.active_trips };
				if( !client.fullname	){ client.fullname  = [ client.title, client.forename, client.name ].join(' ') };
				if( !client.shortname	){ client.shortname = [ client.title, client.forename.charAt(0), client.name ].join(' ') };

				return { data: client, value: client.name, result: client.name };

			});

		},


		// Generate html for each item in the json data: (Arguments: json-object, row-index, number-of-rows, query-string)
		formatItem : function(client, row, count, q) {

			var address  = [], email = [], addr = client.address, tripSummary = 'Trips: ' + client.trips_statement;

			// Prepare the address lines, leaving out any that are blank:
			if( addr ){

				// Give postcode field a little extra formatting to stop it splitting across lines: 
				if( addr.postcode ){ addr.postcode = '<strong>' + addr.postcode.split(/\s+/).join('&nbsp;') + '</strong>' };

				$( 'address1 address2 address3 address4 address5 postcode country'.split(' ') ).each(function(i,field){
					if( addr[field] ){ address.push( addr[field] ) }
				});

			}

			// Email addresses:
			if( client.email1 ){ email.push(client.email1) }
			if( client.email2 ){ email.push(client.email2) }

			// Assemble html for the item: (Using native javascript for best performance)
			var html = [
				//'<li>',
					'<div class="name ui-icon ui-icon-client">',	client.fullname,	'</div>',
					'<div class="address">',						address.join(', '),	'</div>',
					'<div><small class="email">',					email.join(', '),	'</small></div>',
					'<div class="trips"><small>',					tripSummary,		'</small></div>'
				//'</li>'
			];

			return html.join(' ');

		}

	};





	// Initialise autocomplete: (Main search box at top of page)

	$("#mainSearchText").autocomplete("/search", {

		max					: CLIENT_SEARCH_MAX_ROWS,
		delay				: CLIENT_SEARCH_DELAY_BEFORE_AJAX,
		//extraParams		: { user_id: $("#user_id").val() || 0 },
		//autoFill			: true,		// Works but hard to know which field to match and show.
		//mustMatch			: true,
		cacheLength			: 1,		// This simply allows the current results to stay in memory so double-click does not trigger re-search.
		minChars			: 3,
		matchContains		: false,
		matchSubset			: false,
		multiple			: false,
		multipleSeparator	: ",",
		dataType			: "json",
		scrollHeight		: 400,
		width				: 576,
		offsetLeft			: -300,
		//highlight		   : function(val,q){ return tag("em",val); },

		// Parse json as soon as it loads, to rearrange results as array of objects each with {data, value, result} attributes for autocompleter. More info: http://blog.schuager.com/2008/09/jquery-autocomplete-json-apsnet-mvc.html
		parse: autocomplete_helpers.parseItems,

		// Generate html for each item in the json data: (json-object, row-index, number-of-rows, query-string)
		formatItem: autocomplete_helpers.formatItem,

		//useFormatItemAsIs : true,	// Custom enhancement: Tells plugin that result of formatItem is already wrapped in <li> tags.

		// ???:
		formatMatch: function(data, i, n, q) { // i=row index, n=number of rows, q=query string
			return data.postcode;

		},

		// Formats the value displayed in the textbox:
		formatResult: function(data, i, n, q) { // i=row index, n=number of rows, q=query string

			return data.postcode;

		}
	})

	// Respond to user's selection in the search results:
	.result(function(e, client) {

		openClientTab(client.id, client.shortname);

	});





	// General: Highlight textboxes when they receive FOCUS. Highlight first on page by default:
	// (We use Event Capture or Event Delegation so we don't have to re-bind after every ajax call)

	if (window.addEventListener) {

		// Use Event Capture in MOZILLA: (Because it has no focus or focusin event that bubbles)
		window.addEventListener('focus', function(e) {  //window.captureEvents(Event.FOCUS)
			$(e.target).filter("INPUT:text,INPUT:password,TEXTAREA").not('[readonly]').each(function() { this.select() });
		}, true);   // <-- This flag ensures we use Event Capture.

		$("A,SELECT,INPUT,TEXTAREA", "#pageContent").filter(":visible:first").focus();

	} else {

		// Use Event Delegation in IE: (The focusin event will bubble)
		$("A,SELECT,INPUT,TEXTAREA", "#pageContent").filter("INPUT:text,INPUT:password,TEXTAREA").not('[readonly]')
			.live("focusin", function() { this.select() })
		.end()
		.filter(":visible:first").focus();

	};







	// React to scrolling on timelineContent area: TODO:

	$("DIV.timelineContent").bind("scroll", function(e) {
		var pos = $(this).attr("scrollLeft");
		var range = $(this).attr("scrollWidth") - $(this).width();
		var percent = round(100 * pos / range, 2);
		//console.log( percent, $(this).attr("scrollLeft"), $(this).width(), $(this).attr("scrollWidth"), $(this).attr("scrollLeft") + $(this).width() )
	});









	// Handle events on the new/edit photo popup:

	$("SELECT.imgFilename").live("change", onImgFileChange).triggerHandler("change");
	$("SELECT.imgFilename").live("keyup", onImgFileChange);
	$("SELECT.imgFolder").live("change", onImgFolderChange);
	$("SELECT.imgFolder").live("keyup", onImgFolderChange);

	// Respond when user chooses a different IMAGE FOLDER:
	function onImgFolderChange() {

		var companyFolder = $(this).val();
		var params = "list=files&folder=" + companyFolder;

		$(this).parents("DIV.imgFileSelector")
			.find("DIV.imgFilenameList SELECT")
			  .load("/photos OPTGROUP", params, onAfterAjax)
			  .empty().append("<option>Hang on mo...")
			.end()
			.find("DIV.imgFilenameList").addClass("waiting");

		function onAfterAjax() {
			$(this).parents("DIV.imgFileSelector")
			  .find("DIV.imgFilenameList").removeClass("waiting");

			if ($(this).children().length == 0)
				$(this).append("<option>Oops, none in here!");
		}
	};

	// Respond when user chooses a different IMAGE FILENAME:
	function onImgFileChange() {

		var $div = $(this).parents("DIV.imgFileSelector");
		var root = "imageLibrary";
		var companyFolder = "/" + $div.find(".companyFolder").val();
		var imgFolder = "/" + $div.find("SELECT.imgFolder").val();
		var filename = $(this).val();
		var url = "/" + buildPath(root, companyFolder, imgFolder, filename);
		console.log(url);

		$div.find("IMG.imgThumbnail")
			  .attr({ src: url, title: url })
			  .imgSize(onReadImgSize);  // jQuery plugin to measure IMG dimensions.

		function onReadImgSize(size) {
			var dimensions = size.width + " x " + size.height + " px";
			$(this).siblings(".imgFileSize").text(dimensions);
		}

	};




	// Respond to selection of tripElementTypeId in a TripElement form:
	// This allows the css to display only fields that are relevent to the TripElementType (Eg: .isFlight will reveal all fields flagged with .whenFlight)
	// UNUSED IN LIVE environment because the trip_element[element_type_id] field is hidden.
	function onTripElementTypeChange() {

		// Derive array of TripElementType names formatted as css classnames suitable for the form element:
		var elementType = lookupTripElementType[$(this).val()], formClasses = [];
		$.each(lookupTripElementType, function(id, type) {
			formClasses.push(formClassFor(type))
		});

		// Change the "isType" classname of the TripElement form:
		$(this).parents(".tripElementForm")
			.removeClass(formClasses.join(' '))
			.addClass(formClassFor(elementType));

		// Helper to derive form css class name from elementType: (Eg: formClassFor("flight") --> "isFlight")
		function formClassFor(classname) {
			return "is" + classname.substr(0, 1).toUpperCase() + classname.substr(1);
		}

	};

	$(".tripElementForm SELECT.tripElementTypeId")
		.live("click", onTripElementTypeChange)
		.live("keyup", onTripElementTypeChange);



	// Respond to click on tripElement is_subgroup checkbox: (AKA: "Not for everyone" or "Not all travellers")
	$(".tripElementForm INPUT:checkbox[name='trip_element[is_subgroup]']")
		.live("click", function() {
			$(this).parents(".tripElementForm")
				.toggleClass("allTravellers", !$(this).is(":checked"));
		});










	// Apply <textarea> maxlength restrictor plugin:

	$('TEXTAREA')
		.textareaMaxlength({ maxlength:1000 })


		// Apply textareaResizer plugin: (Work in progress!)
		.filter('.resizable')
			.textareaResizer();




	// Set up rules for selections in checkbox lists:	$(":checkbox:visible[name *= 'is_primary']")		.checkboxLimit({ associates: ":checkbox:visible[name *= 'is_primary']", min:1, toggle:true } );	$(":checkbox:visible[name *= 'is_invoicable']")		.checkboxLimit({ associates: ":checkbox:visible[name *= 'is_invoicable']", min:1, toggle:true });
	$(':checkbox').live('checkboxMinLimit', function(){ alert(1) })
	



	// Show system notifications when page loads then hide them after a delay:
	showMessage( $messages );













	// Helper to show SYSTEM MESSAGES etc then hide them after a delay:
	// The $newMessages argument contains a jQuery array of zero or more <h2> elements like these:
	//	<h2 class="noticeMessage ui-state-highlight ui-corner-all" style="display:none">Authenticated Successfully</h2>
	//	<h2 class="errorMessage ui-state-highlight ui-corner-all"  style="display:none"></h2>
	function showMessage( $newMessages ){

		window.setTimeout(function(){

			// Show system notifications etc then hide them after a delay:
			$newMessages.hide().not(':empty').each(function(){

				// When mouse moves over the message then prevent it from hiding after timeout.
				$(this).hover(function(){

					window.clearTimeout(messageTimeoutID);
					
					$(this).stop(true).animate( { opacity:1 }, 'fast' );

				// Reinstate timeout when mouse moves off the message:
				},function(){

					var $msg = $(this);
					messageTimeoutID = window.setTimeout(function() {
						//$msg.animate( { opacity:'hide' }, DURATION_OF_MESSAGE_HIDE, function(){
						//	$(this).slideUp( DURATION_OF_MESSAGE_HIDE, function(){ $(this).remove() } )
						//} )
						$msg.animate( { opacity:'hide' }, DURATION_OF_MESSAGE_HIDE )
							.slideUp( DURATION_OF_MESSAGE_HIDE, function(){
								$(this).remove()
							})
						;
					}, DELAY_BEFORE_MESSAGE_HIDE);

				})
				.appendTo('#messages')
				.trigger('mouseleave')
				.animate( { height:'show', opacity:'show' }, DURATION_OF_MESSAGE_SHOW );

			});

		}, DELAY_BEFORE_MESSAGE_SHOW);

	};




	// Helper to OPEN CLIENT TAB for a specified client id: (Expects client-id and tab-label as arguments)
	function openClientTab(id, label) {

		if( id && parseInt(id) > 0 ){

			existingTabIdx = $("#pageTabs > .sectionHead LI:has( INPUT.client-id[value='" + id + "'] )").prevAll("LI").length;

			if (existingTabIdx) {

				// There is already a tab displayed for this client, so select it:
				$("#pageTabs").tabs("select", existingTabIdx);

			} else {

				// Workaround when spaces have been escaped as '+' in a client link:
				label = ( label || 'Oops missing label!' ).replace( /\+/g, ' ' );

				var url		= "/clients/" + id,
					name	= label + '<input type="hidden" value="' + id + '" class="client-id" />';

				// Add a new tab for this client:
				$("#pageTabs").tabs('add', url, name);

			}
			
		}else{
			console.log( 'Unable to openClientTab(', id, COMMA, label, ')' );
		}
	}



	// Helper for initialising the TOP-LEVEL TABS: (Dashboard and clients)
	function initLevel1Tabs_forPage(context) {

		$( '#pageTabs', context ).tabs({

			cache			: false,
			tabTemplate		: '<li><a href="#{href}"><span>#{label}</span></a><a href="#{href}/close" class="close-tab">x</a></li>',
			panelTemplate	: '<div class="sectionBody ajaxPanel clientPageContainer"></div>',
			tabsSelector	: '>UL:first, >DIV:first>UL:first',	// This is a custom option. See modified ui.tabs.js script for details.

			// When a new tab is added, open it immediately: (The server will track every client opened by a user)
			add		: function(e,uiTab) {
				$(this).tabs('select', uiTab.index);
			},

			// Let the server know which client is in the foreground: (So it can be the default tab next time)
			show	: function(e,uiTab){
				var url = $.data(uiTab.tab, 'load.tabs');
				if( url && url.indexOf('clients/') >= 0 ) $.get( url + '/select' );
			},

			// When client tab is closed, let server know which client is no longer being worked on: (So it won't be reopened next time)
			// Note: The click on the CLOSE link in each tab is handled by a live('click') handler set up below.
			remove	: function(e,uiTab){
				var url = $(uiTab.tab).siblings('A.close-tab').attr('href');
				if( url && url.indexOf('clients/') >= 0 ){ $.get(url) }
			}
		})

		// Respond to click on a CLOSE link in a tab: (Assumes tab being closed is the currently selected tab)
		.find("#pageTabsNav A.close-tab").live("click", function(){
			try{
				var index = $('#pageTabs').tabs('option','selected');
				if( index ) $('#pageTabs').tabs('remove',index);
			}
			catch(e){}
			finally{ return false }
		});

		

	};



	// Helper for initialiasing the LEFT-HAND TABS on each client page: (Client details, documents, payments and trips)
	function initLevel2Tabs_forClient(context) {

		$( 'UL:visible.clientPageTabsNav', context ).parent().tabs({	// (See http://jqueryui.com/demos/tabs)

			cache			: false,
			fx				: { opacity: 'toggle', duration: 100 },
			//tabTemplate		: '<div class="trip trip-unconfirmed"></div>',								// Only ever used when creating trips.
			tabTemplate		: '<li class="trip trip-unconfirmed"><a href="#{href}">#{label}</a></li>',					// Only ever used when creating trips.
			panelTemplate	: '<div class="sectionBody ajaxPanel clientSubPageContainer"></div>',		// Only ever used when creating trips.
			panelsSelector	: function() { return this.list.cousins('.clientPageTabsContent > *') },	// This is a custom option. See modified ui.tabs.js script for details.


			// When a new tab is added, open it immediately:
			add		: function(e, uiTab) {

				$(this).tabs('select', uiTab.index);

			},

			// When a tab is opened, initialise it's content:
			show	: function(e, ui) {

				if( $(ui.tab).is('.new') ){
					initFormTabs( ui.panel );
				}

			}

		});
	};


	// Helper for initialiasing the TRIP'S TABS on each trip page: (Trip summary, builder, itinerary etc)
	function initLevel3Tabs_forTrip(context) {

		// TODO: Find out why we need eq(0) to work around multiple tab loads. Seems to be a recursive problem. 
		$( 'UL.tripPageTabsNav', context ).parent().eq(0).tabs({	// (See http://jqueryui.com/demos/tabs)

			cache			: false,
			panelTemplate	: '<div class="ajaxPanel sectionContainer noSectionHead"></div>',
			panelsSelector	: function() { return this.list.cousins(".tripPageTabsContent > *") },	// This is a custom option. See modified ui.tabs.js script for details.

			// Init content when Trip tabs are opened:
			show	: function(e,ui) {

				switch( ui.index ){

					case 0 :	// Trip summary tab
					
						$(ui.panel).find("UL.tripCountriesTabsNav").parent().tabs({
							selected: 0
						});

						// Activate the trip_clients search box in this tab panel:
						initTripClientSearch(ui.panel);

						// Important: The trip_clients checkboxes in this tab panel are enhanced by the checkboxLimit() plugin.
						break;

					case 1 :	// Trip builder tab

						// Build timeline overview (after allowing for some rendering delays!):
						window.setTimeout(function() {

							$( 'DIV.timelineContent', ui.panel ).timelineOverview();

						}, TIMELINE_DELAY_BEFORE_GENERATE_OVERVIEW);

						break;

				}

			}
		});
	};


	// Helper for initialiasing the SYSTEM ADMIN TABS on the sys-admin page:
	function initLevel2Tabs_forSysAdmin(context) {

		$( 'UL:visible.sysAdminTabsNav', context ).parent().tabs({	// (See http://jqueryui.com/demos/tabs)

			//selected		: 0,
			fx				: { opacity: 'toggle', duration: 200 },
			panelTemplate	: '<div class="sectionBody ajaxPanel"></div>',
			panelsSelector	: function() { return $('#sysAdminTabsContent > *') },	// This is a custom option. See modified ui.tabs.js script for details.

			// When a new tab is added, open it immediately:
			add : function(e, tab) {
				$(this).tabs('select', '#'+tab.panel.id);
			}
			
			//,show	: function(e,ui) {
			//	$( 'SELECT[multiple]', ui.panel ).checkboxList();
			//}
		});
	};



	// Helper for initialiasing the MINOR TABS within some pages:
	function initFormTabs(context) {

		$( 'UL:visible.countryTabs', context ).parent().tabs({	// (See http://jqueryui.com/demos/tabs)

			// This is vital so ticked boxes are not discarded when user switches between country tabs!
			cache			: true,

			panelTemplate	: '<div class="countryTabsPanel"></div>',

			// Wrap all the loaded <li> tags in a <ul> element:
			load			: function(e,ui){
				$(ui.panel).children('LI').wrapAll('<ul class="checkboxList columns ellipsis"></ul>')
			}

		});
	};



	// Helper to activate any accordions:
	function initFormAccordions() {

		//window.setTimeout(function(){

			$("DL.accordion")

				.filter(".fixedHeight").accordion({
					autoHeight: false
				})
				.end()
				.not(".fixedHeight").accordion({
					autoHeight: false
					//fillSpace	: true
				})
			;
		
		//},500);	// Not proud of this! A workaround (when autoHeight:true) because sometimes the content (DDs) of the client summary accordions have no height.

	};


// Helper to activate any datepickers:
function initDatepickers() {

	$("INPUT.date")

		//.filter(":not(.daterange)")
		.datepicker({
			closeText: "Cancel",
			dateFormat: "dd/mm/yy",
			minDate: "-90y",
			maxDate: "+3y",
			//numberOfMonths  : 2,
			showButtonPanel: true,
			showOtherMonths: false,
			changeYear: true,
			changeMonth: true,
			yearRange: "-90:+3"
		}).end();

	// Cannot use daterange picker yet because it does not have collision detection:
	// http://www.filamentgroup.com/lab/date_range_picker_using_jquery_ui_16_and_jquery_ui_css_framework/
	//.filter(".daterange").daterangepicker({
	//	dateFormat: 'dd/mm/yyyy',
	//	arrows : true,
	//	presetRanges: [ { text:"First day of trip", dateStart:"2009-01-01", dateEnd:"2009-01-01" } ],
	//	presets: { dateRange:"Choose date from/to" }
	//	//posX: 100,
	//	//posY: '16.8em'
	//})

};


// Initialise Spinbox fields: (Assumes jquery.spinbox.css is loaded and spinbox-sprite image is available to mimic buttons)
function initSpinboxes() {

	$("INPUT:text.spinbox:not(.spinbox-active)")
			.filter(".exchange_rate").spinbox({
				max: 1000,
				step: 0.01,
				bigStep: 1
			}).end()
			.filter(".money:not(.spinbox-active)").spinbox({
				min: 0,
				max: 1000000,
				step: 1,
				bigStep: 10,
				scale: 2
			}).end()
			.filter(":not(.spinbox-active)").spinbox({
				min: 0,
				max: 50,
				step: 1,
				bigStep: 10
			});

	//$("INPUT.time").spinbox({
	//	keys			: [ /[0-9]/,/\:/,9,13,8,46,33,34,37,38,39,40,109,188,190 ],
	//	increment		: function(val,step,min,max,options){
	//		console.log( val )
	//		var hh = val.split(":")[0] || 0;
	//		var mm = val.split(":")[1] || 0;
	//		var date = new Date(2000,1,1,hh,mm);
	//		date.setMinutes( date.getMinutes() + step );
	//		console.log( date.getHours() + ":" + date.getMinutes() )
	//		return date.getHours() + ":" + date.getMinutes();
	//	},
	//	decrement		: function(val,step,min,max,options){ return val - step; },
	//	round		   : false
	//});
};




	// Initialise AUTOCOMPLETE within trip summary tab for adding trip_clients to trip:
	function initTripClientSearch(context){

		$('INPUT.trip-client-search',context).autocomplete("/search", {

			max					: CLIENT_SEARCH_MAX_ROWS,
			delay				: CLIENT_SEARCH_DELAY_BEFORE_AJAX,
			cacheLength			: 1,		// This simply allows the current results to stay in memory so double-click does not trigger re-search.
			minChars			: 3,
			matchContains		: false,
			matchSubset			: false,
			multiple			: false,
			multipleSeparator	: ",",
			dataType			: "json",
			scrollHeight		: 200,
			width				: 576,

			// Parse json as soon as it loads, to rearrange results as array of objects each with {data, value, result} attributes for autocompleter. More info: http://blog.schuager.com/2008/09/jquery-autocomplete-json-apsnet-mvc.html
			parse: autocomplete_helpers.parseItems,

			// Generate html for each item in the json data: (json-object, row-index, number-of-rows, query-string)
			formatItem: autocomplete_helpers.formatItem,

			// ???:
			formatMatch: function(data, i, n, q) { // i=row index, n=number of rows, q=query string
				return data.postcode;

			}

		})


		// Respond to user's choice by adding selected client to the list of travellers:
		.result(function(e, client) {

			var $table   = $('TABLE:visible.tripTravellers > TBODY');

			if( $table.find("INPUT[value='" + client.id + "']").length === 0 ){

				// Eg: <tr><td><a href="/clients/{id}?label={label}" class="show clientName">{name}</a></td>...</tr>
				//var template = unescape( $table.find('>TR.template').clone().removeClass('hidden template').find(':disabled').removeAttr('disabled').end().outerHtml() );
				var template	= $('#trip-traveller-row-template').html();

				var index	 = $table.children('TR').length;

				var html	 = interpolate( template, { id:client.id, name:client.shortname, label:client.shortname, index:index } );

				// Append the row to the table using an animation: (Note we animate the contents because table cells do not animate as expected)
 				$(html)
					.find('> TD > *').hide().end()
				.appendTo( $table )
					.find('> TD > *').slideDown();

			}

		});
	
	}





	// Initialise AUTOCOMPLETE within address postcode fields:
	function initPostcodeSearch(context){

		$('INPUT.postal-code',context).autocomplete('/postcodes', {

			max					: POSTCODE_LOOKUP_MAX_ROWS,
			delay				: POSTCODE_LOOKUP_DELAY_BEFORE_AJAX,
			cacheLength			: 0,
			minChars			: 5,		// (Shortest postcode in db is 6 chars) The longer this is the faster the search is likely to be.
			matchContains		: false,
			matchSubset			: false,
			multiple			: false,
			multipleSeparator	: ",",
			dataType			: "json",
			scrollHeight		: 200,
			width				: 576,

			// Parse json as soon as it loads, to rearrange results as array of objects each with {data, value, result} attributes for autocompleter. More info: http://blog.schuager.com/2008/09/jquery-autocomplete-json-apsnet-mvc.html
			parse: function(rows){
				return $.map(rows, function(row){
					return { data: row, value: row.postcode, result: row.postcode };
				});
			},
			
			formatItem : function(postcode, row, count, q) {
				var address = [];
				if(postcode.address1){ address.push(postcode.address1) }
				if(postcode.address2){ address.push(postcode.address2) }
				if(postcode.address3){ address.push(postcode.address3) }
				if(postcode.address4){ address.push(postcode.address4) }
				if(postcode.address5){ address.push(postcode.address5) }
				if(postcode.postcode){ address.push(postcode.postcode) }
				return address.join(', ');
			}

		})
			
		// Respond to user's choice by populating address fields with selected address:
		.result(function(e, premise) {

			var $formFields = $(this).parent().parent().find('> DIV.formField');
			var $textboxes	= $formFields.find('> INPUT:text');
			var $country	= $formFields.find('> SELECT[name*=country]');
			
			$textboxes.filter('[name*=address1]').val( premise.address1 );
			$textboxes.filter('[name*=address2]').val( premise.address2 );
			$textboxes.filter('[name*=address3]').val( premise.address3 );
			$textboxes.filter('[name*=address4]').val( premise.address4 );
			$textboxes.filter('[name*=address5]').val( premise.address5 );
			$textboxes.filter('[name*=postcode]').val( premise.postcode );
			
			$country.filter(':not(:has(OPTION[value=' + UK_COUNTRY_ID + ']))')
				//.prepend('<option value="6">United Kingdom</option>')
			.end()
			.val('6');
			
		})


			// Generate html for each item in the json data: (json-object, row-index, number-of-rows, query-string)
			//formatItem: autocomplete_helpers.formatItem,

			// ???:
			//formatMatch: function(data, i, n, q) { // i=row index, n=number of rows, q=query string
			//	return data.postcode;
			//}

	
	}










function initMVC(context) {

	// Initialise TripElement calculated totals by faking user interaction and triggering event handler: 
	$("SELECT[name='trip_element[supplier_id]']").each( onTripElementFieldChange );

	return;

	// Go no further because this MVC function is DEPRICATED!
	// It caused memory leak and massive typing slowdown after several ajax calls.



/*
	// Listen to number of Trip adults/children/infants and update totals:
	$( 'FORM:has(.total):not(.mvc-active)', context ).View()

		// Update traveller count on TRIP form:
		.addListener("trip[adults], trip[children], trip[infants]", function(fields) {

			var $form	= $(this).parents("FORM");
			var $texts	= $form.find("INPUT");
			var total	= numVal("[name='trip[adults]']",   $texts)
						+ numVal("[name='trip[children]']", $texts)
						+ numVal("[name='trip[infants]']",  $texts);

			$form.find("DIV.trip-travellers.total").text(total);
			$texts.filter("INPUT[name='trip[travellers]'].total").val(total);

		})

		// Update trip element total costs on TRIP-ELEMENT form:
		// Important: This makes use of our custom textVal() jQuery method.
		.addListener("trip_element[supplier_id], trip_element[adults], trip_element[children], trip_element[infants], trip_element[cost_per_adult], trip_element[cost_per_child], trip_element[cost_per_infant], trip_element[exchange_rate], trip_element[taxes], trip_element[margin], trip_element[margin_type], trip_element[biz_supp_per_adult], trip_element[biz_supp_per_child], trip_element[biz_supp_per_infant]", function(fields) {

			// Cache field lists for better query performance:
			var $form			= $(this).parents("FORM:first");
			var $all			= $form.find("SELECT,INPUT,TEXTAREA,DIV");
			var $totals			= $all.filter(".total");						// Fields and DIVs with class of .total
			var $fields			= $all.filter("SELECT,INPUT,TEXTAREA");			// Form fields
			var $texts			= $fields.filter("INPUT:text");					// Textboxes only
			var $lists			= $fields.filter("SELECT");						// Dropdown lists only
			var $currencyField	= $lists.filter("[name='currency']");

			var currencyBeforeChange = $currencyField.val();

			// Update currency and exchange_rate whenever a new supplier_id is chosen:
			var newCurrencyName      = $lists.filter("[name='trip_element[supplier_id]']").textVal();   // Eg: "Air Iceland [GBP]" => "GBP"
			var $newCurrencyListItem = $currencyField.find("OPTION[text ^= '" + newCurrencyName + "']:first").attr({ selected: "selected" })

			var currencyAfterChange = $currencyField.val();

			// Update exchange_rate textbox: (unless no supplier is selected)
			if( currencyAfterChange != currencyBeforeChange ){
				var new_exchange_rate = $newCurrencyListItem.textVal();
				$texts.filter("[name='trip_element[exchange_rate]']").val(new_exchange_rate);
				//$lists.filter("[name='trip_element[margin_type]'], [name='trip_element[biz_supp_margin_type]']").find("OPTION[value!='%']").text(new_currency_name);	// Just update the friendly list item label representing the fixed-value margin.
			}

			// Read values from form:
			var adults				= numVal("[name='trip_element[adults]']", $texts);
			var children			= numVal("[name='trip_element[children]']", $texts);
			var infants				= numVal("[name='trip_element[infants]']", $texts);
			var cost_per_adult		= numVal("[name='trip_element[cost_per_adult]']", $texts);
			var cost_per_child		= numVal("[name='trip_element[cost_per_child]']", $texts);
			var cost_per_infant		= numVal("[name='trip_element[cost_per_infant]']", $texts);
			var exchange_rate		= numVal("[name='trip_element[exchange_rate]']", $texts);
			var taxes				= numVal("[name='trip_element[taxes]']", $texts);
			var margin				= numVal("[name='trip_element[margin]']", $texts);
			var margin_type			= $lists.filter("[name='trip_element[margin_type]']").val();
			var biz_supp_per_adult	= numVal("[name='trip_element[biz_supp_per_adult]']", $texts);
			var biz_supp_per_child	= numVal("[name='trip_element[biz_supp_per_child]']", $texts);
			var biz_supp_per_infant	= numVal("[name='trip_element[biz_supp_per_infant]']", $texts);
			var biz_supp_margin		= numVal("[name='biz_supp_margin']", $texts);
			var biz_supp_margin_type= $lists.filter("[name='trip_element[biz_supp_margin_type]']").val();

			// Calculate totals etc:
			var travellers			= adults + children + infants;
			var total_std_cost		= adults * cost_per_adult + children * cost_per_child + infants * cost_per_infant;
			var total_biz_supp		= adults * biz_supp_per_adult + children * biz_supp_per_child + infants * biz_supp_per_infant;
			var total_biz_margin	= (biz_supp_margin_type === '%') ? (total_biz_supp * biz_supp_margin / 100) : biz_supp_margin;	// Typically 10%
			var total_std_margin	= (margin_type === '%') ? (total_std_cost * margin / 100) : margin;
			var total_margin		= total_std_margin + total_biz_margin;
			var total_cost			= total_std_cost + total_biz_supp + taxes;
			var total_price			= total_cost + total_margin;
			var total_price_gbp		= total_price / Math.max(exchange_rate, 0.001);  // Prevent divide-by-zero error.

			// For better display, round currency values to 2 decimal places and pad pence with zeros where necessary:
			total_margin	= round(total_margin);
			total_cost		= round(total_cost);
			total_price		= round(total_price);
			total_price_gbp	= round(total_price_gbp);

			// Update fields with new totals etc:
			$totals.filter(".trip-element-travellers, [name='trip_element[travellers]'], #trip_element_travellers")
				.filter("INPUT").val(travellers)
				//.end().not("INPUT").text(travellers);

			$totals.filter("[name='trip_element[total_margin]'], #trip_element_total_margin")
				.filter("INPUT").val(total_margin)
				//.end().not("INPUT").text(total_margin);

			$totals.filter("[name='trip_element[total_cost]']")
				.filter("INPUT").val(total_cost)
				//.end().not("INPUT").text(total_cost);

			$totals.filter("[name='trip_element[total_price]']")
				.filter("INPUT").val(total_price)
				//.end().not("INPUT").text(total_price);

			$totals.filter("[name='total_price_gbp']")
				.filter("INPUT").val(total_price_gbp)
				//.end().not("INPUT").text(total_price_gbp);

		})
		
	.addClass('mvc-active');

	// Initialise calculated fields by faking user interaction to trigger MVC listeners: 
	$("INPUT[name='trip[adults]'], SELECT[name='trip_element[supplier_id]']").change();
	//$("INPUT[name='trip[adults]']").change();

	// HELPER for ensuring .val() returns a usable number from a form element:
	function numVal(selector, $fields, defaultAlternative) {
		//return parseFloat( $($fields).find(selector).andSelf().filter(selector).val() ) || defaultAlternative || 0;
		return parseFloat( $fields.filter(selector).val() ) || defaultAlternative || 0;
	};
*/
};







// Filter user's typing in numeric fields etc:
function initKeyPressFilters(){

	// Only allow POSITIVE values: (Simply by stopping the user form typing a minus)
	// TODO: Validate pasted values too?
	$( "INPUT:text.positive" ).live( 'keydown', function(e){

		if( isKeyCodeLikeKeyFilter( e.keyCode, KEY.minus ) ){
			return false;
		}

	});

	

	// Only allow INTEGER values:
	// TODO: Validate pasted values too?
	$( "INPUT:text.integer" ).live( 'keydown', function(e){
			
		var keys = [ KEY.integer, KEY.tab, KEY.enter, KEY.backspace, KEY.delete, KEY.navigation, KEY.fkeys ];

		if( isKeyCodeInList( e.keyCode, keys ) || e.ctrlKey || e.altKey ){

			// Key looks valid but lets do quick check to prevent symbols from being entered twice:
			if( isKeyCodeLikeKeyFilter( e.keyCode, KEY.minus ) && $(this).is("[value *= '-']") ){ return false }
			if( isKeyCodeLikeKeyFilter( e.keyCode, KEY.dot   ) && $(this).is("[value *= '.']") ){ return false }

			return true;

		}else{
			return false;
		}
	
	});

	// Only allow DECIMAL values:
	// TODO: Validate pasted values too? And other number formats? (eg in France they use commas and dots the other way around)
	$( "INPUT:text.decimal, INPUT:text.money" ).live( 'keydown', function(e){

		var keys = [ KEY.decimal, KEY.tab, KEY.enter, KEY.backspace, KEY.delete, KEY.navigation, KEY.fkeys ];

		if( isKeyCodeInList( e.keyCode, keys ) || e.ctrlKey || e.altKey ){

			// Key looks valid but lets do quick check to prevent symbols from being entered twice:
			if( isKeyCodeLikeKeyFilter( e.keyCode, KEY.minus ) && $(this).is("[value *= '-']") ){ return false }
			if( isKeyCodeLikeKeyFilter( e.keyCode, KEY.dot   ) && $(this).is("[value *= '.']") ){ return false }

			return true;

		}else{
			return false;
		}

	});


	// Helper for testing whether keyCode matches any of the specified character codes or regexs:
	function isKeyCodeInList( keyCode, keyFilters ){

		return !!$.grep( keyFilters || [], function(keyFilter){
			return isKeyCodeLikeKeyFilter( keyCode, keyFilter )
		}).length;

	};


	// Helper for testing whether keyCode matches a specified character code or regex:
	function isKeyCodeLikeKeyFilter( keyCode, keyFilter ){

		return keyCode === keyFilter || ( keyFilter instanceof RegExp && keyFilter.test( String.fromCharCode(keyCode) ) );

	};

}






function initTripElementFormTotals(){

	// Update TripElement totals when these fields change:
	$( "SELECT[name='trip_element[supplier_id]'], INPUT[name='trip_element[adults]'], INPUT[name='trip_element[children]'], INPUT[name='trip_element[infants]'], INPUT[name='trip_element[cost_per_adult]'], INPUT[name='trip_element[cost_per_child]'], INPUT[name='trip_element[cost_per_infant]'], INPUT[name='trip_element[exchange_rate]'], INPUT[name='trip_element[taxes]'], INPUT[name='trip_element[margin]'], SELECT[name='trip_element[margin_type]'], INPUT[name='trip_element[biz_supp_per_adult]'], INPUT[name='trip_element[biz_supp_per_child]'], INPUT[name='trip_element[biz_supp_per_infant]']" )
		.live( 'keyup', onTripElementFieldChange )
		.live( 'click', onTripElementFieldChange );

}
		
	// Called to update TripElement totals whenever user makes changes in TripElement form: (And each time it is loaded by ajax)
	function onTripElementFieldChange(){

		// Cache field lists for better query performance:
		var $form			= $(this).parents("FORM:first");
		var $all			= $form.find("SELECT,INPUT,TEXTAREA,DIV");
		var $totals			= $all.filter(".total");						// Fields and DIVs with class of .total
		var $fields			= $all.filter("SELECT,INPUT,TEXTAREA");			// Form fields
		var $texts			= $fields.filter("INPUT:text");					// Textboxes only
		var $lists			= $fields.filter("SELECT");						// Dropdown lists only
		var $currencyField	= $lists.filter("[name='currency']");

		var currencyBeforeChange = $currencyField.val();

		// Update currency and exchange_rate whenever a new supplier_id is chosen:
		var newCurrencyName      = $lists.filter("[name='trip_element[supplier_id]']").textVal();   // Eg: "Air Iceland [GBP]" => "GBP"
		var $newCurrencyListItem = $currencyField.find("OPTION[text ^= '" + newCurrencyName + "']:first").attr({ selected: "selected" })

		var currencyAfterChange = $currencyField.val();

		// Update exchange_rate textbox: (unless no supplier is selected)
		if( currencyAfterChange != currencyBeforeChange ){
			var new_exchange_rate = $newCurrencyListItem.textVal();
			$texts.filter("[name='trip_element[exchange_rate]']").val(new_exchange_rate);
			//$lists.filter("[name='trip_element[margin_type]'], [name='trip_element[biz_supp_margin_type]']").find("OPTION[value!='%']").text(new_currency_name);	// Just update the friendly list item label representing the fixed-value margin.
		}

		// Read values from form:
		var adults				= numVal("[name='trip_element[adults]']", $texts);
		var children			= numVal("[name='trip_element[children]']", $texts);
		var infants				= numVal("[name='trip_element[infants]']", $texts);
		var cost_per_adult		= numVal("[name='trip_element[cost_per_adult]']", $texts);
		var cost_per_child		= numVal("[name='trip_element[cost_per_child]']", $texts);
		var cost_per_infant		= numVal("[name='trip_element[cost_per_infant]']", $texts);
		var exchange_rate		= numVal("[name='trip_element[exchange_rate]']", $texts);
		var taxes				= numVal("[name='trip_element[taxes]']", $texts);
		var margin				= numVal("[name='trip_element[margin]']", $texts);
		var margin_type			= $lists.filter("[name='trip_element[margin_type]']").val();
		var biz_supp_per_adult	= numVal("[name='trip_element[biz_supp_per_adult]']", $texts);
		var biz_supp_per_child	= numVal("[name='trip_element[biz_supp_per_child]']", $texts);
		var biz_supp_per_infant	= numVal("[name='trip_element[biz_supp_per_infant]']", $texts);
		var biz_supp_margin		= numVal("[name='biz_supp_margin']", $texts);
		var biz_supp_margin_type= $lists.filter("[name='trip_element[biz_supp_margin_type]']").val();

		// Calculate totals etc:
		var travellers			= adults + children + infants;
		var total_std_cost		= adults * cost_per_adult + children * cost_per_child + infants * cost_per_infant;
		var total_biz_supp		= adults * biz_supp_per_adult + children * biz_supp_per_child + infants * biz_supp_per_infant;
		var total_biz_margin	= (biz_supp_margin_type === '%') ? (total_biz_supp * biz_supp_margin / 100) : biz_supp_margin;	// Typically 10%
		var total_std_margin	= (margin_type === '%') ? (total_std_cost * margin / 100) : margin;
		var total_margin		= total_std_margin + total_biz_margin;
		var total_taxes			= taxes * travellers
		var total_cost			= total_std_cost + total_biz_supp + total_taxes;
		var total_price			= total_cost + total_margin;
		var total_price_gbp		= total_price / Math.max(exchange_rate, 0.001);  // Prevent divide-by-zero error.

		// For better display, round currency values to 2 decimal places and pad pence with zeros where necessary:
		total_margin	= round(total_margin);
		total_cost		= round(total_cost);
		total_price		= round(total_price);
		total_price_gbp	= round(total_price_gbp);

		// Update fields with new totals etc:
		$totals.filter(".trip-element-travellers, [name='trip_element[travellers]'], #trip_element_travellers")
			.filter("INPUT").val(travellers)
			//.end().not("INPUT").text(travellers);

		$totals.filter("[name='trip_element[total_margin]'], #trip_element_total_margin")
			.filter("INPUT").val(total_margin)
			//.end().not("INPUT").text(total_margin);

		$totals.filter("[name='trip_element[total_cost]']")
			.filter("INPUT").val(total_cost)
			//.end().not("INPUT").text(total_cost);

		$totals.filter("[name='trip_element[total_price]']")
			.filter("INPUT").val(total_price)
			//.end().not("INPUT").text(total_price);

		$totals.filter("[name='total_price_gbp']")
			.filter("INPUT").val(total_price_gbp)
			//.end().not("INPUT").text(total_price_gbp);

	};









// Update Trip Invoice amount when these fields change:
function initTripInvoiceFormTotals(){

	// Update Trip Invoice amount when these fields change:
	$( "INPUT[name='money_in[deposit]']" )
		.live( 'keyup', onTripInvoiceFieldChange )
		.live( 'click', onTripInvoiceFieldChange );

	$( "SELECT[name='money_in[name]']" )
		.live( 'change', onTripInvoiceTypeChange );

	triggerTripInvoiceFormChange();

}

	// Helper for refreshing fields after ajax loaded content:
	function triggerTripInvoiceFormChange(){

		// Update Trip Invoice amount when these fields change:
		$( "INPUT[name='money_in[deposit]']" ).trigger('keyup');
		$( "SELECT[name='money_in[name]']"   ).trigger('change');

	}

	// Called to update TripElement totals whenever user makes changes in TripElement form: (And each time it is loaded by ajax)
	function onTripInvoiceFieldChange(){

		// Cache field lists for better query performance:
		var $form	= $(this).parents("FORM:first");
		var $all	= $form.find("SELECT,INPUT,TEXTAREA,DIV");
		var $totals	= $all.filter(".total");						// Fields and DIVs with class of .total
		var $fields	= $all.filter("SELECT,INPUT,TEXTAREA");			// Form fields
		var $texts	= $fields.filter("INPUT:text");					// Textboxes only
		var $lists	= $fields.filter("SELECT");						// Dropdown lists only

		var total   = numVal("[name='total_amount']",		$texts);
		var deposit = numVal("[name='money_in[deposit]']",	$texts);

		$texts.filter("[name='money_in[amount]']").val( total - deposit );

	}


	// Called to adjust Trip Invoice fields when user chooses main or supp invoice:
	function onTripInvoiceTypeChange(){

		var $form	= $(this).parents("FORM:first");
		var $all	= $form.find("SELECT,INPUT,TEXTAREA,DIV");
		var $totals	= $all.filter(".total");						// Fields and DIVs with class of .total
		var $fields	= $all.filter("SELECT,INPUT,TEXTAREA");			// Form fields
		var $texts	= $fields.filter("INPUT:text");					// Textboxes only
		var $deposit = $texts.filter( "[name='money_in[deposit]']" );
		var $amountLabels		= $form.find('DIV.invoice-amount-label');
		var $mainAmountLabel	= $amountLabels.filter('.for-main-invoice');
		var $suppAmountLabel	= $amountLabels.filter('.for-supp-invoice');
		var $creditAmountLabel	= $amountLabels.filter('.for-credit-invoice');
		
		var isMainInvoice = $(this).val() == '';
		var isCreditNote  = /\/C$/.test( $(this).val() );

		$texts.filter( "[name='money_in[deposit]']" ).attr( 'readonly', isMainInvoice ? null : 'readonly' );
		$texts.filter( "[name='money_in[amount]']"  ).attr( 'readonly', isMainInvoice ? 'readonly' : null );
		
		// Reset deposit amount for main invoice:
		if( isMainInvoice ){

			var defaultDeposit = numVal("[name='default_deposit']", $fields);

			// Show the deposit field:
			$deposit.val(defaultDeposit).cousins('>TD>*').fadeTo('slow',1);

			// Show the label for main invoice amount and hide the others:
			$mainAmountLabel.siblings().fadeOut('fast').end().delay('fast').fadeIn('fast');

		}else{

			// Hide the deposit field:
			$deposit.val(0).cousins('>TD>*').fadeTo('slow',0);

			if( isCreditNote ){
				// Show the label for supp invoice amount and hide the others:
				$creditAmountLabel.siblings().fadeOut('fast').end().delay('fast').fadeIn('fast');
			}else{
				// Show the label for credit invoice amount and hide the others:
				$suppAmountLabel.siblings().fadeOut('fast').end().delay('fast').fadeIn('fast');
			}

		}

	}









// Helper to parse details from a url and return an object hash similar to the window.location object:
function parseUrl(url) {

	//url = "/clients/2/trips/3/edit?label=Mrs+K+Adamson#bookmark"
	// regex info: /(path  ) ? (params)  #(bookmark)
	var matches  = /([^\?#]*)\??([^\#]*)\#?(.*)/.exec(url),
		location = { params:{length:0}, resource:{length:0} };

	if (matches.length) {

		// These attributes are named to be consistent with the window.location object!
		location.pathname	= matches[1];	// Eg: /clients/1/trips/2/edit
		location.search		= matches[2];	// Eg: name=Smith&date=20090102 (whatever follows the question mark)
		location.hash		= matches[3];	// Eg: #bookmark (whatever follows the hash mark)

		// Copy all the url params to a location.params object:
		location.params = keyValPairs(location.search.split("&"), location.params, "=");

		// Extract each "/controller/id" pair from nested pathname:
		// We also provide a function to trim off training "s" or swap "ies" to "y" on each controller name (remove pluralisation, eg countries ==> country)
		// Regex uses Positive Lookahead to split on alternate "/" characters. See http://msdn.microsoft.com/en-us/library/1400241x%28VS.85%29.aspx
		keyValPairs( location.pathname.split(/\/(?=[^\/]+\/[0-9]+)/),
			location.resource, "/",
			// Callback for each key in the controllerName/id pairs:
			function(controllerName, id) {
				// Attempt to singularise the plural controller names!
				return controllerName.replace(/ies$/, "y").replace(/s$/, "");
			}
		);

		// If there's a "/action" on the end of the path then get that too!
		location.action = (/\/([^0-9]+)$/.exec(location.pathname) || ["", ""])[1];

	};

	return location;


	// Helper for converting an ARRAY of "key=value" string pairs into an object hash:
	// Optional keyFn and valFn callbacks can be used to alter the strings in some way. They receive arguments: key, value, index, originalArray, keyArray, valArray, hashBuiltSoFar.
	function keyValPairs(arr, obj, sep, keyFn, valFn) {

		sep = sep === undefined ? "=" : sep;
		obj = obj || {};
		obj.length = obj.length || 0;
		var keyArr = [], valArr = [];

		for (var i in arr) {
			var pair = arr[i].split(sep),
					key = !keyFn ? pair[0] : keyFn( pair[0], pair[1], i, arr, keyArr, valArr, obj ),
					val = !valFn ? pair[1] : valFn( pair[1], pair[1], i, arr, keyArr, valArr, obj ) || "";
			keyArr.push(key);
			valArr.push(val);
			if (key.length) { // Skip blank keys
				obj[key] = obj[i] = obj.last = val;
				obj.length++;
			};
		};
		return obj;
	};
};



// Helper function to generate html syntax for an html tag:
// Specify attrs as an object hash of name:value pairs.
function tag(name, contents, attrs) {

	// Make it a self-closing tag when contents omitted.
	// Otherwise make Opening/closing tags either side of contents:
	return (contents === null || contents === undefined)
			? '<' + name + html_attributes(attrs) + '/>'
			: '<' + name + html_attributes(attrs) + '>' + contents + '</' + name + '>';

	function html_attributes(attrs) {
		if(!attrs){ return '' }
		var arr = [];
		$.each(attrs, function(name, val) { arr.push(name + '="' + val + '"') });
		return " " + arr.join(" ");
	}
};


// A better alternative to Math.round(num) that lets you choose the number of dp to round to:
function round(num, dp) {
	dp = (dp === undefined) ? 2 : Math.max(dp, 0);
	var multiplier = Math.pow(10, dp) || 1;
	result = (Math.round(num * multiplier) / multiplier) + '';
	var beforeDp = result.split('.')[0];
	var afterDp = result.split('.')[1] || '';
	var zeros = new Array(dp - afterDp.length + 1).join('0');
	return beforeDp + '.' + afterDp + zeros;
};


// Helper for escaping html code:
function escapeHTML(html){

	return html
		.replace('&','&amp;')
		.replace('<','&lt;')
		.replace('>','&gt;')
		.replace('"','&quot;')
		.replace("'",'&apos;');

}


// Private helper for ensuring .val() returns a usable number from a form element:
function numVal(selector, $fields, defaultAlternative) {
	//return parseFloat( $($fields).find(selector).andSelf().filter(selector).val() ) || defaultAlternative || 0;
	return parseFloat( $fields.filter(selector).val() ) || defaultAlternative || 0;
};


// QUnit testing://$.getScript('/javascripts/testing/qunit.js', function(){//	$.getScript('/javascripts/testing/test-specs.js')//});	// Intercept accidental attempts to use the BACK BUTTONS etc:	// Note: We only intercept page-unload when there are client tabs open. That way testing individual controller pages is not annoying!	// TODO: Allow use of back buttons by adding to the browser history while user navigates around the tabs.	window.onbeforeunload = function(e){		// Derive file extension of clicked link if applicable: (Eg 'doc', 'pdf')		var elem = e.target.activeElement;		var href = !!elem && elem.href || '';		var file_extension = href.split(/#|\?/).shift().split('.').pop();	// Get text between the last dot and the first # or ?, if any.		if( $('#pageTabsNav > LI').length > 1 && !ALLOW_DOWNLOAD_OF[file_extension] ){			return "- Tip: If you are simply trying to reload the page then press OK to continue.\n\n" +				"- More info:\n This site is more like an application than an ordinary web page, so " +				"using your browser's back and forward buttons will not navigate you around this application."		}	};});	// End of jQuery ready handler.