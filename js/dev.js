/**
 * Development environment properties and methods.
 * @type class
 */
var ThisIsDev = (function(){
	var constructor = function()
	{
		/**
		 * Stick a (modal) notice up that this is a dev environment
		 * requires jQuery + Bootstrap - http://twitter.github.com/bootstrap
		 */
		this.notice = function(domId){
			$('#'+domId).prepend('<div id=dev-modal class="modal hide fade" tabindex=-1 role=dialog aria-labelledby=dev-modal-label aria-hidden=true><div class=modal-header><button type=button class=close data-dismiss=modal aria-hidden=true>x</button><h3 id=dev-modal-label class=warning-text>Warning!</h3></div> <div class="modal-body"><p>This site is in active development. It may show inaccurate information, and often breaks.</p></div><div class="modal-footer"><button class=btn data-dismiss=modal aria-hidden=true>I understand</button></div></div>');
			$('#dev-modal').modal({});
		};
	};
	return constructor;
})();