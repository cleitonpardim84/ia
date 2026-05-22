<?php
/**
 * Snippet: ao importar produtos (CSV WooCommerce), associa a marca VALENTO
 * ja existente na estamparia.pt (taxonomia: brand, slug do termo: valento).
 *
 * Instalacao: plugin "Code Snippets" (adicionar snippet PHP) ou ficheiro em
 * wp-content/mu-plugins/ (sem tag de abertura PHP duplicada).
 *
 * Regra por defeito: SKU do produto pai (simple ou variable) começa por "VAL-".
 * Ajusta o prefixo ou a logica conforme a tua convencao de SKUs.
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'woocommerce_product_import_inserted_product',
	static function ( $product, $data ) {
		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$target_id = (int) $product->get_id();
		if ( $product->is_type( 'variation' ) ) {
			$target_id = (int) $product->get_parent_id();
			if ( $target_id < 1 ) {
				return;
			}
		}

		$parent = wc_get_product( $target_id );
		if ( ! $parent instanceof WC_Product ) {
			return;
		}

		$sku = strtoupper( (string) $parent->get_sku() );
		if ( $sku === '' ) {
			return;
		}

		// Prefixo exemplo: importacoes Valento com SKU tipo VAL-BIKE, VAL-...
		if ( strpos( $sku, 'VAL-' ) !== 0 ) {
			return;
		}

		// Taxonomia "brand" (arquivo publico: /brand/valento/ no estamparia.pt).
		// false = substitui marcas existentes neste produto por so "valento".
		wp_set_object_terms( $target_id, 'valento', 'brand', false );
	},
	10,
	2
);
