(function(window, document){

    window.ComplectProduct = function(isCart, complect){
        this.isCart = isCart;
        this.complect = complect;
        this.createEvents();
    }
    window.ComplectProduct.prototype.createEvents = function() {
        var self = this;

        document.addEventListener('click', async (evt) => {
            let el = evt.target.closest('#complect .change-color');
            if (el) {
                evt.preventDefault();
                evt.stopPropagation();

                el.parentNode.querySelector('a').classList.remove('active');
                el.parentNode.parentNode.querySelector('img').setAttribute('src', el.getAttribute('data-main-image'));
                el.classList.add('active');

                return false;
            }

            el = evt.target.closest('#complect input[type="radio"]');
            if (el) {
                evt.preventDefault();

                let price = parseFloat(el.getAttribute('data-price'));
                let price_new = parseFloat(el.getAttribute('data-price-new'));

                let newPrice = number_format((price - (price * price_new / 100)));
                newPrice = `${newPrice} ${$lang.rub} `;
                price = number_format(price) + ' ' + $lang.rub;

                const priceEl = document.createElement('span');
                if (price_new > 0) {
                    const priceNewEl = document.createElement('span');
                    priceNewEl.classList.add('price-new');
                    priceNewEl.textContent = newPrice;

                    const priceOldEl = document.createElement('span');
                    priceOldEl.classList.add('price-new');
                    priceOldEl.textContent = newPrice;

                    priceEl.append(priceNewEl);
                    priceEl.append(priceOldEl);
                }
                priceEl.insertAdjacentText('beforeend', price);

                const priceComplectEl = el.parentNode.parentNode.parentNode.querySelector('.price_complect');
                priceComplectEl.remove();
                priceComplectEl.append(priceEl);

            }

            el = evt.target.closest('.add_complect');
            if (el) {
                evt.preventDefault();
                el.innerHTML = '<i class="fa fa-trash-o"></i>';
                el.classList.remove('add_complect');
                el.classList.add('remove_complect');
                const cloned = el.parentNode.cloneNode(true);
                document.getElementById('complect-box').append(cloned);
                self.createButton();
                return false;
            }

            el = evt.target.closest('.remove_complect');
            if (el) {
                evt.preventDefault();
                el.innerHTML = $lang.complectAdd;
                el.classList.add('add_complect');
                el.classList.remove('remove_complect');
                const cloned = el.parentNode.cloneNode(true);
                document.getElementById('complect').append(cloned);
                self.createButton();
                return false;
            }

            el = evt.target.closest('.addCart');
            if (el) {
                evt.preventDefault();

                if (self.isCart == '1') {
                    let is_full_success = true; //self.addCart($('.product-right .product-actions'));
                    document.querySelectorAll('#complect-box .complect-item').forEach(async item => {
                        is_full_success = await self.addCart(item) && is_full_success;
                    });
                    if(is_full_success) {
                        document.querySelector('#card_info .addCart').textContent = $lang.addNaborToCart;
                    }
                }else{
                    const complectsBuyEl = document.getElementById('complects_buy');
                    complectsBuyEl.innerHTML = '';
                    complectsBuyEl.setAttribute('data-type', 'complect');
                    document.querySelectorAll('#complect-box .complect-item').forEach(item => {
                        const dataId = item.getAttribute('data-id');
                        const value = item.getAttribute('data-name');
                        complectsBuyEl.insertAdjacentHTML('beforeend', `<input type="hidden" data-id="${dataId}" value="${value}">`);
                    });
                    document.querySelector('#card_info .addCart').textContent = $lang.addNaborToCart;
                    document.getElementById('in-click').dispatchEvent(new Event('click'));
                }
            }

            el = evt.target.closest('.complect_add');
            if (el) {
                evt.preventDefault();

                const ids = el.getAttribute('data-id').split(',');

                if (self.isCart == '1') {
                    const formData = new FormData();
                    ids.forEach(id => {
                        formData.append('id[]', id);
                    });
                    formData.append('count', 1);
                    const resp = await sendRequest(formData, '../cart/add');

                    if (resp.count !== undefined) {
                        el.textContent = $lang.addComplectToCart;

                        document.querySelectorAll('.site-cart-counter').forEach((c)=>{
                            c.innerHTML = resp.count;
                        })
                    }
                    else {
                        alert($lang.operationError);
                    }
                }else{
                    const complectsBuyEl = document.getElementById('complects_buy');
                    complectsBuyEl.innerHTML = '';
                    complectsBuyEl.setAttribute('data-type', 'complect_full');
                    self.complect.forEach(complectItem => {
                        complectsBuyEl.insertAdjacentHTML('beforeend', `<input type="hidden" data-id="${complectItem.id}" value="${complectItem.name}">`);
                    });
                    document.getElementById('in-click').dispatchEvent(new Event('click'));
                }

                return false;
            }
        });

    }

    window.ComplectProduct.prototype.createButton = function() {
        const cardInfo = document.getElementById('card_info');
        if(!document.querySelector('#complect-box .complect-item')) {
            cardInfo.querySelector('h3').remove();
            cardInfo.querySelector('.addCart').remove();
            cardInfo.style.display = 'none';
            document.querySelector('.card-info-show').style.display = 'none';
        }
        else if(!cardInfo.querySelector('.addCart')) {
            document.querySelector('.card-info-show').style.display = 'block';
            cardInfo.style.display = 'block';
            /*$($('#complect-box')).before('<h3>'+$lang.youAdded+'</h3>');*/
            // $($('#card_info ul')).before('<a class="hide-card-info">Скрыть</a>');
            if(this.isCart == '1')
                cardInfo.querySelector('.hide-card-info').insertAdjacentHTML('afterbegin', `<a class="addCart">${$lang.addNaborToCart}</a>`);
            else
                cardInfo.querySelector('.hide-card-info').insertAdjacentHTML('afterbegin', `<a class="addCart">${$lang.buyNaborOneClick}</a>`);
        }
    }
    document.addEventListener('click', evt => {
        let el = evt.target.closest('.card-info-show');
        if (el) {
            document.getElementById('card_info').style.display = 'block';
        }

        el = evt.target.closest('.hide-card-info');
        if (el) {
            document.getElementById('card_info').style.display = 'none';
        }
    });
    window.ComplectProduct.prototype.addCart = async function (item) {
        const id = item.getAttribute('data-id');
        let count = 1;
        if (count < 1) count = 1;

        const formData = new FormData();
        formData.append('id', id);
        formData.append('count', count);
        const resp = await sendRequest(formData, '../cart/add');

        if (resp.count !== undefined) {
            document.querySelectorAll('.site-cart-counter').forEach((c)=>{
                c.innerHTML = resp.count;
            })
            return true;
        }
        return false;
    }

})(window, document)
