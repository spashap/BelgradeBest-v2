<?php
/**
 * Server-side render for the bbexpo/countdown block.
 *
 * Receives $attributes from WordPress. All escaping and validation happens in
 * BBExpo_Countdown, which the shortcode and the classic widget share.
 *
 * @package Countdown_For_Expo_2027_Belgrade
 *
 * @var array $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

printf(
	'<div %1$s>%2$s</div>',
	wp_kses_data( get_block_wrapper_attributes() ),
	BBExpo_Countdown::render( isset( $attributes ) ? $attributes : array() ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built and escaped in BBExpo_Countdown.
);
