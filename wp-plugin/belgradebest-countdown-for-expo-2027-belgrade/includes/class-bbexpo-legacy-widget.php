<?php
/**
 * Classic sidebar widget.
 *
 * Kept alongside the block because many sites still run classic widget areas,
 * and those users cannot insert a block.
 *
 * @package BelgradeBest_Countdown_For_Expo_2027_Belgrade
 */

defined( 'ABSPATH' ) || exit;

/**
 * Expo 2027 Belgrade countdown for classic sidebars.
 */
class BBExpo_Countdown_Legacy_Widget extends WP_Widget {

	/**
	 * Sets up the widget name and description.
	 */
	public function __construct() {
		parent::__construct(
			'bbexpo_countdown',
			__( 'BelgradeBest Countdown for Expo 2027 Belgrade', 'belgradebest-countdown-for-expo-2027-belgrade' ),
			array(
				'description' => __( 'Days until Expo 2027 Belgrade opens, or days left while it runs.', 'belgradebest-countdown-for-expo-2027-belgrade' ),
				'classname'   => 'bbexpo-countdown-widget',
			)
		);
	}

	/**
	 * Front-end output.
	 *
	 * @param array $args     Sidebar arguments.
	 * @param array $instance Saved widget settings.
	 */
	public function widget( $args, $instance ) {
		echo wp_kses_post( $args['before_widget'] );

		$title = isset( $instance['title'] ) ? trim( (string) $instance['title'] ) : '';
		if ( '' !== $title ) {
			echo wp_kses_post( $args['before_title'] . esc_html( $title ) . $args['after_title'] );
		}

		// Every value is escaped inside the renderer; wp_kses_post would strip the
		// data and style attributes the countdown needs, so the built string is
		// echoed as is.
		echo BBExpo_Countdown::render( is_array( $instance ) ? $instance : array() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		echo wp_kses_post( $args['after_widget'] );
	}

	/**
	 * Settings form in the widgets screen.
	 *
	 * @param array $instance Saved widget settings.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args(
			is_array( $instance ) ? $instance : array(),
			array_merge( BBExpo_Countdown::defaults(), array( 'title' => '' ) )
		);
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php esc_html_e( 'Title (optional)', 'belgradebest-countdown-for-expo-2027-belgrade' ); ?>
			</label>
			<input class="widefat"
				id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
				type="text"
				value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'lang' ) ); ?>">
				<?php esc_html_e( 'Language', 'belgradebest-countdown-for-expo-2027-belgrade' ); ?>
			</label>
			<select class="widefat"
				id="<?php echo esc_attr( $this->get_field_id( 'lang' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'lang' ) ); ?>">
				<option value="auto" <?php selected( $instance['lang'], 'auto' ); ?>><?php esc_html_e( 'Same as the site (English if not available)', 'belgradebest-countdown-for-expo-2027-belgrade' ); ?></option>
				<?php foreach ( BBExpo_Countdown::language_names() as $code => $name ) : ?>
					<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $instance['lang'], $code ); ?>>
						<?php echo esc_html( $name ); ?>
					</option>
				<?php endforeach; ?>
			</select>
		</p>

		<?php
		$colours = array(
			'bg'     => array( __( 'Background colour (hex, blank for the default)', 'belgradebest-countdown-for-expo-2027-belgrade' ), BBExpo_Countdown::DEFAULT_BG ),
			'fg'     => array( __( 'Text colour (hex, blank for the default)', 'belgradebest-countdown-for-expo-2027-belgrade' ), BBExpo_Countdown::DEFAULT_FG ),
			'accent' => array( __( 'Accent colour (hex, blank for the default)', 'belgradebest-countdown-for-expo-2027-belgrade' ), BBExpo_Countdown::DEFAULT_ACCENT ),
		);
		foreach ( $colours as $key => $colour ) :
			?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( $key ) ); ?>">
					<?php echo esc_html( $colour[0] ); ?>
				</label>
				<input class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( $key ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( $key ) ); ?>"
					type="text" placeholder="<?php echo esc_attr( $colour[1] ); ?>"
					value="<?php echo esc_attr( $instance[ $key ] ); ?>" />
			</p>
		<?php endforeach; ?>

		<p>
			<input type="checkbox"
				id="<?php echo esc_attr( $this->get_field_id( 'credit' ) ); ?>"
				name="<?php echo esc_attr( $this->get_field_name( 'credit' ) ); ?>"
				value="1" <?php checked( BBExpo_Countdown::bool( $instance['credit'] ) ); ?> />
			<label for="<?php echo esc_attr( $this->get_field_id( 'credit' ) ); ?>">
				<?php esc_html_e( 'Show a small "Countdown by BelgradeBest" link', 'belgradebest-countdown-for-expo-2027-belgrade' ); ?>
			</label>
			<br />
			<small><?php esc_html_e( 'Optional and off by default. The countdown works exactly the same either way.', 'belgradebest-countdown-for-expo-2027-belgrade' ); ?></small>
		</p>
		<?php
	}

	/**
	 * Sanitises settings on save.
	 *
	 * @param array $new_instance Submitted values.
	 * @param array $old_instance Previously saved values.
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$new_instance = is_array( $new_instance ) ? $new_instance : array();
		if ( ! isset( $new_instance['credit'] ) ) {
			$new_instance['credit'] = false;
		}
		$clean          = BBExpo_Countdown::sanitize( $new_instance );
		$clean['title'] = isset( $new_instance['title'] ) ? sanitize_text_field( $new_instance['title'] ) : '';
		return $clean;
	}
}
