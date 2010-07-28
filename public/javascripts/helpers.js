(function($){

	var	guid = 0,	// Used by the jQuery.fn.id() method.
		undefined,	// Speeds up test for undefined variables.
		ELEMENT_URL_ATTR = 'data-ajax-url';


// Javascript helper functions: (The window. prefix ensures functions are shared globally)

	// Helper to ensure we concatenate folders correctly to make a valid url:
	 window.buildPath = function(folders){
		return $.map(arguments, function(folder,i){ return folder.replace(/^\/*|\/*$/g,"") }).join("/");
	}
	/* This comment only exists to overcome IDE's belief that the preceeding regex started a comment block! */


	// Swap every placeholder {name} in a string with it's corresponding value:
	// Eg: interpolate( 'The {speed} brown {animal} jumped...', { speed:'quick', animal:{fox} } ) => 'The quick brown fox jumped...'
	window.interpolate = function(template, data){
		$.each( data||{}, function(key,val){
			template = template.replace( '{'+key+'}', val, 'g' );
		});
		return template;
	};


	// Immediate if and unless:
	
	window.iif = function( condition, trueResult, falseResult ){

		function isFunction( obj ) {
			return toString.call(obj) === '[object Function]';
		}

		return ( isFunction(condition) ? condition() : condition )
			? ( isFunction(trueResult) ? trueResult() : trueResult )
			: ( isFunction(falseResult) ? falseResult() : falseResult );

	};
	
	window.unless = function( condition, falseResult, trueResult ){

		return window.iif( condition, trueResult, falseResult );

	};






// Custom jQuery selectors:

  $.extend($.expr[':'],{

	// Selector for finding links that are 'mailto' links:
	mailto : function(elem) {
	  return $(elem).is("A[href^=mailto]");
	},

	// Selector for matching a regex: (Eg: $('A:regex(href,clients\\/[0-9]+)');  )
	// See: http://james.padolsey.com/javascript/regex-selector-for-jquery
	regex : function(elem, i, match){
		var matchParams = match[3].split(','),
			validLabels = /^(data|css):/,
			attr = {
				method  : matchParams[0].match(validLabels) ? matchParams[0].split(':')[0] : 'attr',
				property: matchParams.shift().replace(validLabels,'')
			},
			regexFlags = 'ig',
			regex = new RegExp( matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags );
		return regex.test( $(elem)[attr.method](attr.property) );
	},
	
	// TODO: allow for domain name in href!. Selector for matching resource URLs: (Eg: $("A:resource(/clients/[0-9]+)") )
	resource : function(elem, i, match){

		var uriAttrFor	= { A:'href', FORM:'action', OPTION:'value' },
			pattern		= match[3].replace('/','\/'),							// Escape any forward slashes.
			prefix		= pattern.indexOf('/') === 0 ? '^' : '',				// Prefix with ^ when uri begins with /.
			regex		= new RegExp( prefix + pattern + '\/?([\?#]|$)', 'i' ),	// uri + optionalSlash + ? or # or end-of-string.
			attr		= uriAttrFor[ elem.nodeName.toUpperCase() ] || 'value',
			uri			= $(elem).attr(attr);

		return regex.test(uri);

	}

  });

	//alert( (new RegExp( '\/clients\/[0-9]+\/?([\?#]|$)', 'i' )).test( '/clients/1234' )  )







// Custom jQuery methods and helpers:

$.fn.extend({

  // Get/set data stored in class attribute:
  //  classData : function(name,value){
  //
  //	var values = (" " + $(this).attr("class") + " ").split(" {").pop().split("} ").shift();
  //	var data = {};
  //	var array = $.map( values.split(","), function(pair){
  //	  pair = pair.split(":");
  //	  data[pair[0]] = pair[1];
  //	});
  //
  //	if(value){
  //	  data[name] = value;
  //	  $.each(data, function(){
  //		
  //	  })
  //	}
  //
  //	return value===undefined ? data[name] : this;
  //  },



	// Get/set element id: (Get will generate and set ids on elements that doe not have one yet)
	id : function(id,prefix){
	
		if(id)
			return this.attr({id:id});
		else
			return this.not('[id]').each(function(){
				$(this).attr({ id: ( prefix || 'id__' ) + guid++ });
			})
			.end().attr('id');

	},





	// Return the extra value stored in list item text attribute in brackets:
	// Eg: "Air Iceland [GBP]" => "GBP"
	textVal : function(delimBefore, delimAfter){
		delimBefore = delimBefore || '[';
		delimAfter  = delimAfter  || ']';
		var txt = this.find(">OPTION:selected, >OPTGROUP>OPTION:selected").andSelf().filter("OPTION").text();
		return txt.split(delimAfter).shift().split(delimBefore).pop();
	},




	// Plugin to apply maxlength limit to <textarea> fields: (Reads the maxlength="nnn" attribute just like textboxes)
	textareaMaxlength : function(options){

		options = $.extend( {
			maxlength	: 10000,	// This setting will be applied on textareas that have no maxlength attribute.
			keys		: /\w|\s/	// Alphanumerics and whitespace.
		}, options );

		return this.live('keydown', function(e){	// We use keydown because it is cancelable.

			var $textarea = $(this),
				max = parseInt( $textarea.attr('maxlength') ) || options.maxlength,
				len = $textarea.val().length;

			// Only interfere when textbox is full:
			if( max && len >= max ){
				// We avoid truncating if possible because it can cause jumpy effect on scrolling textboxes:
				if( len > max ){
					$textarea.val( $textarea.val().substr(0,max) );
					return false;
				// Block alphanumeric unless ctrl or alt are pressed:
				}else if( options.keys.test( String.fromCharCode(e.keyCode) ) && !e.ctrlKey && !e.altKey ){
					return false;
				}

			}
		});

	},




	// Plugin to limit the minimum and/or maximum number of related checkboxes that are ticked:
	// Related checkboxes could be considered like a group of radio buttons.
	checkboxLimit : function(options){

		// Apply defaults for missing options:
		options = $.extend( {}, {
		
			min			: 1,			// Minimum limit of checked checkboxes. Zero or null means no limit.
			max			: 0,			// Maximum limit of checked checkboxes. Zero or null means no limit.
			associates	: ':checkbox',	// Selector, element or parent-element for locating related checkboxes.
			ignore		: '[disabled]',	// Allows us to exclude certain checkboxes when we count the number of checked checkboxes.
			toggle		: false			// When true, select the next alternative when min is breached. (Otherwise cancel the click event)

		}, options );

		options.min = options.min || 0;
		options.max = options.max || 0;

		return this.live('click', function(){

			var $clickedBox = $(this);
			var $associates = $clickedBox.cousins( options.associates, true );

			// Allow for when options.associates returns container elements not the checkboxes themselves:
			var $checkboxes = $associates.find(':checkbox').andSelf().add($clickedBox).filter(options.associates).not(options.ignore).filter(':checkbox');

			var $checked   = $checkboxes.filter(':checked');
			var $unchecked = $checkboxes.not(':checked');

			// console.log( 'min', options.min, 'associates:', $associates.length, 'checkboxes:', $checkboxes.length, 'checked:', $checked.length, 'unchecked', $unchecked.length );

			// When UN-CHECKING a box, apply MINUMIM limit:
			if( options.min && $clickedBox.is(':not(:checked)') && $checked.length < options.min ){

				// Fetch the first alternative unchecked box in case we need it:
				var $alternative = $unchecked.not($clickedBox).eq(0);

				// When toggle option is set, allow clicked box to be unchecked but check an alternative box instead:
				if( !options.toggle || $alternative.attr({ checked:'checked' }).length === 0 ){

					// Otherwise cancel the click event to prevent clicked box from being unchecked:
					$clickedBox.triggerHandler('checkboxMinLimit')
					return false;

				}

			}

			// When CHECKING a box, apply MAXUMIM limit:
			else if( options.max && $clickedBox.is(':checked') && $checked.length > options.max ){

				// Fetch the first alternative checked box in case we need it:
				var $alternative = $checked.not($clickedBox).eq(0);

				// When toggle option is set, allow clicked box to be checked but uncheck an alternative box instead:
				if( !options.toggle || $alternative.removeAttr('checked').length === 0 ){

					// Otherwise cancel the click event to prevent clicked box from being checked:
					$clickedBox.triggerHandler('checkboxMaxLimit')
					return false;

				}
			}

		}).end();

	},





	// Sort a collection of elements:
	sort : function() {
		return this.pushStack( jQuery.makeArray( [].sort.apply(this,arguments) ) );
	},



	// Return the maximum attribute value from a set of elements:
	// UNUSED?
	//attrMax : function( attr ){

	//	var max = undefined; attr = attr || 'value';

	//	this.each(function(){
	//		var val = $(this).attr(attr)
	//		if( val !== undefined && !val.isNaN ){
	//			max = (max === undefined || max.isNaN) ? val : Math.max( max, val );
	//		}
	//	});

	//	return max;

	//},




	// Plugin to return siblings that are within siblings of parents! Rudimentary but worked for the context I needed it.
	// When deep is true, we also search down the dom inside each parent, uncle, great uncle etc.
	// TODO: Improve performance. Try using concat() instead of $.merge() then rely on pushStack to do the dedupuing.
	cousins : function(sel,deep){

		var $self = this;
		var results = [];
		
		sel = ( sel.charAt(0)==='>' ? '' : '>' ) + (sel || '*');
		if(deep) sel = sel.substr(1);	// Remove leading ">" when deep is specified (slower)

		$self.each(function(){
		  //$.merge( results, $(this).parents(":has('" + sel + "'):first").find(sel).not(this) );
		  $.merge( results, $(this).parents().filter(function(){
			return $(this).find(sel).not($self).length;
		  }).find(sel).not($self) );
		});
		return this.pushStack(results);
		//return this.pushStack( this.parents("[" + a + "]:first").find(a).not( orSelf ? [] : this ).get() );
	},


	// Utility method to return an element's entire html:
	outerHtml : function(){
		return $("<div/>").append( this.clone() ).html();
	},


	



	// Custom method for reloading elements via ajax. Rather like jQuery's load method.
	// The params and callback arguments are both optional.
	// Specify self=true to reload the actual element, not it's contents!
	reload : function(url,params,callback,self){

		// Allow for optional parameters:
		//var args = $.makeArray(arguments);
		if( arguments.length && arguments[arguments.length-1] === true ){
		self = true;
		arguments.length = arguments.length-1;
		}
		if( $.isFunction(url)	   ){ callback = url;	url	= null; } else
		if( $.isFunction(params)	){ callback = params; params = null; };
		if( typeof url === "object" ){ params   = url;	url	= null; };
		if( typeof url !== "string" ){ url	  = "" }
		var result = [];

		this.each(function(){

		  // Derive url from custom attributes if not specified as an argument:
		  var $elem = $(this), $parent = $elem.parent();
		  elemUrl = url || $elem.attr("href") || $elem.attr(ELEMENT_URL_ATTR);
		  if(!self){
			  $parent = $elem;
			  $elem   = $elem.children();
		  }

		  // Load the replacement:
		  if( elemUrl ) {
			  result.push( $.get(elemUrl, params, function(response,textStatus,xhr){

				  if( !callback || callback.apply(this,arguments) !== false ){

					  $elem.fadeOut("slow", function(){

						  $(this).remove();
						  $(response).hide().appendTo( $parent ).fadeIn("slow");
					  });

				  };

			  }) );
		  };

		});

		return result;  // Array of XHRs

	},




  // Keep a copy of jQuery's original ajax method before we override it:
  __load : $.fn.load,


  // This new version uses beforeComplete to ensure the options hash and target are available to the callback:
  // Warning: This will always use HTTP GET. (The native load method uses POST if params is a hash)
  load : function(url,params,callback){

	var target = this;
	if( $.isFunction(params) ){ callback = params; params = null };

	// Note the original beforeComplete callback so we can restore it at the end of this function:
	origBeforeComplete = $.ajaxSettings.beforeComplete;

	// Wrap the original beforeComplete callback in a new one that is aware of the extra arguments:
	$.ajaxSetup({
	  beforeComplete : function(xhr, status, options){

		xhr.options		= xhr.options || options || {};
		xhr.options.target = target;
		xhr.options.url	= options.url || url;

		// Call the original beforeComplete callback:
		// Important: this receives the same arguments as the normal "complete" callback.
		if(origBeforeComplete)
		  origBeforeComplete.apply( target, arguments );
	  }
	});

	// Define a new ajax "complete" callback:
	// Important: this receives the same arguments as the normal "load" callback.
	var newCallback = function(text, status, xhr, options){

	  // Thanks to the enhanced (hacked!) ajax method we can also pass the options hash to the callback:
	  // Unfortunately the load method wraps the callback with it's own function so it loses the options argument.
	  // Hence we rely on the new ajax method to smuggle it through as a custom property of the xhr:
	  if( callback )
		return callback.apply( target, arguments );	// Call original "load" callback.

	};

	// Call jQuery's native load method with our customised callback:
	// We serialise the params to a string to prevent native method from assuming HTTP POST.
	var result = this.__load(url, $.param(params||'') ,newCallback);

	// Restore the original beforeComplete callback to the way it was:
	$.ajaxSetup({ beforeComplete: origBeforeComplete });
	return result;
  },





// "Domain specific" (DSL) helper methods:


	// Attempt to get the target element from a link or button or listitem etc:
	link : function(){

		// Clicked element is usually <a href="url" rel="#elementid"> ...
		var $form	= this.closest('FORM');
		var url		= this.attr('href') || this.attr('action') || $form.attr('action') || '';
		var target	= targetOf( this );
		var method	= $form.find('INPUT[name=_method]').val() || $form.attr('method');

		// ...but it might be something like <option value="url"> or
		// <select href="/suppliers/{value}/edit"><option value="123">...
		if( this.is('OPTION') ){
			var $list	= this.closest('SELECT');
			target		= target || targetOf( $list );
			url			= url.indexOf('/') >= 0 ? url : urlOf( $list );
			url			= url.replace( '{value}', this.val() || '' ).replace( '{text}', this.text() || '' );
		}

		// If target is .ajaxPanel then find parent ajaxPanel, otherwise search for closest match:
		if( !target || target == '.ajaxPanel' )
			var $target = this.closest('.ajaxPanel');
		else
			var $target = this.cousins(target, true);

		// Ensure target has an id attribute by calling our custom getter method:
		$target.id();


		// Return a simple hash of properties:
		return {
			target	: $target,
			url		: url,
			method	: method,
			form	: $form[0]
		};


		// Helper functions for reading attributes:
		function targetOf( $elem ){
			$elem.attr('rel' ) || $elem.attr('target' ) || $elem.attr('data-rel' ) || $elem.attr('data-target' ) || $elem.attr('data-url' ) || '';
		}
		function urlOf( $elem ){
			$elem.attr('href' ) || $elem.attr('action' ) || $elem.val() || '';
		}

	},


	// Derive the start day of an element by parsing it's dayX css class:
	day : function(){
		return parseFloat( this.attr("class").replace( /^.*\sday([0-9]+).*$/g, "$1" ) || 1 );
	},



	// Derive the duration of an element by parsing it's daysX css class:
	days : function(){
		return parseFloat( this.attr("class").replace( /^.*\sdays([0-9]+).*$/g, "$1" ) || 1 );
	},



	// Given a DIV.timelineContent element, generate it's adjacent DIV.timelineOverview:
	timelineOverview : function(){

		this.filter('.timelineContent').each(function(){

			var $timeline = $(this);
			var $overview = $timeline.siblings('.timelineOverview');

			// Generate new overview elements by cloning the timeline elements:
			// (Fetch array of 'swimlanes' representing each trip element type: Flight, Accommodation etc)
			var $elements = $timeline.find('> DL > DD.timelineSwimlane > UL.timelineElements').clone();

			// Derive trip length from the first UL.daysX css class:
			var trip_days = $elements.days();

			// Remove unwanted class and child elements to reduce bloat and unexpected side effects:
			$elements.children("LI")
			.empty()	//.children().remove().end()
			.removeClass("is_subgroup hasAdults hasChildren hasInfants noSingles")

			// Calculate the x-coordinate and width of each element in the Overview:
			.each(function(){

				var $elem	= $(this);
				var day		= $elem.day() - 1;
				var days	= $elem.days();
				var percentOfTrip		= 100 * days / trip_days;
				var percentThroughTrip	= 100 * day  / trip_days;

				$elem.css({
					left  : percentThroughTrip + '%',
					width : percentOfTrip + '%'
				});
			});

			$elements.hide().appendTo( $overview.empty() ).fadeIn('slow');

		});

	}

});






// Customise jQuert core methods: (Not the same as $.fn.extend!)

$.extend({

  // Keep a copy of jQuery's original ajax method before we override it:
  __ajax : $.ajax,

  // Wrap the original ajax method with our own enhanced version:
  // This new version handles beforeSuccess and beforeComplete callbacks and passes the options hash to them too:
  ajax : function(options) {

	  var effectiveOptions = $.extend( {}, $.ajaxSettings, options );

	  // Set up new beforeSuccess and beforeComplete callbacks then call jQuery's native ajax method:
	  $.each( "success,complete".split(","), function(i,ajaxEvent){

		// Keep a reference to the original callback functions:
		var beforeName	 = "before" + ajaxEvent.replace( /^([a-z])/, function(m,$1){ return $1.toUpperCase() } ),
			beforeCallback = options[beforeName] || $.ajaxSettings[beforeName],
			origCallback   = options[ajaxEvent]  || $.ajaxSettings[ajaxEvent];

		if( origCallback || beforeCallback ){

			// Replace the normal callback with a new one that calls both the before and after callbacks:
			options[ajaxEvent] = function(args){

			// Because jQuery's callbacks (success, error and complete) receive different arguments (groan!)
			// we must ensure we pass them through in the order we receive them. We also want to pass the
			// ajax options hash so we add it to the arguments. We'll also smuggle it through
			// as a custom property of the XMLHttpRequest object to help the load method: (see $.fn.load)
			// Gets around most issues but still required change to lines 570 & 580 of ui.tabs.js.
			var xhr, args = $.makeArray(arguments);
			$.each(args, function(i,arg){ if(arg && arg.readyState !== undefined){
			  // Fails in IE!
			  arg.options = $.extend( effectiveOptions, arg.options ); // Ensure we don't override xhr.options.target
			}});
			args.push(effectiveOptions);


			if( !beforeCallback || beforeCallback.apply( this, args ) !== false )
			  if( origCallback )
				return origCallback.apply( this, args );

		  };
		};
	  });

	  // Call the original ajax method with our enhanced callbacks:
	  return $.__ajax(options);

  }

});


//window.setTimeout( function(){ alert( $('TD').attrMax('colSpan') ) }, 10000 )

})(jQuery);

