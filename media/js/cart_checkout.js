if (location.pathname.startsWith('cart/checkout')) checkoutCalculateSum();

document.querySelectorAll('.cart-item__action').forEach(el => {
    el.addEventListener('click', async evt => {
        const action = el.getAttribute('data-action');
        const productId = el.getAttribute('data-id');
        formData = new FormData();
        formData.append('id', productId);

        switch (action) {
            case 'favorites':
                const operation = el.classList.contains('favorite-active') ? 'delete' : 'add';
                const respFav = await sendRequest(formData, `/${action}/${operation}`);
                if (respFav.result) {
                    el.classList.toggle('favorite-active');
                    document.querySelectorAll('.site-favorites-counter').forEach(favCounter => {
                        favCounter.textContent = respFav.count;
                    })
                }
                else {
                    alert('Ошибка при выполнении операции');
                }
                break;
            case 'delete':
                const respDel = await sendRequest(formData, `/cart/delete`);
                if (respDel.result) {
                    el.closest('.cart-item').remove();
                    updateCartSummary();
                }
                else {
                    alert('Ошибка при выполнении операции');
                }
                break;
        }
    });
});

document.querySelectorAll('.cart-item__count-change').forEach(el => {
    el.addEventListener('click', evt => {
        const action = el.getAttribute('data-action');
        const countInput = el.parentNode.querySelector('[name="count"]');
        const oldValue = parseInt(countInput.value);
        let newValue = action === 'add' ? oldValue + 1 : oldValue - 1;

        if (newValue <= 0)
            newValue = 1;

        let max = countInput.getAttribute('max');
        if (max !== undefined) max = parseInt(max);
        if (isNaN(max)) max = null;
        if (max && newValue > max) newValue = max;

        countInput.value = newValue;
        if (oldValue !== newValue) countInput.dispatchEvent(new Event('change'));

    });
});

document.querySelectorAll('.cart-item__cart-block [name="count"]').forEach(el => {
    el.addEventListener('change', evt => {
        newValue = parseInt(el.value);

        if (isNaN(newValue) || newValue <= 0)
            newValue = 1;

        let max = el.getAttribute('max');
        if (max !== undefined) max = parseInt(max);
        if (isNaN(max)) max = null;
        if (max && newValue > max) newValue = max;

        el.value = newValue;

        const cartItem = el.closest('.cart-item');

        if (parseInt(cartItem.getAttribute('data-count')) !== newValue) {
            cartItem.setAttribute('data-count', newValue);
            updateCartSummary();
        }

    });
});

const proceedCheckout = document.querySelector('.proceed-checkout');
if (proceedCheckout) {
    proceedCheckout.addEventListener('click', evt => {
        updateCartSummary('proceed_checkout', 0);
    });
}

let delaySummaryHandler;
function updateCartSummary(action = 'cart_change', delay = 500) {
    clearTimeout(delaySummaryHandler);
    delaySummaryHandler = setTimeout(updateCartSummaryHandler, delay, action);
}

async function updateCartSummaryHandler(action) {

    const fd = new FormData();

    const cartItems = document.querySelectorAll('.cart-items-list > .cart-item');
    cartItems.forEach((cartItem, index) => {
        fd.append(`cart_items[${index}][id]`, cartItem.getAttribute('data-id'));
        fd.append(`cart_items[${index}][price]`, cartItem.getAttribute('data-price'));
        fd.append(`cart_items[${index}][count]`, cartItem.getAttribute('data-count'));
    });

    if (action === 'proceed_checkout') {
        fd.append('action', 'proceed_checkout');
    }
    else {
        fd.append('action', 'cart_change');
    }

    const summaryPanel = document.querySelector('.cart-summary-panel');
    const summaryAlert = summaryPanel.querySelector('.cart-reload-alert');
    const summaryLoader = summaryPanel.querySelector('.load-ajax');

    summaryLoader.classList.add('show-loader');
    const resp = await sendRequest(fd, 'cart/change-summary')
    summaryLoader.classList.remove('show-loader');
    if (resp.result) {
        if (action === 'proceed_checkout')
            location.href = 'cart/checkout';
        else if (action === 'cart_change') {
            document.querySelectorAll('.site-cart-counter').forEach(cartCounter => {
                cartCounter.textContent = resp.cart_count;
            })
            cartItems.forEach((cartItem, index) => {
                const cartData = resp.cart_data[index];

                if (!cartData) return false;

                const cartItemPriceBlock = cartItem.querySelector('.cart-item__price-block');

                cartItem.setAttribute('data-count', cartData['count']);

                cartItemPriceBlock.querySelector('.cart-item__init-price').textContent = cartData['price_formatted'];
                const priceEl = cartItemPriceBlock.querySelector('.cart-item__price-block .cart-item__price');
                priceEl.textContent = cartData['total_formatted'];

                const basePrice = cartItemPriceBlock.querySelector('.cart-item__price-block .cart-item__base-price');
                if (cartData['total'] !== cartData['total_base']) {
                    if (basePrice) basePrice.textContent = cartData['total_base_formatted'];
                    else {
                        cartItemPriceBlock.classList.add('has-base-price');
                        priceEl.insertAdjacentHTML('afterend', `<span class="cart-item__base-price">${cartData['total_base_formatted']}</span>`);
                    }
                }
                else {
                    if (basePrice) {
                        basePrice.remove();
                        cartItemPriceBlock.classList.remove('has-base-price');
                    };
                }

            });
            const totalBlock = summaryPanel.querySelector('.cart-simple-summary__sum');

            const cuponData = resp.cupon_data;
            const cuponBlock = summaryPanel.querySelector('.cart-simple-summary__promocode');
            if (cuponBlock) cuponBlock.remove();
            if (cuponData['discount'] > 0) {
                totalBlock.insertAdjacentHTML('beforebegin', `
                <div class="cart-simple-summary__promocode">
                        <span>Скидка по промокоду <strong title="${cuponData['code']}">${cuponData['code']}</strong></span>
                        <span class="cart-sum">-${cuponData['discount_formatted']}</span>
                    </div>`);
            }

            const totalPriceEl = totalBlock.querySelector('.cart-simple-summary__total .cart-item__price');
            totalPriceEl.textContent = resp.cart_total['total_formatted'];
            const baseTotalPrice = totalBlock.querySelector('.cart-simple-summary__total .cart-item__base-price');
            if (resp.cart_total['total'] !== resp.cart_total['total_base']) {
                if (baseTotalPrice) baseTotalPrice.textContent = resp.cart_total['total_base_formatted'];
                else {
                    totalPriceEl.insertAdjacentHTML('afterend', `<span class="cart-item__base-price">${resp.cart_total['total_base_formatted']}</span>`);
                }
            }
            else {
                if (baseTotalPrice) baseTotalPrice.remove();
            }

            const minPriceAlert = summaryPanel.querySelector('.cart-min-price-alert');
            if (minPriceAlert) minPriceAlert.remove();
            if (resp.cart_total['total'] < resp.min_price_for_order) {
                summaryPanel.querySelector('.checkout-block').classList.add('disabled');
                summaryPanel.insertAdjacentHTML('afterbegin', `
                <div class="cart-min-price-alert">
                    <span class="form-main-error">Минимальная сумма товаров для заказа: ${resp.min_price_for_order_formatted}</span>
                </div>`);
            }
            else {
                summaryPanel.querySelector('.checkout-block').classList.remove('disabled');
            }

        }
    }
    else if (resp.message !== undefined && resp.message.length !== 0) {
        alert(resp.message);
    }
    else if (resp.force_reload !== undefined) {
        location.reload();
    }
    if (resp.need_reload) {
        if (summaryAlert) summaryAlert.remove();
        summaryPanel.insertAdjacentHTML('beforeend', `
		<div class="cart-reload-alert">
                <div class="cart-reload__data">
                    <span class="cart-reload__data-title">Данные устарели!</span>
                    <span>Необходимо обновить корзину</span>
                    <a href="cart" class="btn btn-site"><i class="fa-solid fa-arrows-rotate"></i> Обновить</a>
                </div>
            </div>`);
    }
}

const orderSelectWrapper = document.querySelector('.order-delivery-wrapper');
if (orderSelectWrapper) {
    document.getElementById('order-delivery').addEventListener('change', evt => {
        const deliveryDesc = document.querySelector('.order-delivery-description');
        const selectedOption = orderSelectWrapper.querySelector(`option[value="${evt.currentTarget.value}"]`);
        const desc = selectedOption.getAttribute('data-description');
        const addressArea = document.querySelector('.checkout-user__address');
        if (selectedOption.getAttribute('data-show-address') === '1') {
            addressArea.classList.remove('hidden');
        }
        else {
            addressArea.classList.add('hidden');
        }

        if (deliveryDesc) {
            if (desc) deliveryDesc.innerHTML = desc;
            else deliveryDesc.remove();
        }
        else {
            if (desc) {
                orderSelectWrapper.insertAdjacentHTML('afterend', `<p class="order-delivery-description">${desc}</p>`);
            }
        }

        const postalOfficeId = selectedOption.getAttribute('data-postal-office-id');
        const postalOfficesWrappers = document.querySelectorAll('.input-wrapper[data-postal-office-id]');
        document.querySelector('[name="postal_office_code"]').value = postalOfficeId;
        postalOfficesWrappers.forEach(postalWrapper => {
            if (postalOfficeId === postalWrapper.getAttribute('data-postal-office-id')) {
                postalWrapper.classList.remove('hidden');
                postalWrapper.querySelector('select').disabled = false;
            }
            else {
                postalWrapper.classList.add('hidden');
                postalWrapper.querySelector('select').disabled = true;
            }
        });

        document.getElementById('delivery-no-charge-at').value = selectedOption.getAttribute('data-no-charge-at');

        checkoutCalculateSum();
    });
}

const orderPaysystem = document.getElementById('order-paysystem');
if (orderPaysystem) {
    orderPaysystem.addEventListener('change', evt => {
        checkoutCalculateSum();
    });
}

const checkoutForm = document.querySelector('.cart-main-block');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async evt => {
        evt.preventDefault();

        await submitForm(checkoutForm, {
            route: 'cart/submit-checkout',
            successHandler: function (result, form) {
                location.href = 'cart/success/' + result.order.token;
            },
            customFormCheck: async function (form) {
                const fdCheck = new FormData();
                form.querySelectorAll('[name^="cart_item["]').forEach((cartItem, index) => {
                    fdCheck.append(`cart_items[${index}][id]`, cartItem.getAttribute('data-id'));
                    fdCheck.append(`cart_items[${index}][price]`, cartItem.getAttribute('data-price'));
                    fdCheck.append(`cart_items[${index}][count]`, cartItem.getAttribute('data-count'));
                });
                const respCheck = await sendRequest(fdCheck, 'cart/check-summary');
                if (respCheck.need_reload) {
                    form.querySelector('.cart-summary-panel').insertAdjacentHTML('beforeend', `
		                <div class="cart-reload-alert has-error">
                            <div class="cart-reload__data">
                                <span class="cart-reload__data-title">Данные устарели!</span>
                                <span>Необходимо обновить корзину</span>
                                <a href="cart" class="btn btn-site"><i class="fa-solid fa-arrows-rotate"></i> Обновить</a>
                            </div>
                        </div>`);
                }
            },
            formDataProcessing: function (formData) {
                formData.append('user_data_submit', 1);
                return formData;
            }
        });

    });
}
function checkoutCalculateSum() {
    const summaryBlock = document.querySelector('.cart-summary-panel');
    const currencySymbol = document.getElementById('checkout-currency-symbol').value;
    let minPriceForOrder = parseFloat(document.getElementById('min-price-for-order').value);
    if (isNaN(minPriceForOrder)) minPriceForOrder = 0;

    const loader = summaryBlock.querySelector('.load-ajax');
    loader.classList.add('show-loader');

    let price = 0, priceBase = 0;
    summaryBlock.querySelectorAll('[name^="cart_item["]').forEach(item => {
        const count = item.getAttribute('data-count');
        price += parseFloat(item.getAttribute('data-price')) * count;
        priceBase += parseFloat(item.getAttribute('data-price-base')) * count;
    });


    let promocodeDiscountText = '';
    if (summaryBlock.querySelector('#promocode-discount-text'))
        promocodeDiscountText = summaryBlock.querySelector('#promocode-discount-text').value;

    let promocodeDiscountValue = 0;
    if (summaryBlock.querySelector('#promocode-discount-value'))
        promocodeDiscountValue = parseFloat(summaryBlock.querySelector('#promocode-discount-value').value);

    let priceWithPromo = price - promocodeDiscountValue;
    if (priceWithPromo <= 0) {
        const rround = document.getElementById('rround').getAttribute('content');
        priceWithPromo = rround === '0' ? 1 : 0.1;
    }

    let deliveryNoChargeAt = parseFloat(document.getElementById('delivery-no-charge-at').value);
    if (isNaN(deliveryNoChargeAt)) deliveryNoChargeAt = 0;


    let deliveryMarkupValue = 0, deliveryMarkupBaseValue = 0;
    if (deliveryNoChargeAt > 0 && priceWithPromo < deliveryNoChargeAt || deliveryNoChargeAt == 0) {
        const deliverySelect = document.getElementById('order-delivery');
        if (deliverySelect) {
            let deliveryMarkup = deliverySelect.options[deliverySelect.selectedIndex].getAttribute('data-markup');
            if (deliveryMarkup.includes('%')) {
                deliveryMarkup = parseFloat(deliveryMarkup.replace('%', ''));
                deliveryMarkupValue = priceWithPromo * deliveryMarkup / 100;
                deliveryMarkupBaseValue = priceBase * deliveryMarkup / 100;
            }
            else if (deliveryMarkup !== '') {
                deliveryMarkupValue = parseFloat(deliveryMarkup);
                deliveryMarkupBaseValue = parseFloat(deliveryMarkup);
            }
        }
    }

    let paymentMarkupValue = 0, paymentMarkupBaseValue = 0;
    const paymentSelect = document.getElementById('order-paysystem');
    if (paymentSelect) {
        let paymentMarkup = paymentSelect.options[paymentSelect.selectedIndex].getAttribute('data-markup');
        if (paymentMarkup.includes('%')) {
            paymentMarkup = parseFloat(paymentMarkup.replace('%', ''));
            paymentMarkupValue = (priceWithPromo + deliveryMarkupValue) * paymentMarkup / 100;
            paymentMarkupBaseValue = (priceBase + deliveryMarkupBaseValue) * paymentMarkup / 100;
        }
        else if (paymentMarkup !== '') {
            paymentMarkupValue = parseFloat(paymentMarkup);
            paymentMarkupBaseValue = parseFloat(paymentMarkup);
        }
    }


    const minPriceAlert = summaryBlock.querySelector('.cart-min-price-alert');
    if (minPriceAlert) minPriceAlert.remove();
    if (priceWithPromo < minPriceForOrder) {
        summaryBlock.querySelector('.checkout-block').classList.add('disabled');
        summaryBlock.insertAdjacentHTML('afterbegin', `
                <div class="cart-min-price-alert">
                    <span class="form-main-error">Минимальная сумма товаров для заказа: ${number_format(minPriceForOrder)} ${currencySymbol}</span>
                </div>`);
    }
    else {
        summaryBlock.querySelector('.checkout-block').classList.remove('disabled');
    }

    const totalPrice = priceWithPromo + deliveryMarkupValue + paymentMarkupValue;
    const totalBasePrice = priceBase + deliveryMarkupBaseValue + paymentMarkupBaseValue;


    const totalBlock = summaryBlock.querySelector('.cart-simple-summary__total');
    totalBlock.querySelector('.cart-item__price').textContent = `${number_format(totalPrice)} ${currencySymbol}`;
    if (totalBlock.querySelector('.cart-item__base-price'))
        totalBlock.querySelector('.cart-item__base-price').textContent = `${number_format(totalBasePrice)} ${currencySymbol}`;



    const paymentBlock = summaryBlock.querySelector('.cart-simple-summary__payment');
    if (paymentBlock) paymentBlock.remove();
    if (paymentMarkupValue > 0) {
        summaryBlock.querySelector('.cart-simple-summary').insertAdjacentHTML('afterbegin', `
                <div class="cart-simple-summary__payment">
                        <span>Комиссия оплаты:</span>
                        <span class="cart-sum">${number_format(paymentMarkupValue)} ${currencySymbol}</span>
                    </div>`);
    }

    const deliveryBlock = summaryBlock.querySelector('.cart-simple-summary__delivery');
    if (deliveryBlock) deliveryBlock.remove();
    if (deliveryMarkupValue > 0) {
        summaryBlock.querySelector('.cart-simple-summary').insertAdjacentHTML('afterbegin', `
                <div class="cart-simple-summary__delivery">
                        <span>Доставка:</span>
                        <span class="cart-sum">${number_format(deliveryMarkupValue)} ${currencySymbol}</span>
                    </div>`);
    }

    const promocodeBlock = summaryBlock.querySelector('.cart-simple-summary__promocode');
    if (promocodeBlock) promocodeBlock.remove();
    if (promocodeDiscountText) {
        summaryBlock.querySelector('.cart-simple-summary').insertAdjacentHTML('afterbegin', `
                <div class="cart-simple-summary__promocode">
                        <span>Скидка по промокоду</span>
                        <span class="cart-sum">-${promocodeDiscountText}</span>
                    </div>`);
    }


    const preTotalBlock = summaryBlock.querySelector('.cart-simple-summary__pre-total');
    if (preTotalBlock) preTotalBlock.remove();
    if (deliveryMarkupValue > 0 || paymentMarkupValue > 0) {
        summaryBlock.querySelector('.cart-simple-summary').insertAdjacentHTML('afterbegin', `
                <div class="cart-simple-summary__pre-total">
                        <span>Сумма заказа:</span>
                        <span class="cart-sum">${number_format(price)} ${currencySymbol}</span>
                    </div>`);
    }

    loader.classList.remove('show-loader');
}

const promocodeBtn = document.querySelector('.activate-promocode');
if (promocodeBtn) {
    const promocodeInput = promocodeBtn.parentElement.querySelector('input');
    promocodeBtn.addEventListener('click', async evt => {
        const loader = document.querySelector('.cart-promocode-block .load-ajax');
        loader.classList.add('show-loader');
        if (promocodeInput.value.length === 0) {
            promocodeInput.parentElement.classList.add('has-error');
            promocodeInput.parentElement.setAttribute('data-error', 'Введите промокод');
        }
        else {
            const fd = new FormData();
            fd.append('value', promocodeInput.value);
            const resp = await sendRequest(fd, 'cart/checkcupon');
            if (resp.result) location.reload();
            else {
                promocodeInput.parentElement.classList.add('has-error');
                promocodeInput.parentElement.setAttribute('data-error', 'Промокод не найден');
            }
        }
        loader.classList.remove('show-loader');
    });

    const promoNewBtn = document.querySelector('.cart-promocode-active .btn');
    if (promoNewBtn) {
        promoNewBtn.addEventListener('click', evt => {
            promocodeInput.closest('.cart-promocode-input').classList.remove('hidden');
            promocodeInput.focus();
        });
    }
}
