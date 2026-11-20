<?php
/**
 * Uninstall routine.
 *
 * The plugin stores no options of its own. Classic widget instances live in
 * the widget option WordPress keeps for this widget, so removing that key is
 * the whole cleanup. Blocks and shortcodes are post content and are left alone.
 *
 * @package Countdown_For_Expo_2027_Belgrade
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'widget_bbexpo_countdown' );

if ( is_multisite() ) {
	delete_site_option( 'widget_bbexpo_countdown' );
}
