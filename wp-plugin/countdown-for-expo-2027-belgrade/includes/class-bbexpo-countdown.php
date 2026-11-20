<?php
/**
 * The countdown: languages, day arithmetic, sanitising and markup.
 *
 * Shared by the block, the shortcode and the classic widget so the three entry
 * points cannot drift apart. The labels live in includes/labels.json, the same
 * table the countdown embed on belgradebest.com is built from.
 *
 * @package Countdown_For_Expo_2027_Belgrade
 */

defined( 'ABSPATH' ) || exit;

/**
 * Renders the Expo 2027 Belgrade countdown.
 */
class BBExpo_Countdown {

	/**
	 * Default colours (background, text, accent).
	 */
	const DEFAULT_BG     = '#f7f3ec';
	const DEFAULT_FG     = '#211b16';
	const DEFAULT_ACCENT = '#b5462b';

	/**
	 * Decoded labels.json, cached for the request.
	 *
	 * @var array|null
	 */
	private static $data = null;

	/**
	 * Returns the decoded label table.
	 *
	 * @return array
	 */
	public static function data() {
		if ( null === self::$data ) {
			$decoded    = wp_json_file_decode( BBEXPO_COUNTDOWN_DIR . 'includes/labels.json', array( 'associative' => true ) );
			self::$data = is_array( $decoded ) ? $decoded : array();
		}
		return self::$data;
	}

	/**
	 * Language codes the countdown can display.
	 *
	 * @return string[]
	 */
	public static function languages() {
		$data = self::data();
		return isset( $data['languages'] ) ? array_keys( $data['languages'] ) : array( 'en' );
	}

	/**
	 * Language code => the language's own name, for the settings controls.
	 *
	 * @return array<string,string>
	 */
	public static function language_names() {
		$names = array();
		$data  = self::data();
		foreach ( self::languages() as $code ) {
			$names[ $code ] = isset( $data['languages'][ $code ]['name'] ) ? $data['languages'][ $code ]['name'] : $code;
		}
		return $names;
	}

	/**
	 * Default settings shared by the block, shortcode and classic widget.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'lang'   => 'auto',
			'bg'     => '',
			'fg'     => '',
			'accent' => '',
			'credit' => false,
		);
	}

	/**
	 * Reads a boolean from a block attribute, a shortcode string or a checkbox.
	 *
	 * @param mixed $value Raw value.
	 * @return bool
	 */
	public static function bool( $value ) {
		if ( is_bool( $value ) ) {
			return $value;
		}
		return in_array( strtolower( trim( (string) $value ) ), array( '1', 'yes', 'true', 'on' ), true );
	}

	/**
	 * Normalises a hex colour; returns '' for anything that is not one.
	 *
	 * A typo in a colour must never break the page, so an invalid value simply
	 * falls back to the default colour.
	 *
	 * @param mixed $value Raw value, with or without a leading #.
	 * @return string
	 */
	public static function hex( $value ) {
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return '';
		}
		if ( '#' !== $value[0] ) {
			$value = '#' . $value;
		}
		$clean = sanitize_hex_color( $value );
		return $clean ? strtolower( $clean ) : '';
	}

	/**
	 * Cleans a settings array.
	 *
	 * @param array $atts Raw settings.
	 * @return array
	 */
	public static function sanitize( $atts ) {
		$atts  = wp_parse_args( is_array( $atts ) ? $atts : array(), self::defaults() );
		$lang  = strtolower( sanitize_key( (string) $atts['lang'] ) );
		$clean = array(
			'lang'   => in_array( $lang, self::languages(), true ) ? $lang : 'auto',
			'bg'     => self::hex( $atts['bg'] ),
			'fg'     => self::hex( $atts['fg'] ),
			'accent' => self::hex( $atts['accent'] ),
			'credit' => self::bool( $atts['credit'] ),
		);
		return $clean;
	}

	/**
	 * Picks the display language: the chosen one, else the site language when
	 * the countdown has it, else English.
	 *
	 * @param string $lang Chosen language code or 'auto'.
	 * @return string
	 */
	public static function resolve_lang( $lang ) {
		if ( in_array( $lang, self::languages(), true ) ) {
			return $lang;
		}
		$site = strtolower( substr( determine_locale(), 0, 2 ) );
		return in_array( $site, self::languages(), true ) ? $site : 'en';
	}

	/**
	 * Plural slot: 0 for one day, 1 for two to four days in Slovak and Czech,
	 * 2 for everything else.
	 *
	 * @param string $lang Language code.
	 * @param int    $n    Number of days.
	 * @return int
	 */
	public static function form( $lang, $n ) {
		if ( 1 === $n ) {
			return 0;
		}
		if ( in_array( $lang, array( 'sk', 'cs' ), true ) && $n >= 2 && $n <= 4 ) {
			return 1;
		}
		return 2;
	}

	/**
	 * Where the Expo stands today, in the site's timezone.
	 *
	 * Days are whole calendar days: before the opening, the days until 15 May;
	 * during the Expo, the days left including today; after 15 August, ended.
	 *
	 * @param DateTimeImmutable|null $today Midnight of the day to evaluate (for tests).
	 * @return array{phase:string,days:int|null}
	 */
	public static function state( $today = null ) {
		$tz    = wp_timezone();
		$data  = self::data();
		$today = $today instanceof DateTimeImmutable ? $today : new DateTimeImmutable( 'today', $tz );
		$open  = new DateTimeImmutable( isset( $data['open'] ) ? $data['open'] : '2027-05-15', $tz );
		$close = new DateTimeImmutable( isset( $data['close'] ) ? $data['close'] : '2027-08-15', $tz );

		if ( $today > $close ) {
			return array(
				'phase' => 'ended',
				'days'  => null,
			);
		}
		if ( $today >= $open ) {
			return array(
				'phase' => 'left',
				'days'  => (int) $today->diff( $close )->days + 1,
			);
		}
		return array(
			'phase' => 'until',
			'days'  => (int) $today->diff( $open )->days,
		);
	}

	/**
	 * The faint divider colour: the text colour at 15% opacity.
	 *
	 * @param string $fg Six- or three-digit hex colour.
	 * @return string
	 */
	private static function line_color( $fg ) {
		$hex = ltrim( $fg, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		return '#' . $hex . '26';
	}

	/**
	 * Builds the countdown markup. Every value is escaped here.
	 *
	 * @param array $atts Settings (block attributes, shortcode atts or widget instance).
	 * @return string
	 */
	public static function render( $atts ) {
		$a    = self::sanitize( $atts );
		$data = self::data();
		if ( empty( $data['languages'] ) ) {
			return '';
		}

		$lang  = self::resolve_lang( $a['lang'] );
		$l     = $data['languages'][ $lang ];
		$state = self::state();
		$days  = $state['days'];

		if ( 'ended' === $state['phase'] ) {
			$label = $l['ended'];
		} elseif ( 'left' === $state['phase'] ) {
			$label = $l['left'][ self::form( $lang, $days ) ] . ' · ' . $l['leftNote'];
		} else {
			$label = $l['until'][ self::form( $lang, $days ) ] . ' · ' . $l['untilNote'];
		}

		$fg    = $a['fg'] ? $a['fg'] : self::DEFAULT_FG;
		$style = '--bbexpo-line:' . self::line_color( $fg ) . ';';
		foreach ( array( 'bg', 'fg', 'accent' ) as $key ) {
			if ( '' !== $a[ $key ] ) {
				$style .= '--bbexpo-' . $key . ':' . $a[ $key ] . ';';
			}
		}

		// What the front-end script needs to recount the days in the visitor's
		// own calendar when the page came out of a cache.
		$payload = array(
			'lang'      => $lang,
			'title'     => $l['title'],
			'until'     => $l['until'],
			'untilNote' => $l['untilNote'],
			'left'      => $l['left'],
			'leftNote'  => $l['leftNote'],
			'ended'     => $l['ended'],
			'open'      => $data['open'],
			'close'     => $data['close'],
		);

		$classes = 'bbexpo-countdown' . ( empty( $l['caps'] ) ? ' bbexpo-countdown--plain' : '' );
		$aria    = $l['title'] . ': ' . ( null !== $days ? $days . ' ' : '' ) . $label;

		$html  = sprintf(
			'<div class="%1$s" role="group" lang="%2$s" dir="%3$s" aria-label="%4$s" style="%5$s" data-bbexpo="%6$s">',
			esc_attr( $classes ),
			esc_attr( $lang ),
			esc_attr( 'rtl' === $l['dir'] ? 'rtl' : 'ltr' ),
			esc_attr( $aria ),
			esc_attr( $style ),
			esc_attr( wp_json_encode( $payload ) )
		);
		$html .= '<div class="bbexpo-countdown__title">' . esc_html( $l['title'] ) . '</div>';
		if ( null !== $days ) {
			$html .= '<div class="bbexpo-countdown__num">' . esc_html( (string) $days ) . '</div>';
		}
		$html .= '<div class="bbexpo-countdown__label">' . esc_html( $label ) . '</div>';

		if ( $a['credit'] ) {
			$path  = isset( $data['hub'][ $lang ] ) ? $data['hub'][ $lang ] : $data['hub']['en'];
			$url   = add_query_arg(
				array(
					'utm_source' => 'wp-plugin',
					'utm_medium' => 'embed',
				),
				$data['origin'] . $path
			);
			$html .= '<div class="bbexpo-countdown__credit">' . esc_html( $l['by'] )
				. '<a href="' . esc_url( $url ) . '" target="_blank" rel="nofollow noopener">BelgradeBest</a>'
				. esc_html( $l['tagline'] ) . '</div>';
		}

		$html .= '</div>';

		wp_enqueue_style( 'bbexpo-countdown' );
		wp_enqueue_script( 'bbexpo-countdown' );

		return $html;
	}
}
