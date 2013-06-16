// Get the namespace.
var EXANIMO = EXANIMO || {};

/**
 *
 * StateManager
 *
 *     Adds state management (back button and deep-linking) to your single-page
 *     web application.
 *
 *     For usage instructions, see
 *     <http://exanimo.com/javascript/using-the-statemanager-in-ajax-apps>.
 *
 *     copyright 2007 matthew john tretter.  available under the MIT License.
 *     (<http://www.opensource.org/licenses/mit-license.php>)
 *
 *     Modified 2007 July 11 by R. White:
 *     - to work (sort of) in Safari 3 beta
 *     - to add public getStateID() function
 *     - to ignore state changes if new state is same as current state

 *     @author     matthew at exanimo dot com
 *     @version    2007.04.30
 *
 */


(function()
{
	// Create the package.
	EXANIMO.managers = EXANIMO.managers || {};

	//
	// "Private" properties.
	//

	var _initialized = false;
	var _checkInterval;
	var _method;
	var _swf;
	var _oldStateID;
	var _preventPageRefresh = false;
	var _iframeID = 'EXANIMO-managers-StateManager-iFrame';
	var _e;
	function _self()
	{
		return EXANIMO.managers.StateManager;
	}

	// Decide which method to use by (blech!) browser sniffing.
	// Original version:
	// var _method = navigator.appName.indexOf('Microsoft Internet') != -1 ? 'IFRAME' : navigator.userAgent.indexOf('Safari') != -1 ? 'LINK' : 'HASH';

	// Modified 2007 July 6 by RLW to see if I can get Safari 3 to work:
	_method = navigator.appName.indexOf('Microsoft Internet') != -1 ?  'IFRAME' :
		(navigator.userAgent.indexOf('Safari') != -1  &&
		navigator.userAgent.indexOf('Version/3') < 0) ? 'LINK' : 'HASH';


	/**
	 *
	 * Retrieves state ID.
	 *
	 *     @return    the id of the current state
	 *
	 */
	function _getStateID()
	{
		var f = window.location.href.split('#');
		if (f.length > 2) f[1] = f.slice(1).join("#");
		return f[1] || _self().defaultStateID;
	}

	/**
	 *
	 * Gets the SWF that has been "setup" (i.e. has the callback added). This
	 * prevents the user from having to call StateManager.initialize(mySWF) in
	 * their JavaScript.
	 *
	 */
	function _getSWF()
	{
		var tags = ['object', 'embed'];
		for (var i = 0; i < tags.length; i++)
		{
			var a = document.getElementsByTagName(tags[i]);
			for (var j = 0; j < a.length; j++)
			{
				if (a[j].dispatchStateChangeEvents)
				{
					return a[j];
				}
			}
		}
		return null;
	}

	/**
	 *
	 * Dispatches a stateChange event.
	 *
	 *     @param stateID    the id of the state to load
	 *     @param manual     was the stateChange manual? manual changes
	 *                       are the result of calls to setState. (automatic
	 *                       changes are the result of the back / forward
	 *                       buttons or deep-linking.)
	 *
	 */
	function _dispatchEvent(stateID, manual)
	{
		stateID = stateID || _self().defaultStateID;

		if (!_swf)
		{
			//
			// AJAX mode
			//

			_e = {id: stateID};
			var f;

			// If a handler is set, call it.
			f = _self().onstatechange;
			if (f) {
				_e.type = 'stateChange';
				f(_e);
			}

			if (manual)
			{
				f = _self().onstateset;
				if (f) {
					_e.type = 'stateSet';
					f(_e);
				}
			}
			else
			{
				f = _self().onstaterevisit;
				if (f) {
					_e.type = 'stateRevisit';
					f(_e);
				}
			}

			_e = null;
		}
		else if (!manual)
		{
			//
			// SWF mode
			//
			_swf.dispatchStateChangeEvents(stateID);
		}
	}

	var _setHash = (function()
	{
		switch(_method)
		{
			case 'HASH':

				return function(stateID)
				{
					window.location.hash = stateID == _self().defaultStateID ? '#' : stateID;
					_oldStateID = stateID;
				};

			case 'IFRAME':

				return function(stateID)
				{
					_preventPageRefresh = true;
					var iframe = document.getElementById(_iframeID);

					frames[_iframeID].document.open();
					frames[_iframeID].document.write('<script>parent.document.location.hash = "' + (stateID == _self().defaultStateID ? '#' : stateID) + '"; /* Wait for IE to impose its title before setting ours. */ setTimeout( function(){ parent.EXANIMO.managers.StateManager._updateIFrame("' + stateID + '"); }, 0);</script>');
					frames[_iframeID].document.close();
				};

			case 'LINK':

				return function(stateID)
				{
					_preventPageRefresh = true;

					var a = document.createElement('a');
					a.setAttribute('href', stateID == _self().defaultStateID ? '#' : '#' + stateID);

					var evt = document.createEvent('MouseEvents');
					evt.initEvent('click', true, true);
					a.dispatchEvent(evt);

					document.location.EXANIMO.managers.StateManager.stateList.push(stateID);
				};

			default:
				return function(stateID) {};
		}
	})();

	EXANIMO.managers.StateManager = {

		CHECK_RATE: 100,
		onstatechange: null,
		onstateset: null,
		onstaterevisit: null,
		DEFAULT_STATE: 'defaultState',
		defaultStateID: 'defaultState',

		/**
		 *
		 * Does all the behind-the-scenes startup work for the StateManager.
		 *
		 *     @param swf    (optional) the SWF to add state management to. if
		 *                   the boolean value true is passed, the StateManager
		 *                   will use the swf returned by _getSWF(). if no
		 *                   argument is passed, the StateManager will operate
		 *                   in "ajax mode".
		 *
		 */
		initialize: function(swf)
		{
			if (_initialized) return;
			_initialized = true;
			_swf = (swf) ? _getSWF() : swf;

			switch(_method)
			{
				case 'HASH':

					_oldStateID = _getStateID() == _self().defaultStateID ? _self().defaultStateID : null;

					// Watch to see if the hash changes.
					var checkForHashChange = function()
					{
						var stateID = _getStateID();

						if (stateID != _oldStateID)
						{
							_oldStateID = stateID;
							_dispatchEvent(stateID);
						}
					};

					_checkInterval = setInterval(checkForHashChange, _self().CHECK_RATE);

					break;

				case 'IFRAME':

					//
					// Make sure the iframe knows that, when it loads, it should
					// not refresh this page.
					//
					_preventPageRefresh = true;

					// Create and attach the iframe.
					var iframe = document.createElement('iframe');
					iframe.setAttribute('src', 'about:blank');
					iframe.setAttribute('name', _iframeID);
					iframe.setAttribute('id', _iframeID);
					iframe.style.visibility = 'hidden';
					iframe.style.width = '0';
					iframe.style.height = '0';
					iframe.style.position = 'absolute';
					iframe.style.overflow = 'hidden';
					document.body.appendChild(iframe);

					// If a state id is already present in the hash, go to it.
					var stateID = _getStateID();
					if (stateID != _self().defaultStateID)
					{
						setTimeout(
							function()
							{
								_dispatchEvent(stateID);
							},
							0);
					}

					// Update the page and hash from the iframe.
					frames[_iframeID].document.open();
					if (stateID)
						frames[_iframeID].document.write('<script>parent.document.location.hash = "' + (stateID == _self().defaultStateID ? '' : stateID) + '"; parent.EXANIMO.managers.StateManager._updateIFrame("' + stateID + '");</script>');
					else
						frames[_iframeID].document.write('<script>parent.document.location.hash = ""; parent.EXANIMO.managers.StateManager._updateIFrame();</script>');
					frames[_iframeID].document.close();

					break;

				case 'LINK':

					document.location.EXANIMO = document.location.EXANIMO || {};
					document.location.EXANIMO.managers = document.location.EXANIMO.managers || {};
					document.location.EXANIMO.managers.StateManager = document.location.EXANIMO.managers.StateManager || {};

					var loc = document.location.EXANIMO.managers.StateManager;

					// Make sure the last state is loaded when you come back to
					// this page after navigating away.
					window.onunload = function()
					{
						loc.oldHistoryLength = -1;
					};

					if (loc.deepLink && loc.deepLink != _self().defaultStateID)
					{
						loc.oldHistoryLength = -1;
						loc.deepLink = null;
					}

					// Create a list of the states we click through.
					if (typeof loc.stateList == 'undefined')
					{
						loc.stateList = [_getStateID() || _self().defaultStateID];
						loc.deepLink = loc.stateList[0];

						loc.offset = history.length - 1;
						while (loc.offset)
						{
							loc.stateList.unshift(null);
							loc.offset--;
						}
						delete loc.offset;

						loc.oldHistoryLength = document.location.hash ? -1 : history.length;

					}

					// Watch to see if the length of the history object changes.
					var checkForHistoryLengthChange = function()
					{
						var loc = document.location.EXANIMO.managers.StateManager;

						if (_preventPageRefresh)
						{
							_preventPageRefresh = false;
							loc.oldHistoryLength = history.length;
							return;
						}

						if (history.length != loc.oldHistoryLength)
						{
							var stateID = loc.stateList[history.length - 1];

							_dispatchEvent(stateID);
							loc.oldHistoryLength = history.length;
						}
					};

					_checkInterval = setInterval(checkForHistoryLengthChange, _self().CHECK_RATE);

					break;

				default:
					break;

			}
		},


		/**
		 *
		 * Adds an entry to the history.
		 *
		 *     @param stateID       a unique identifier corresponding to a
		 *                          specific state
		 *
		 */
		setState: function(stateID, title)
		{
			// Return immediately if state does not change
			if (stateID == _getStateID()) return;

			// Set the title.
			if (title) _self().setTitle(title);

			// Block infinite loops.
			if (_e) return;

			_setHash(stateID);

			// Dispatch the stateChange events
			_dispatchEvent(stateID, true);
		},


		/**
		 *
		 * Retrieves state ID.
		 *
		 *     @return    the id of the current state
		 *
		 */
		getStateID: function()
		{
			return _getStateID();
		},

		/**
		 *
		 * Sets the window's title.
		 *
		 *     @param title    the string to put in the browser's title bar
		 *
		 */
		setTitle: function(title)
		{
			window.document.title = title || ' ';
		},


		/**
		 *
		 * Updates the iframe. Must be public so that it can be accessed from
		 * the iframe.
		 *
		 *     @param stateID    the id of the state to record
		 *
		 */
		_updateIFrame: function(stateID)
		{
			if (!_preventPageRefresh)
			{
				_dispatchEvent(stateID);
			}

			_preventPageRefresh = false;
		}

	};

})();



// Copyright (c) 2007 matthew john tretter.  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
