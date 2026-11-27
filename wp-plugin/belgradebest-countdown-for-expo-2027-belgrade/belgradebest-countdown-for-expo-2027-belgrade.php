<?php
/**
 * Plugin Name:       BelgradeBest Countdown for Expo 2027 Belgrade
 * Plugin URI:        https://belgradebest.com/expo-2027/countdown
 * Description:       A live countdown to Expo 2027 Belgrade (15 May – 15 August 2027) in eight languages. Block, shortcode and classic widget. No external requests, no cookies, no tracking.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            BelgradeBest
 * Author URI:        https://belgradebest.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       belgradebest-countdown-for-expo-2027-belgrade
 *
 * @package BelgradeBest_Countdown_For_Expo_2027_Belgrade
 */

defined( 'ABSPATH' ) || exit;

define( 'BBEXPO_COUNTDOWN_VERSION', '1.0.0' );
define( 'BBEXPO_COUNTDOWN_FILE', __FILE__ );
define( 'BBEXPO_COUNTDOWN_DIR', plugin_dir_path( __FILE__ ) );

require_once BBEXPO_COUNTDOWN_DIR . 'includes/class-bbexpo-countdown.php';
require_once BBEXPO_COUNTDOWN_DIR . 'includes/class-bbexpo-legacy-widget.php';

/**
 * Registers the scripts and the stylesheet.
 *
 * The editor script is registered by hand rather than through a generated
 * index.asset.php: the plugin ships without a build step, so the dependency
 * list has to be declared somewhere, and block.json refers to these handles.
 * The front-end script only corrects the day count for visitors whose page was
 * served from a cache; the countdown is fully rendered in PHP without it.
 */
function bbexpo_countdown_register_assets() {
	wp_register_style(
		'bbexpo-countdown',
		plugins_url( 'assets/countdown.css', BBEXPO_COUNTDOWN_FILE ),
		array(),
		BBEXPO_COUNTDOWN_VERSION
	);

	wp_register_script(
		'bbexpo-countdown',
		plugins_url( 'assets/countdown.js', BBEXPO_COUNTDOWN_FILE ),
		array(),
		BBEXPO_COUNTDOWN_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	wp_register_script(
		'bbexpo-countdown-editor',
		plugins_url( 'blocks/countdown/index.js', BBEXPO_COUNTDOWN_FILE ),
		array(
			'wp-blocks',
			'wp-block-editor',
			'wp-components',
			'wp-element',
			'wp-i18n',
			'wp-server-side-render',
		),
		BBEXPO_COUNTDOWN_VERSION,
		true
	);

	// The editor offers the language list from the same table the renderer uses.
	wp_add_inline_script(
		'bbexpo-countdown-editor',
		'window.bbexpoCountdownLanguages = ' . wp_json_encode( BBExpo_Countdown::language_names() ) . ';',
		'before'
	);
	wp_set_script_translations( 'bbexpo-countdown-editor', 'belgradebest-countdown-for-expo-2027-belgrade' );
}
add_action( 'init', 'bbexpo_countdown_register_assets', 5 );

/**
 * Registers the block and the shortcode.
 */
function bbexpo_countdown_init() {
	register_block_type( BBEXPO_COUNTDOWN_DIR . 'blocks/countdown' );
	add_shortcode( 'bbexpo_countdown', 'bbexpo_countdown_shortcode' );
}
add_action( 'init', 'bbexpo_countdown_init' );

/**
 * Shortcode: [bbexpo_countdown lang="de" bg="#ffffff" fg="#222222" accent="#b5462b" credit="no"].
 *
 * @param array|string $atts Shortcode attributes.
 * @return string
 */
function bbexpo_countdown_shortcode( $atts ) {
	$atts = shortcode_atts( BBExpo_Countdown::defaults(), is_array( $atts ) ? $atts : array(), 'bbexpo_countdown' );
	return BBExpo_Countdown::render( $atts );
}

/**
 * Classic widget registration runs on its own hook.
 */
function bbexpo_countdown_register_legacy_widget() {
	register_widget( 'BBExpo_Countdown_Legacy_Widget' );
}
add_action( 'widgets_init', 'bbexpo_countdown_register_legacy_widget' );
