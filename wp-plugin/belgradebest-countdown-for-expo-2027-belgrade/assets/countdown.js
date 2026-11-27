/**
 * BelgradeBest Countdown for Expo 2027 Belgrade: recounts the days in the visitor's own calendar.
 *
 * The countdown is complete without this script (PHP renders it). It only
 * matters when a page cache serves yesterday's HTML: it reads the labels the
 * PHP printed into data-bbexpo and updates the number and the line under it.
 * No requests, no cookies, no storage.
 */
( function () {
	'use strict';

	function form( lang, n ) {
		if ( 1 === n ) {
			return 0;
		}
		if ( ( 'sk' === lang || 'cs' === lang ) && n >= 2 && n <= 4 ) {
			return 1;
		}
		return 2;
	}

	function day( s ) {
		var p = String( s ).split( '-' );
		return new Date( +p[ 0 ], +p[ 1 ] - 1, +p[ 2 ] );
	}

	function update( box ) {
		var d;
		try {
			d = JSON.parse( box.getAttribute( 'data-bbexpo' ) );
		} catch ( e ) {
			return;
		}
		if ( ! d || ! d.open || ! d.close ) {
			return;
		}

		var now = new Date();
		var today = new Date( now.getFullYear(), now.getMonth(), now.getDate() );
		var open = day( d.open );
		var close = day( d.close );
		var days = null;
		var label;

		// Math.round absorbs the daylight-saving hour between two midnights.
		if ( today > close ) {
			label = d.ended;
		} else if ( today >= open ) {
			days = Math.round( ( close - today ) / 864e5 ) + 1;
			label = d.left[ form( d.lang, days ) ] + ' · ' + d.leftNote;
		} else {
			days = Math.round( ( open - today ) / 864e5 );
			label = d.until[ form( d.lang, days ) ] + ' · ' + d.untilNote;
		}

		var num = box.querySelector( '.bbexpo-countdown__num' );
		var line = box.querySelector( '.bbexpo-countdown__label' );
		if ( ! line ) {
			return;
		}
		if ( null === days ) {
			if ( num ) {
				num.parentNode.removeChild( num );
			}
		} else {
			if ( ! num ) {
				num = document.createElement( 'div' );
				num.className = 'bbexpo-countdown__num';
				line.parentNode.insertBefore( num, line );
			}
			num.textContent = String( days );
		}
		line.textContent = label;
		box.setAttribute( 'aria-label', d.title + ': ' + ( null === days ? '' : days + ' ' ) + label );
	}

	function run() {
		var boxes = document.querySelectorAll( '.bbexpo-countdown[data-bbexpo]' );
		for ( var i = 0; i < boxes.length; i++ ) {
			update( boxes[ i ] );
		}
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', run );
	} else {
		run();
	}
} )();
