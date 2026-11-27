/**
 * Editor registration for the BelgradeBest Countdown for Expo 2027 Belgrade block.
 *
 * Written in plain JavaScript against the wp.* globals rather than JSX so the
 * plugin ships without a build step: the reviewer and the user read exactly
 * the code that runs. The preview is rendered by the same PHP as the front end.
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var __ = wp.i18n.__;
	var registerBlockType = wp.blocks.registerBlockType;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var useBlockProps = wp.blockEditor.useBlockProps;
	var ServerSideRender = wp.serverSideRender;
	var C = wp.components;

	// Code => the language's own name, printed by PHP from includes/labels.json.
	var NAMES = window.bbexpoCountdownLanguages || { en: 'English' };

	function languageOptions() {
		var options = [ { label: __( 'Same as the site (English if not available)', 'belgradebest-countdown-for-expo-2027-belgrade' ), value: 'auto' } ];
		Object.keys( NAMES ).forEach( function ( code ) {
			options.push( { label: NAMES[ code ], value: code } );
		} );
		return options;
	}

	function colourControl( key, label, placeholder, attributes, setAttributes ) {
		return el( C.TextControl, {
			key: key,
			label: label,
			help: __( 'Hex value such as', 'belgradebest-countdown-for-expo-2027-belgrade' ) + ' ' + placeholder + '. ' + __( 'Leave blank for the default.', 'belgradebest-countdown-for-expo-2027-belgrade' ),
			placeholder: placeholder,
			value: attributes[ key ],
			onChange: function ( value ) {
				var next = {};
				next[ key ] = value;
				setAttributes( next );
			}
		} );
	}

	registerBlockType( 'bbexpo/countdown', {
		edit: function ( props ) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;

			var settings = el(
				C.PanelBody,
				{ title: __( 'Countdown settings', 'belgradebest-countdown-for-expo-2027-belgrade' ), initialOpen: true },
				el( C.SelectControl, {
					label: __( 'Language', 'belgradebest-countdown-for-expo-2027-belgrade' ),
					value: attributes.lang,
					options: languageOptions(),
					onChange: function ( value ) {
						setAttributes( { lang: value } );
					}
				} ),
				colourControl( 'bg', __( 'Background colour', 'belgradebest-countdown-for-expo-2027-belgrade' ), '#f7f3ec', attributes, setAttributes ),
				colourControl( 'fg', __( 'Text colour', 'belgradebest-countdown-for-expo-2027-belgrade' ), '#211b16', attributes, setAttributes ),
				colourControl( 'accent', __( 'Accent colour', 'belgradebest-countdown-for-expo-2027-belgrade' ), '#b5462b', attributes, setAttributes )
			);

			var credit = el(
				C.PanelBody,
				{ title: __( 'Credit link', 'belgradebest-countdown-for-expo-2027-belgrade' ), initialOpen: false },
				el( C.ToggleControl, {
					label: __( 'Show a small "Countdown by BelgradeBest" link', 'belgradebest-countdown-for-expo-2027-belgrade' ),
					help: __( 'Off by default. The countdown works exactly the same either way.', 'belgradebest-countdown-for-expo-2027-belgrade' ),
					checked: !! attributes.credit,
					onChange: function ( value ) {
						setAttributes( { credit: !! value } );
					}
				} )
			);

			return el(
				Fragment,
				null,
				el( InspectorControls, null, settings, credit ),
				el(
					'div',
					useBlockProps(),
					el( ServerSideRender, {
						block: 'bbexpo/countdown',
						attributes: attributes
					} )
				)
			);
		},

		// Rendered in PHP on every request so the day count is always current;
		// nothing is saved into post content.
		save: function () {
			return null;
		}
	} );
} )( window.wp );
