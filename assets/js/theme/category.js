import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    checkCart() {
      fetch('/api/storefront/carts')
        .then(response => response.json())
        .then(data => {
          if((data[0] !== undefined) && (data[0].lineItems.physicalItems.length > 0)) {
            $('button#remove-all-cart').attr('data-cart-id', data[0].id);
            $('button#remove-all-cart').css('display', 'inline-block');
          }
        })
    }

    addAllToCart() {
      $("button#add-all-cart").on('click', () => {
        $.map($('li.product > article.card'), function(n, i){
          return $.get("/cart.php?action=add&product_id=" + n.dataset.productId)
          .done(function(data, status, xhr) {
            console.log('Item complete with status ' + status);
            alert('Product ' + n.dataset.name + ' has been added to your cart!');

            fetch('/api/storefront/carts')
              .then(response => response.json())
              .then(data => {
                if((data[0] !== undefined) && (data[0].lineItems.physicalItems.length > 0)) {
                  $('button#remove-all-cart').attr('data-cart-id', data[0].id);
                  $('button#remove-all-cart').css('display', 'inline-block');
                }
              })
            })
          })
        });
    }

    removeAllFromCart() {
      $("button#remove-all-cart").on('click', () => {
        let cartId = $('button#remove-all-cart').attr('data-cart-id');
        fetch('/api/storefront/carts/' + cartId, {method: 'DELETE'})
        .then(response => {
          console.log('Cart Deleted');
          $('button#remove-all-cart').attr('data-cart-id', '');
          $('button#remove-all-cart').css('display', 'none');
          alert('All items have been removed from your cart!');
        })
      })
    }

    productHover() {
      $('figure.card-figure').hover(function(){
        let img = $(this).find('.card-image');
        let newImg = img.attr('data-hoverimage');
        let curImg = img.attr('src');

        if (newImg && newImg != '') { img.attr('src', newImg); }
      }, function(){
        let img = $(this).find('.card-image');
        let newImg = img.attr('data-src');
        let curImg = img.attr('src');

        if (newImg && newImg != '') { img.attr('src', newImg); }
      });
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();
        this.productHover();
        this.addAllToCart();
        this.checkCart();
        this.removeAllFromCart();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
