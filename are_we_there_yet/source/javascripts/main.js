
//= require bootstrap
//= require bootstrap-scrollspy
//= require bootstrap-tooltip
//= require bootstrap-popover

// Enable the tooltip and popover elements
$(function () {
   // $("a[rel='tooltip']").tooltip();
   //$("a[rel='popover']").popover();

   $("a[rel='popover']").each(function() {

	   var content_id = $(this).data("content-id");

	   $(this).popover( {
		 delay: { show: 0, hide: 1000 },
		 content:  function() {
			// data-content has the html content #id-value
			return $( content_id ).html();
			},
		}) // end of val.popover(...) 
  }); // end of "for each rel = popover"


}); // end of "function"
