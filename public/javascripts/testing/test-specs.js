
//window.setTimeout(function(){

	// Trigger a 'live' event such as click without triggering it's default action:
	// Useful workaround for triggering hijaxed :submit button (bound with .live) without causing default full page submit.
	// Not tested extensively: Probably won't work as expected on elements that already have the same event bound using bind().
	jQuery.fn.extend({ triggerLive : function( type, data ){

		// Derive a uniquely namespaced name for our temporary event:
		var tempType = type + '.tmp' + ( new Date() ).getTime();

		// Bind temporary event handler that sets event.preventDefault(), trigger the event, then unbind temp handler:
		return this.bind( tempType, function(e){ e.preventDefault(); })
			.trigger( type, data )
			.unbind( tempType );

	} });



	(function($){

		$('#pageHeading').click( function(){


			var AJAX_TABS_WAIT_TIME = 8000;


			// Toggle the qunit-console:
			if( $('#qunit-console').is(':visible') ){
				$('#qunit-console').fadeOut();
				return;
			}else{
				$('#qunit-console').fadeIn();
			}

			//QUnit.init();	// init() Seems to prevent autocompleter from running.
			QUnit.start();



			module('test_search');

			test("Client search box exists?", 1, function(){

				ok( $('#mainSearchText').length );

			});

			asyncTest("Search for SURNAME", 1, function(){

				var keyword = 'Armitage';

				$('#mainSearchText').val(keyword).trigger('keydown');

				setTimeout(function(){
					ok( $('DIV.ac_results LI:first .name:contains(' + keyword + ')').length, 'Results contain ' + keyword );
					start();
				},2000);

			});

			asyncTest("Search for POSTCODE", 1, function(){

				var keyword = 'GL7 5SF';

				$('#mainSearchText').val(keyword).trigger('keydown');
				
				// Note: The UI script may have replaced the space with a &nbsp; so just test for the 2nd part of the postcode:
				//keyword = keyword.replace(' ','\\\\&nbsp\\\\;')
				keyword = keyword.split(' ').pop();

				setTimeout(function(){
					ok( $("DIV.ac_results LI:first .address:contains(" + keyword+ ")").length, 'Results contain ' + keyword );
					start();
				},2000);

			});

			asyncTest("Search for EMAIL", 1, function(){

				var keyword = 'james@steppestravel.co.uk';

				$('#mainSearchText').val(keyword).trigger('keydown');

				setTimeout(function(){
					ok( $('DIV.ac_results LI:first .email:contains(' + keyword + ')').length, 'Results contain ' + keyword );
					start();
				},2000);

			});

			//asyncTest("Search for CLIENTID", 1, function(){

			//	keyword = '2138471587';

			//	$('#mainSearchText').val(keyword).trigger('keydown');

			//	setTimeout(function(){
			//		ok( $('DIV.ac_results LI:first .email:contains(' + keyword + ')').length, 'Results contain ' + keyword );
			//		start();
			//	},2000);

			//});



			module('test_client');

			asyncTest("Client tab", 1, function(){

				var keyword = 'Armitage';

				$('DIV.ac_results LI:first').trigger('click');

				setTimeout(function(){
					ok( $('#pageTabsNav LI:contains(' + keyword + ')').length, 'Tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});





			module("test_lhstabs");


			asyncTest("Documents tab", 1, function(){

				var keyword = 'ocuments';

				$('UL.clientPageTabsNav:visible LI:contains(' + keyword + ') A').trigger('click');

				setTimeout(function(){
					ok( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ')').length, 'Documents tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});



			asyncTest("Client details tab", 1, function(){

				var keyword = 'Client details';

				$('UL.clientPageTabsNav:visible LI:contains(' + keyword + ') A').trigger('click');

				setTimeout(function(){
					ok( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ')').length, 'Details tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});



			asyncTest("Trip tab", 1, function(){

				var keyword = 'Trip summary';

				$('UL.clientPageTabsNav:visible LI.trip:first A').trigger('click');

				setTimeout(function(){
					ok( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ')').length, 'Trip tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});






			module("test_createtrip");


			asyncTest("Open new-trip tab", 1, function(){

				var keyword = 'new trip';

				$('UL.clientPageTabsNav:visible LI.trip-create A').trigger('click');

				setTimeout(function(){
					ok( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ')').length, 'Trip tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});



			test("Calculate TRAVELLERS total", 7, function(){

				var $fields = $('DIV.clientSubPageContainer:visible INPUT');
				var totalField = 'DIV.clientSubPageContainer:visible .total.trip-travellers';

				equals( $fields.filter("[name='trip[adults]']").val(), 1, 'Default Adult total should be 1' );
				equals( $fields.filter("[name='trip[children]']").val(), 0, 'Default Children total should be 0' );
				equals( $fields.filter("[name='trip[infants]']").val(), 0, 'Default Infants total should be 0' );

				equals( $(totalField).text(), 1, 'Default Traveller total should be 1' );

				$fields.filter("[name='trip[adults]']").val('10').trigger('change');
				equals( $(totalField).text(), 10, '10 Adults: Traveller total should be 10' );

				$fields.filter("[name='trip[children]']").val('10').trigger('change');
				equals( $(totalField).text(), 20, '10 Adults, 10 Children: Traveller total should be 20' );

				$fields.filter("[name='trip[infants]']").val('10').trigger('change');
				equals( $(totalField).text(), 30, '10 Adults, 10 Children, 10 Infants: Traveller total should be 30' );

			});




			asyncTest("Save new trip", 1, function(){

				var keyword  = 'Trip summary';
				var tripName = 'Test Trip (on' + ( new Date() ) + ')';

				var $fields = $('DIV.clientSubPageContainer:visible INPUT');

				$fields.filter("[name='trip[name]']").val(tripName);
				$fields.filter("[name='trip[start_date]']").val('01/01/2020');
				$fields.filter("[name='trip[end_date]']").val('20/01/2020');	// 20 days duration.

				$fields.filter("[name='trip[infants]']").val('10');
				$fields.filter("[name='trip[children]']").val('10');
				$fields.filter("[name='trip[adults]']").val('10');

				$fields.filter(":submit").triggerLive('click')

				setTimeout(function(){
					equals( $.trim( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ') .tripName').text() ), tripName, 'Trip tab contains ' + tripName );
					start();
				},AJAX_TABS_WAIT_TIME);

			});



			test("Number of days in new trip's timeline", 1, function(){

				equals( $('DIV.tripPageTabsContent:visible .timelineScale .scaleDay').length, 20, 'Timeline scale is 20 days' )

			});








			module("test_trip_elements");


			asyncTest("Open trip tab", 1, function(){

				var $tab = $('UL.clientPageTabsNav:visible LI.trip:first A').trigger('click');

				var keyword = $tab.text();

				setTimeout(function(){
					ok( $('DIV.clientSubPageContainer:visible:contains(' + keyword + ')').length, 'Trip tab contains ' + keyword );
					start();
				},AJAX_TABS_WAIT_TIME);

			});


			asyncTest("Open trip builder", 1, function(){

				var $tab = $('UL.clientSubPageContainer:visible LI:contains(builder) A').trigger('click');

				setTimeout(function(){
					ok( $('DIV.tripPageTabsContent:visible .timelineContent').length, 'Trip Builder tab contains a timeline' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});




			asyncTest("Open NEW MISC form", 8, function(){

				var $tab = $('DIV.tripPageTabsContent:visible .timelineContent .timelineSwimlaneHead.isMisc A').triggerLive('click');

				setTimeout(function(){
					var $form = $('DIV.tripPageTabsContent:visible .tripElementFormContainer FORM');
					ok( $form.length, 'Form for new element has loaded' );
					equals( $form.find("[name='trip_element[type_id]']").val(), 8, 'Element type is Misc' );
					ok( $form.find("SELECT[name='trip_element[misc_type_id]']").is(':visible'), 'Misc category list is visible' );
					equals( $form.find("[name='trip_element[room_type]']:visible").length, 0, 'Room type field is hidden' );
					equals( $form.find("[name='trip_element[meal_plan]']:visible").length, 0, 'Meal plan field is hidden' );
					equals( $form.find("SELECT[name='trip_element[handler_id]']:visible").length, 0, 'Handler list is hidden' );
					equals( $form.find("SELECT[name='trip_element[depart_airport_id]']:visible").length, 0, 'Departure airport list is hidden' );
					equals( $form.find("SELECT[name='trip_element[arrive_airport_id]']:visible").length, 0, 'Arrival airport list is hidden' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});




			asyncTest("Open NEW ACCOMMODATION form", 8, function(){

				var $tab = $('DIV.tripPageTabsContent:visible .timelineContent .timelineSwimlaneHead.isAccomm A').triggerLive('click');

				setTimeout(function(){
					var $form = $('DIV.tripPageTabsContent:visible .tripElementFormContainer FORM');
					ok( $form.length, 'Form for new element has loaded' );
					equals( $form.find("[name='trip_element[type_id]']").val(), 4, 'Element type is Accomm' );
					ok( $form.find("[name='trip_element[room_type]']").is(':visible'), 'Room type field is visible' );
					ok( $form.find("[name='trip_element[meal_plan]']").is(':visible'), 'Meal plan field is visible' );
					equals( $form.find("SELECT[name='trip_element[misc_type_id]']:visible").length, 0, 'Misc category list is hidden' );
					equals( $form.find("SELECT[name='trip_element[handler_id]']:visible").length, 0, 'Handler list is hidden' );
					equals( $form.find("SELECT[name='trip_element[depart_airport_id]']:visible").length, 0, 'Departure airport list is hidden' );
					equals( $form.find("SELECT[name='trip_element[arrive_airport_id]']:visible").length, 0, 'Arrival airport list is hidden' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});


			asyncTest("Open NEW GROUND form", 8, function(){

				var $tab = $('DIV.tripPageTabsContent:visible .timelineContent .timelineSwimlaneHead.isGround A').triggerLive('click');

				setTimeout(function(){
					var $form = $('DIV.tripPageTabsContent:visible .tripElementFormContainer FORM');
					ok( $form.length, 'Form for new element has loaded' );
					equals( $form.find("[name='trip_element[type_id]']").val(), 5, 'Element type is Ground Services' );
					equals( $form.find("[name='trip_element[room_type]']:visible").length, 0, 'Room type field is hidden' );
					equals( $form.find("[name='trip_element[meal_plan]']:visible").length, 0, 'Meal plan field is hidden' );
					equals( $form.find("SELECT[name='trip_element[misc_type_id]']:visible").length, 0, 'Misc category list is hidden' );
					equals( $form.find("SELECT[name='trip_element[handler_id]']:visible").length, 0, 'Handler list is hidden' );
					equals( $form.find("SELECT[name='trip_element[depart_airport_id]']:visible").length, 0, 'Departure airport list is hidden' );
					equals( $form.find("SELECT[name='trip_element[arrive_airport_id]']:visible").length, 0, 'Arrival airport list is hidden' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});


			asyncTest("Open NEW FLIGHT form", 8, function(){

				var $tab = $('DIV.tripPageTabsContent:visible .timelineContent .timelineSwimlaneHead.isFlight A').triggerLive('click');

				setTimeout(function(){
					var $form = $('DIV.tripPageTabsContent:visible .tripElementFormContainer FORM');
					ok( $form.length, 'Form for new element has loaded' );
					equals( $form.find("[name='trip_element[type_id]']").val(), 1, 'Element type is Airlines' );
					equals( $form.find("[name='trip_element[room_type]']:visible").length, 0, 'Room type field is hidden' );
					equals( $form.find("[name='trip_element[meal_plan]']:visible").length, 0, 'Meal plan field is hidden' );
					equals( $form.find("SELECT[name='trip_element[misc_type_id]']:visible").length, 0, 'Misc category list is hidden' );
					ok( $form.find("SELECT[name='trip_element[handler_id]']").is(':visible'), 'Handler list is visible' );
					ok( $form.find("SELECT[name='trip_element[depart_airport_id]']").is(':visible'), 'Departure airport list is visible' );
					ok( $form.find("SELECT[name='trip_element[arrive_airport_id]']").is(':visible'), 'Arrival airport list is visible' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});




			asyncTest("Save NEW FLIGHT", 8, function(){

				var $tab = $('DIV.tripPageTabsContent:visible .timelineContent .timelineSwimlaneHead.isFlight A').triggerLive('click');

				$form.find("INPUT[name='trip_element[flight_code]']").val('FLIGHT-123');
				$form.find("INPUT[name='trip_element[booking_code]']").val('PNR-123');
				$form.find("INPUT[name='trip_element[start_date]']").val('01-01-2020');
				$form.find("INPUT[name='trip_element[end_date]']").val('02-01-2020');

				var keyword = $tab.text();

				setTimeout(function(){
					ok( $form.find("SELECT[name='trip_element[arrive_airport_id]']").is(':visible'), 'Arrival airport list is visible' );
					start();
				},AJAX_TABS_WAIT_TIME);

			});

		});

	})(jQuery);

//},1000);