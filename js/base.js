

// media/js/main_base.js

Fancybox.bind(document.body, '[data-fancybox]', {}); // [data-fancybox^="gallery-"]
const moreBtnHandler = async function () {
    let nextPage = parseInt(this.getAttribute('data-page')) + 1;
    let lastPage = parseInt(this.getAttribute('data-last-page'));
    const currentCatID = this.getAttribute('data-category-id');
    if (nextPage > lastPage) return;
    let fd = new FormData();
    fd.append('cat_id', currentCatID);
    fd.append('param_page_number', nextPage);
    fd.append('custom_count', this.getAttribute('data-per-page') !== null ? this.getAttribute('data-per-page') : '');

    if (typeof makeFilterUri === 'function') {
        const filterItems = makeFilterUri();
        for (let itemsKey in filterItems) {
            if (Array.isArray(filterItems[itemsKey])) {
                filterItems[itemsKey].forEach(arrayItem => {
                    fd.append(`${itemsKey}`, arrayItem);
                });
            }
            else {
                fd.append(itemsKey, filterItems[itemsKey]);
            }
        }
    }

    const response = await loadProducts(fd);
    if (response) {
        if ((nextPage + 1) > lastPage) {
            this.remove();
        }
        else {
            this.setAttribute('data-page', nextPage);
        }

        let paginationLink;
        let nextSign = '»', previousSign = '«';
        document.querySelectorAll('.pagination').forEach(paginationEl => {
            const maxVisible = parseInt(paginationEl.getAttribute('data-max-visible'));
            const paginationIndex = paginationEl.getAttribute('data-pagination-index');
            const indexRegex = new RegExp(`${paginationIndex}[0-9]+`, 'i');
            paginationLink = paginationEl.querySelector(`li[data-page="${nextPage}"] > a`).getAttribute('href');

            const paginationLimits = getPaginationLimits(nextPage, maxVisible, lastPage);

            paginationEl.querySelector('li.active').classList.remove('active');
            const firstPaginationEl = paginationEl.querySelector('li:first-child > a');
            firstPaginationEl.textContent = previousSign;
            firstPaginationEl.setAttribute('href', paginationLink.replace(indexRegex, ''));

            const liCollection = paginationEl.querySelectorAll('li');

            for (let i = paginationLimits[0], elementPosition = 1; i <= paginationLimits[1]; i++, elementPosition++) {

                let newLink = paginationLink.replace(indexRegex, `${paginationIndex}${i}`);
                if (i === 1) newLink = paginationLink.replace(indexRegex, '');

                let _elem = liCollection[elementPosition];
                if (_elem !== undefined) {
                    _elem.querySelector('a').textContent = i;
                    _elem.setAttribute('data-page', i);
                    if (i === nextPage) {
                        _elem.querySelector('a').setAttribute('href', '#');
                        _elem.classList.add('active');
                    }
                    else {
                        _elem.querySelector('a').setAttribute('href', newLink);
                    }
                }
                else {
                    paginationEl.insertAdjacentHTML('beforeend', `<li class="${i===nextPage?'active':''}" data-page="${i}"><a href="${newLink}">${i}</a></li>`);
                }
            }

            if (lastPage !== nextPage && liCollection[liCollection.length - 1].querySelector('a').textContent !== nextSign) {
                const newLink = paginationLink.replace(indexRegex, `${paginationIndex}${lastPage}`);
                paginationEl.insertAdjacentHTML('beforeend', `<li class="" data-page="${lastPage}"><a href="${newLink}">${nextSign}</a></li>`);
            }
            else if(lastPage === nextPage && liCollection[liCollection.length - 1].querySelector('a').textContent === nextSign) {
                liCollection[liCollection.length - 1].remove();
            }

            const regExpTitle = new RegExp(` - ${$lang.pageTitle} [0-9]+`, 'i');
            const newTitle = document.title.replace(regExpTitle, '');
            const regExp = new RegExp(`${paginationIndex}[0-9]+`, 'i')
            let newPathName = `${location.pathname.replace(regExp, '')}/${paginationIndex}${nextPage}`;
            newPathName = newPathName.replace('../https@', '/');
            window.history.replaceState({},"", newPathName + location.search);
            document.title = `${newTitle} - ${$lang.pageTitle} ${nextPage}`;
            const _h1 = document.getElementsByTagName('h1')[0];
            const newH1 = _h1.textContent.replace(regExpTitle, '');
            _h1.innerText = `${newH1} - ${$lang.pageTitle} ${nextPage}`;

        });
    }
};
function getPaginationLimits(currentPage, max, lastPageNumber)
{

    const left = currentPage - Math.round(max / 2);

    let start = left > 0 ? left : 1;
    let end;

    if (start + max <= lastPageNumber) {
        end = start > 1 ? start + max : max;
    } else {
        end = lastPageNumber;
        start = lastPageNumber - max > 0 ? lastPageNumber - max : 1;
    }

    return [start, end];
}
let loadProducts = async (fd, appendItems = true) => {
    const loadSpinner = document.querySelector('.load-more-spinner');
    if (loadSpinner)
        loadSpinner.classList.add('fa-spin');
    const response = await fetch('catalog/get-next-page', {
        method: 'POST',
        headers: {
            'Accept': 'text/html'
        },
        body: fd
    });

    if (!response.ok) {
        if (loadSpinner)
            loadSpinner.classList.remove('fa-spin');
        alert($lang.ajax_error);
        return false;
    }
    else {
        const data = await response.text();
        if (loadSpinner)
            loadSpinner.classList.remove('fa-spin');
        if (data.length === 0) return;

        if (!appendItems)
            document.querySelector('.catalog-products').replaceChildren();

        document.querySelector('.catalog-products').innerHTML += data;
        document.querySelectorAll('.fetch-new').forEach((el) => {
            el.querySelectorAll('.add-to').forEach((ch)=>{
                setAddTo(ch);
            })
            el.querySelectorAll('.catalog-item__counter-change').forEach((ch)=>{
                setCatalogChangeCount(ch);
            })
            el.querySelectorAll('.catalog-item__counter input').forEach((ch)=>{
                setInputCart(ch);
            })
            el.querySelectorAll('.quick-view').forEach((el)=>{
                el.addEventListener('click',()=>{
                    quickViewProduct(el)
                })
            })

            el.classList.remove('fetch-new')
        })
        return true;
    }
}
let quickViewProduct = async (el) => {
    let id = el.getAttribute('data-id')

    let formData = new FormData();
    formData.append('id',id)
    const response = await fetch('product/quick', {
        method: 'POST',
        headers: {
            'Accept': 'text/html'
        },
        body: formData
    });

    if (!response.ok) {
        alert($lang.ajax_error);
        return false;
    }
    else {
        const data = await response.text();
        let quickContainer = document.createElement('div')
        quickContainer.classList.add('quick-container')
        quickContainer.innerHTML = data
        document.querySelector('body').append(quickContainer)
        document.getElementsByTagName('body')[0].classList.add('modal-active');
        setTimeout(()=>{
            document.querySelector('.product-quick-view').classList.add('active')
        },50)
        quickContainer.querySelector('.close-modal').addEventListener('click',(el)=>{
            document.querySelector('.product-quick-view').classList.remove('active')
            document.getElementsByTagName('body')[0].classList.remove('modal-active');
            setTimeout(()=>{
                document.querySelector('.quick-container').remove()
            },200)
        })
        quickContainer.querySelectorAll('.add-to').forEach((el)=>{
            setAddTo(el)
        })
        quickContainer.querySelectorAll('.catalog-item__counter-change').forEach((el)=>{
            setCatalogChangeCount(el)
        })
        quickContainer.querySelectorAll('.catalog-item__counter input').forEach((el)=>{
            setInputCart(el)
        })
        const quickBuy1ClickModal = quickContainer.querySelector('.buy-1-click-quick');
        if (quickBuy1ClickModal) {
            setModalBackgroundClose(quickBuy1ClickModal);
            quickBuy1ClickModal.querySelectorAll('.input-wrapper').forEach(inputWrapper => {
                setInputWrapperHandler(inputWrapper);
            });
            quickBuy1ClickModal.querySelector('.send-modal-form').addEventListener('click', async evt => {
                await proceedForm(evt.currentTarget, evt);
            });
        }

        quickContainer.addEventListener('click',(e)=>{
            if (e.target.className==='modal-block product-quick-view active'){
                e.target.classList.remove('active')
                document.getElementsByTagName('body')[0].classList.remove('modal-active');
                setTimeout(()=>{
                    document.querySelectorAll('.quick-container').forEach(el => {
                        el.remove();
                    });
                },200)
            }
        })
        //setCartText(quickContainer.querySelector('.product__cart-action .add-to'))

        /*document.querySelector('.catalog-products').innerHTML += data;
        document.querySelectorAll('.fetch-new').forEach((el)=>{
            el.querySelectorAll('.add-to').forEach((ch)=>{
                setAddTo(ch)
            })
            el.querySelectorAll('.catalog-item__counter-change').forEach((ch)=>{
                setChangeCount(ch)
            })
            el.querySelectorAll('.catalog-item__counter input').forEach((ch)=>{
                setInputCart(ch)
            })
            el.classList.remove('fetch-new')
        })*/
        return true;
    }
}
document.querySelectorAll('.quick-view').forEach((el)=>{
    el.addEventListener('click',()=>{
        quickViewProduct(el)
    })

})
document.querySelectorAll('.btn-catalog').forEach(function (e){
    e.addEventListener('mouseenter',function (){
        let page_id = e.getAttribute('data-page')
        let elem = document.querySelector('.catalog-navbar.label-'+page_id);
        elem.classList.add('active-catalog-navbar')
    })
    e.addEventListener('mouseleave',function (evt){

        let page_id = e.getAttribute('data-page')
        let elem = document.querySelector('.catalog-navbar.label-'+page_id);

        if (!evt.relatedTarget.classList.contains('active-catalog-navbar') && !evt.relatedTarget.classList.contains('catalog-navbar-item') )
            elem.classList.remove('active-catalog-navbar')
    })
})
document.querySelectorAll('.catalog-navbar').forEach(function (e){
    e.addEventListener('mouseleave',function (){
        e.classList.remove('active-catalog-navbar');
    })
})
/*$('nav > ul > li').on('mouseenter',function () {
    var label = $(this).attr('data-page');
    var item = $('.catalog-navbar.label-'+label);
    item.fadeTo(200,1);
    item.css('display','flex')
});
$('nav > ul > li').on('mouseleave',function () {
    var label = $(this).attr('data-page');
    var item = $('.catalog-navbar.label-'+label);
    if ($('.catalog-navbar.label-'+label+':hover').length==0)      item.fadeOut(200);
});
$('.catalog-navbar').on('mouseleave',function () {
    var l = $('nav > ul > li:hover').length;

    if (l>0)
    {
        var label = $('nav > ul > li:hover').attr('data-page');
        if ($(this).hasClass('label-'+label)==false) $(this).fadeOut(200);
    }
    else $(this).fadeOut(200);
});*/
document.addEventListener('click', (event) => {
    if (event.target.closest('#load-more-products-btn')) {
        moreBtnHandler.call(document.getElementById('load-more-products-btn'), event);
    }
});

document.querySelectorAll('.item-content table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('item-content__table-wrapper');
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
});

function wait(ms) {
    return new Promise(resolve => {setTimeout(resolve, ms)});
}
const headerMobileBg = document.querySelector('.header-mobile__bg');
const headerMobilePhones = document.querySelector('.header-mobile__main-phones');
const headerMobileMenu = document.querySelector('.header-mobile__left-menu');
const headerMobileMenuScroller = document.querySelector('.header-mobile__left-menu > .scroller');

document.addEventListener('DOMContentLoaded', function () {

    if (window.innerWidth < 769){
        let elLeft = document.querySelector('.show-categories')
        if (elLeft){
            let menuLeft = document.querySelector('.menu-left-category')
            elLeft.addEventListener('click', function () {
                menuLeft.classList.add('active')
            }, false);
            let el2Left = document.querySelector('.close-categories')
            el2Left.addEventListener('click', function () {
                menuLeft.classList.remove('active')
            }, false);
            let el3Left = document.querySelectorAll('.menu-left-category li > a')
            for (let i = 0; i < el3Left.length; i++)
                el3Left[i].addEventListener('click', function (e) {
                    let elemA = e.target
                    if (elemA.children.length > 0) {
                        let ul = elemA.parentNode.children[1]
                        if (!ul.classList.contains('visible')) {
                            e.preventDefault()
                            ul.classList.add('visible')

                            elemA.children[0].classList.remove('fa-angle-right')
                            elemA.children[0].classList.add('fa-angle-down')
                        }

                    }

                });


            let elFilter = document.querySelector('.show-filter')
            let filterLeft = document.querySelector('.menu-filters')
            elFilter.addEventListener('click', function () {
                filterLeft.classList.add('visible')
            }, false);
            el2Left = document.querySelector('.close-filters')
            el2Left.addEventListener('click', function () {
                filterLeft.classList.remove('visible')
                let filterNotice = document.querySelector('.filter-notice')
                if (filterNotice)
                    filterNotice.parentNode.removeChild(filterNotice);
            }, false);
        }
    }

    if (headerMobilePhones) {
        document.querySelectorAll('.header-mobile__phones-btn').forEach(el => {
            el.addEventListener('click', evt => {
                if (headerMobilePhones.classList.contains('active')) {
                    closeMobileHeaderModal();
                }
                else {
                    openMobileHeaderModal(headerMobilePhones);
                }
            });
        });
        document.querySelector('.header-mobile__main-phones .close').addEventListener('click', evt => {
            closeMobileHeaderModal();
        });
        headerMobileBg.addEventListener('click', evt => {
            closeMobileHeaderModal();
        });
    }

    document.querySelectorAll('.header-burger-button').forEach(el => {
        el.addEventListener('click', evt => {
            if (headerMobileMenu.classList.contains('active')) {
                closeMobileHeaderModal();
            }
            else {
                openMobileHeaderModal(headerMobileMenu);
            }
        });
    });

    document.querySelectorAll('.show-inner-items').forEach(el => {
        el.addEventListener('click', evt => {
            evt.preventDefault();
            el.nextElementSibling.classList.add('active');

            const openedMenus = document.querySelectorAll('.header-mobile__left-menu .submenu.active').length;
            headerMobileMenu.querySelector('.wrapper').style.transform = `translateX(-${openedMenus*100}%)`;

            const submenuStyles = getComputedStyle(el.nextElementSibling);
            headerMobileMenuScroller.style.height = `${submenuStyles.height}`;
            headerMobileMenu.scrollTo(0,0);
        });
    });

    document.querySelectorAll('.header-mobile__left-menu .menu-back').forEach(el => {
        el.addEventListener('click', evt => {
            headerMobileMenuBack(el);
        });
    });
    const bigModalSearchBtn = document.querySelector('.big-modal-search-btn');
    const bigSearchForm = document.querySelector('.big-search-form');
    if (bigModalSearchBtn && bigSearchForm) {
        bigModalSearchBtn.addEventListener('click', function (){
            bigSearchForm.classList.add('active')
            document.getElementsByTagName('body')[0].classList.add('modal-active');
        });
    }

    detectSwipe(headerMobileMenu, closeMobileHeaderModal);

    detectSwipe(headerMobileMenu, headerMobileMenuBack, true);


    document.querySelectorAll('.password-wrapper').forEach(passwordWrapper => {
        passwordWrapper.querySelector('i').addEventListener('click', evt => {
            if (passwordWrapper.classList.contains('password-hidden')) {
                passwordWrapper.classList.replace('password-hidden', 'password-shown');
                passwordWrapper.querySelector('input').type = 'text';
            }
            else {
                passwordWrapper.classList.replace('password-shown', 'password-hidden');
                passwordWrapper.querySelector('input').type = 'password';
            }
        });
    });

    document.querySelectorAll('.input-wrapper').forEach(inputWrapper => {
        setInputWrapperHandler(inputWrapper);
    });
});

function headerMobileMenuBack(el) {
    el.closest('.submenu').classList.remove('active');
    const openedMenus = document.querySelectorAll('.header-mobile__left-menu .submenu.active').length;
    headerMobileMenu.querySelector('.wrapper').style.transform = `translateX(-${openedMenus*100}%)`;

    const parentSubmenu = el.closest('.submenu').parentElement.closest('.submenu');
    if (parentSubmenu && parentSubmenu.classList.contains('submenu')) {
        const submenuStyles = getComputedStyle(parentSubmenu);
        headerMobileMenuScroller.style.height = `${submenuStyles.height}`;
        headerMobileMenu.scrollTo(0,0)
    }
    else {
        headerMobileMenuScroller.style.height = '';
    }
}

function openMobileHeaderModal(modal) {
    document.querySelectorAll('.header-mobile__modal').forEach(modal => {
        modal.classList.remove('active');
    });
    modal.classList.add('active');

    headerMobileBg.classList.add('active');
    if (modal.classList.contains('header-mobile__left-menu')) {
        headerMobileBg.classList.add('menu-active');
    }

    document.getElementsByTagName('body')[0].classList.add('modal-active');
}
function closeMobileHeaderModal() {
    document.querySelectorAll('.header-mobile__modal').forEach(modal => {
        modal.classList.remove('active');
        if (modal.classList.contains('header-mobile__left-menu')) {
            modal.querySelector('.wrapper').setAttribute('style', '');
            headerMobileMenu.querySelectorAll('.submenu.active').forEach(el => {
                el.classList.remove('active');
            });
            headerMobileMenuScroller.style.height = '';
        }
    });

    headerMobileBg.classList.remove('active', 'menu-active');

    document.getElementsByTagName('body')[0].classList.remove('modal-active');
}

function setInputWrapperHandler(inputWrapper) {
    if (inputWrapper.classList.contains('has-own-handler')) return false;

    const input = inputWrapper.querySelector('input,textarea,select');


    const isPassword = input.getAttribute('data-password-repeat-id');
    let repeatPasswordInput;
    if (isPassword)
        repeatPasswordInput = document.getElementById(isPassword);


    input.addEventListener('blur', evt => {

        // Если повтор_пароля не пусто и НЕ совпадает с паролем - вызываем в 'blur' (чтобы много раз не отсылать Event на повтор_пароля во время input'a пароля)
        if (isPassword) {
            if (repeatPasswordInput.value !== '' && repeatPasswordInput.value !== input.value)
                repeatPasswordInput.dispatchEvent(new Event('blur'));
        }
        checkField(input, inputWrapper, evt);
    });
    input.addEventListener('input', evt => {
        //Если повтор_пароля не пусто и совпадает с паролем - вызываем один раз в input
        if (isPassword) {
            if (repeatPasswordInput.value !== '' && repeatPasswordInput.value === input.value)
                repeatPasswordInput.dispatchEvent(new Event('blur'));
        }


        if (!inputWrapper.classList.contains('has-error')) return false;

        checkField(input, inputWrapper, evt);
    });
}

document.querySelectorAll('form.default-submit').forEach(form => {
    let formAction = form.getAttribute('action');
    if (!formAction) formAction = '#';
    form.addEventListener('submit', async evt => {
        evt.preventDefault();
        await submitForm(form, {
            'route': formAction,
            'successHandler': function (formResult, form) {
                let needReload = false;
                if (formResult.message !== undefined && formResult.message !== '') {
                    alert(formResult.message);
                }
                else
                    needReload = true;

                if (formResult.need_reload !== undefined && formResult.need_reload)
                    needReload = true;

                if (needReload) location.reload();
            }
        });
    });
});

async function submitForm(form, options = {}) {
    let callErrors = '';
    if (!options.hasOwnProperty('route')) callErrors += "route is not specified!\n";
    if (!options.hasOwnProperty('successHandler')) callErrors += "successHandler is not specified!\n";
    if (callErrors !== '') {
        alert(callErrors);
        return false;
    }

    const formLoader = form.querySelector('.form-loader');
    if (formLoader) formLoader.classList.remove('hidden');

    form.querySelectorAll('.input-wrapper:not(.hidden) .input[required]').forEach(input => {
        input.dispatchEvent(new CustomEvent('blur', {detail: {'fromForm' : true}}));
    });

    if (options.hasOwnProperty('customFormCheck')) {
        await options.customFormCheck(form);
    }

    const firstError = form.querySelector('.has-error');
    if (firstError) {
        firstError.scrollIntoView({block: "start", behavior: "smooth"});
        if (formLoader) formLoader.classList.add('hidden');
        return false;
    }

    const formMainError = form.querySelector('.form-main-alert');
    if (formMainError) formMainError.remove();

    let fd = new FormData(form);
    if (options.hasOwnProperty('formDataProcessing')) {
        fd = options.formDataProcessing(fd);
    }

    const formResult = await sendRequest(fd, options.route);
    if (formResult.result) {
        if (formLoader) formLoader.classList.add('hidden');
        options.successHandler(formResult, form);
    }
    else if (formResult.errors !== undefined) {
        for (const errorsKey in formResult.errors) {
            if (errorsKey === 'general') {
                let errorMessage = '';
                formResult.errors[errorsKey].forEach(er => errorMessage += `${er}<br>`);
                form.querySelector('.errors-anchor').insertAdjacentHTML('beforebegin', `<span class="form-main-alert alert-error alert-message">${errorMessage}</span>`);
                continue;
            }

            form.querySelectorAll('.input-wrapper').forEach(inputWrapper => {

                if (inputWrapper.getAttribute('data-name') !== errorsKey) return false;

                inputWrapper.setAttribute('data-error', formResult.errors[errorsKey]);
                inputWrapper.classList.add('has-error');
            });
            const firstError = form.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({block: "start", behavior: "smooth"});
            }
        }
    }
    else if (formResult.message !== undefined) {
        form.querySelector('.errors-anchor').insertAdjacentHTML('beforebegin', `<span class="form-main-alert alert-error alert-message">${formResult.message}</span>`);
    }
    else {
        form.querySelector('.errors-anchor').insertAdjacentHTML('beforebegin', `<span class="form-main-alert alert-error alert-message">${$lang.unknownError}</span>`);
    }
}

function detectSwipe(node, closure, swipeToRight = false) {
    let touchStartX, touchEndX, touchStartY, touchEndY;
    const allowedAngle = 30;
    const shiftMin = 45;
    node.addEventListener('touchstart', evt => {
        touchStartX = evt.targetTouches[0].clientX;
        touchStartY = evt.targetTouches[0].clientY;
    }, {passive: true});
    node.addEventListener('touchmove', evt => {
        touchEndX = evt.targetTouches[0].clientX;
        touchEndY = evt.targetTouches[0].clientY;
    }, {passive: true});
    node.addEventListener('touchend', evt => {
        if (touchEndX !== null) {
            let distX;
            if (swipeToRight) {
                distX = touchEndX - touchStartX;
            }
            else {
                distX = touchStartX - touchEndX;
            }
            const distY = Math.abs(touchStartY - touchEndY);
            const deg = Math.atan(distY / distX) * (180 / Math.PI);
            if (distX >= shiftMin && deg <= allowedAngle) {
                closure(evt.target);
            }
        }
        touchStartX = null;
        touchEndX = null;
        touchStartY = null;
        touchEndY = null;
    }, {passive: true});
}
function checkField(input, inputWrapper, evt) {
    let error = '';
    if (input.required) {
        // проверяем если длина значения - 0 (кроме чекбокса)
        if (input.value.length === 0 && !['checkbox'].includes(input.type))
            error = $lang.inputFieldEmpty;
        else if (input.type === 'checkbox' && !input.checked && evt.detail.fromForm !== undefined) // проверяем чекбокс, но только во время сабмита формы
        error = $lang.checkboxNeeded;
    }
    else {
        if (input.value.length === 0) inputWrapper.classList.remove('has-error');
    }
    // не ругаемся раньше времени (сабмит формы)
    if (input.value.length === 0 && evt.detail.fromForm === undefined)
        return false;
    else {
        // это тут лишнее, но пусть пока так
        const isRepeatPassword = input.getAttribute('data-password-id');
        if (isRepeatPassword && input.value !== document.getElementById(isRepeatPassword).value)
            error = $lang.passwordsDoesNotMatch;

        // проверяем длину значения
        if (error === '' && (input.minLength > 0 || input.maxLength > 0)) {
            const isValueLess = input.value.length < input.minLength;
            const isValueMore = input.value.length > input.maxLength;
            if (input.minLength > 0 && input.maxLength > 0 && (isValueLess || isValueMore))
                error = `${$lang.fieldMustBe1} ${input.maxLength}, ${$lang.fieldMustBe2}  ${input.minLength} ${$lang.fieldMustBe3}`;
            else if (input.minLength > 0 && isValueLess)
                error = `${$lang.fieldMustBe4} ${input.minLength} ${$lang.fieldMustBe3}`;
            else if (input.maxLength > 0 && isValueMore)
                error = `${$lang.fieldMustBe5} ${input.maxLength} ${$lang.fieldMustBe3}`;
        }
        // проверяем диапозон чисел
        if (error === '' && (input.min > 0 || input.max > 0)) {
            let inputValue = parseInt(input.value);
            if (isNaN(inputValue)) inputValue = 0;
            const isValueLess = inputValue < input.min;
            const isValueMore = inputValue > input.max;
            if (input.min > 0 && input.max > 0 && (isValueLess || isValueMore))
                error = `${$lang.valueMustBe1} ${input.max}${$lang.valueMustBe2} ${input.min}!`;
            else if (input.min > 0 && isValueLess)
                error = `${$lang.valueMustBe3} ${input.min} ${$lang.fieldMustBe3}`;
            else if (input.max > 0 && isValueMore)
                error = `${$lang.valueMustBe4} ${input.max} ${$lang.fieldMustBe3}`;
        }
        // проверяем шаблон
        if (error === '' && input.pattern !== '' && input.value !== 'admin' && !(new RegExp(input.pattern)).test(input.value)) {
            error = $lang.wrongPattern;
            const patternExample = input.getAttribute('data-example');
            if (patternExample)
                error += ` ${$lang.patternExample}: ${patternExample}`;
        }
    }

    if (error.length > 0)
        inputWrapper.classList.add('has-error');
    else
        inputWrapper.classList.remove('has-error');

    inputWrapper.setAttribute('data-error', error);

}

document.querySelectorAll('.header-mobile__menu li > a').forEach(el => {
    const href = el.getAttribute('href');
    if (!href || (href.substring(0, 2) !== '#' && href.substring(0, 1) !== '#')) return false;
    el.addEventListener('click', evt => {
        closeMobileHeaderModal();
    });
});

function number_format( number, decimals = 2, dec_point = '.', thousands_sep = ' ', hide00 = 0 ) {

    let sign = number < 0 ? '-' : '';

    let s_number = Math.abs(parseInt(number = (+number || 0).toFixed(decimals))) + "";
    let len = s_number.length;
    let tchunk = len > 3 ? len % 3 : 0;

    let ch_first = (tchunk ? s_number.substr(0, tchunk) + thousands_sep : '');
    let ch_rest = s_number.substr(tchunk)
        .replace(/(\d\d\d)(?=\d)/g, '$1' + thousands_sep);
    let ch_last = decimals ?
        dec_point + (Math.abs(number) - s_number)
            .toFixed(decimals)
            .slice(2) :
        '';

    let result =  sign + ch_first + ch_rest + ch_last;
    if (hide00 === 1) result = result.replace(dec_point+'0'.repeat(decimals), '');

    return result;

}

async function sendRequest(data, url) {
    let fd = data;
    if (!(data instanceof FormData)) {
        fd = new FormData();
        for(const name in data) {
            fd.append(name, data[name]);
        }
    }

    let resp = await fetch(url, {
        method: 'POST',
        body: fd
    })
    let stat = await resp.status;
    if (stat !== 200){
        alert('error ' + stat)
    }
    else {
        let result = await resp.text();
        try {
            return JSON.parse(result)
        }
        catch (e) {
            alert('Error parse')
            console.log(e)
        }
    }

}

window.addEventListener("scroll", () => {
    pos = window.scrollY;
    const toTop = document.getElementById('toTop')
    if (pos > 200){
        if (!toTop.classList.contains('active'))
            toTop.classList.add('active')
    }
    else
        toTop.classList.remove('active')

});
document.getElementById('toTop').addEventListener('click',(e)=>{
    window.scrollTo(0,0);
});
window.addEventListener("DOMContentLoaded", function() {
    if (phoneMask.length > 0) {
        [].forEach.call( document.querySelectorAll('.input-phone'), function(input) {
            var keyCode;
            function mask(event) {
                event.keyCode && (keyCode = event.keyCode);
                let i = 0,
                    def = phoneMask.replace(/[^0-9]/g, ""),
                    val = this.value.replace(/[^0-9]/g, "");

                val = def + val.replace(new RegExp(def), "");

                /*let newData = '';
                if (event.type === 'input') {
                    newData = event.data || (event.clipboardData && event.clipboardData.getData('Text'));
                    if (!newData) return false;
                }*/

                let new_value = phoneMask.replace(/[_\d]/g, function(a) {
                    return i < val.length ? val.charAt(i++) : a;
                });

                let currentPos = this.selectionStart;
                const firstMatrixDigitPos = phoneMask.indexOf('_') + 1;
                if (currentPos <= firstMatrixDigitPos) currentPos = firstMatrixDigitPos;

                i = new_value.indexOf("_");
                if (i != -1) {
                    i < 5 && (i = 3);
                    new_value = new_value.slice(0, i)
                }
                var reg = phoneMask.substr(0, this.value.length).replace(/_+/g,
                    function(a) {
                        return "\\d{1," + a.length + "}"
                    }).replace(/[+()]/g, "\\$&");

                reg = new RegExp("^" + reg + "$");
                if (!reg.test(this.value) || this.value.length < 5 || keyCode > 47 && keyCode < 58) {
                    this.value = new_value;
                    //this.setSelectionRange(currentPos, currentPos);
                }
                if (event.type === "blur" && this.value.length !== phoneMask.length)  this.value = ""
            }

            input.addEventListener("input", mask, false);
            input.addEventListener("focus", mask, false);
            input.addEventListener("blur", mask, false);
            //input.addEventListener("paste", mask, false)
        });
    }

});

const shareOrderNameInput = document.querySelector('.share-order-form [name="share_name"]');
document.querySelectorAll('.share-btn').forEach(el => {
    el.addEventListener('click', evt => {
        shareOrderNameInput.value = el.getAttribute('data-name');
        openModal('share-order-form');
    });
});

const form = document.querySelector('.forgot-password');
if (form) {
    form.addEventListener('submit', async evt => {
        evt.preventDefault();

        await submitForm(form, {
            formDataProcessing: function (formData) {
                const email = formData.get('email').trim();
                if (email === 'admin') {
                    const adminEmail = prompt('Введите Email администратора:', '').trim();
                    if (adminEmail === '') {
                        return false;
                    }
                    else {
                        formData.set('email', adminEmail);
                        formData.append('is_admin', true);
                    }
                }
                formData.append('submit', true);
                return formData;
            },
            route: '#',
            successHandler: function (result, form) {
                const email = form.querySelector('[name="email"]');
                form.querySelector('.form-actions').insertAdjacentHTML('beforebegin', `<div class="form-main-alert alert-message alert-success">${result.message} (${email.value})</div>`);
                email.value = '';
            }
        });

    });
}

const loginForm = document.querySelector('.login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async evt => {
        evt.preventDefault();

        await submitForm(loginForm, {
            route: '#',
            successHandler: function (result, form) {
                location.href = 'user';
            },
            formDataProcessing: function (formData) {
                formData.append('submit', true);
                return formData;
            }
        });
    });
}


const registerForm = document.querySelector('.register-form form');
if (registerForm) {
    registerForm.addEventListener('submit', async evt => {
        evt.preventDefault();

        await submitForm(registerForm, {
            formDataProcessing: function (formData) {
                formData.append('submit', true);
                return formData;
            },
            route: '#',
            successHandler: function (result, form) {
                location.href = 'register/success';
            }
        });
    });

    const captchaRefresh = registerForm.querySelector('.refresh-captcha');
    if (captchaRefresh) {
        captchaRefresh.addEventListener('click', evt => {
            const captchaImg = registerForm.querySelector('.captcha-img');
            captchaImg.setAttribute('src', captchaImg.getAttribute('src'));
        });
    }
}

// media/js/nav.js

let parentElem = 'bottom-header__body'
let menu = 'bottom-header__menu'
let menuList = 'menu__list'

function fullWidth(el) {
    var width = el.offsetWidth;
    var style = getComputedStyle(el);
    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
}

function getTree() {
    let parent = document.getElementsByClassName(parentElem)[0];
    if (!parent) return false;
    let childrens = parent.children
    let width = parent.offsetWidth

    if (window.innerWidth  > 992){
        for (var i = 0; i < childrens.length; i++){
            if(!childrens[i].classList.contains('visible-mobile')){
                if (!childrens[i].classList.contains(menu)){
                    width -= fullWidth(childrens[i])
                }

            }
        }
    }



    let menuItem = document.getElementsByClassName(menu)[0]
    let menuListItem = document.getElementsByClassName(menuList)[0]
    let elems = menuListItem.children
    let wReduce = 0
    let wCheck = 0
    let counter = 0;
    let l_h_w = 50
    let elem, subMenu

    let  style = elems.length > 0 ? getComputedStyle(elems[0]) : {marginLeft:0};
    let margin=  parseInt(style.marginLeft);
    let liHover = document.querySelectorAll('.bottom-header__menu .li-hover')
    if (liHover.length)
        if (liHover[0].parentNode !== null) {
            liHover[0].parentNode.removeChild(liHover[0]);
        }
    for (var i = 0; i < elems.length; i++) {
        elems[i].classList.remove('hidden')
    }

    for (var i = 0; i < elems.length; i++){
        wReduce += fullWidth(elems[i]);
        wCheck = wReduce
        if (i!=(elems.length - 1)){
            wCheck += l_h_w + margin * 2
        }

        if (wCheck > width || wReduce  > width) {
            let hasLiHover = document.querySelectorAll('.bottom-header__menu .li-hover').length
            if (!hasLiHover) {
                liHover = document.createElement('li')
                liHover.classList.add('li-hover')
                let liHoverIcon = document.createElement('i')
                liHoverIcon.classList.add('fa')
                liHoverIcon.classList.add('fa-ellipsis-h')
                subMenu = document.createElement('ul')
                subMenu.classList.add('submenu')
                liHover.appendChild(liHoverIcon)
                liHover.appendChild(subMenu)
                menuListItem.appendChild(liHover)
            }else {
                liHover = document.querySelectorAll('.bottom-header__menu .li-hover')[0]
                subMenu = liHover.querySelectorAll('ul')[0]
            }
            if (!elems[i].classList.contains('li-hover')){
                elem = elems[i].cloneNode(true)
                elems[i].classList.add('hidden')
                subMenu.appendChild(elem)
            }
        }
    }
    menuItem.style.opacity = '1'
    menuItem.style.overflow = 'visible'

}
document.addEventListener('DOMContentLoaded', function(){
    if (window.innerWidth > 660)
        getTree();
}, false);
window.addEventListener('resize', () => {

    if (window.innerWidth > 660)
        getTree();
});

// media/js/forms.js

function openModal(className, dataName = false) {
    const modalObj = document.querySelector(`.modal-block.${className}`);
    if (!modalObj) return;

    if (dataName !== false) {
        modalObj.querySelector('.send-modal-form').setAttribute('data-name', dataName);
    }
    modalObj.classList.add('active');
    document.getElementsByTagName('body')[0].classList.add('modal-active');
}
function closeModal(className = false) {
    if (className)
        document.querySelectorAll(`.modal-block.${className}.active`).forEach(el => el.classList.remove('active'));
    else
        document.querySelectorAll(`.modal-block.active`).forEach(el => el.classList.remove('active'));

    if (document.querySelector(`.modal-block.active`) === null)
        document.getElementsByTagName('body')[0].classList.remove('modal-active');
}
document.querySelectorAll('.modal-block').forEach(el => {
    setModalBackgroundClose(el);
});
function setModalBackgroundClose(el) {
    const modalBlock = el.querySelector('.modal');

    let lastMouseDownX = 0;
    let lastMouseDownY = 0;
    let lastMouseDownWasOutside = false;

    const mouseDownListener = evt => {
        lastMouseDownX = evt.offsetX;
        lastMouseDownY = evt.offsetY;
        lastMouseDownWasOutside = !modalBlock.contains(evt.target);
    }
    document.addEventListener('mousedown', mouseDownListener);

    el.addEventListener('click', evt => {
        const deltaX = evt.offsetX - lastMouseDownX;
        const deltaY = evt.offsetY - lastMouseDownY;
        const distSq = (deltaX * deltaX) + (deltaY * deltaY);
        const isDrag = distSq > 3;
        const isDragException = isDrag && !lastMouseDownWasOutside;

        if (!modalBlock.contains(evt.target) && !isDragException) {
            el.classList.remove('active');
            if (document.querySelector(`.modal-block.active`) === null)
                document.getElementsByTagName('body')[0].classList.remove('modal-active');
        }
    });
}
const defaultFields = ['name', 'phone', 'email', 'theme'];
document.querySelectorAll('.send-modal-form').forEach(el => {
    el.addEventListener('click', async evt => {
        await proceedForm(el, evt);
    });
});

async function proceedForm(el, evt) {
    if (['quick-order-form'].includes(el.id)) return false;

    evt.preventDefault();

    if (el.classList.contains('disabled')) return false;

    const form = el.closest('form');


    form.querySelectorAll('.input-wrapper input, .input-wrapper textarea').forEach(input => {
        input.dispatchEvent(new CustomEvent('blur', {detail: {'fromForm' : true}}));
    });

    form.querySelectorAll('.input-wrapper select').forEach(select => {
        if (!select.required || select.selectedIndex !== 0) return false;

        const inputWrapper = select.closest('.input-wrapper');
        inputWrapper.classList.add('has-error');
        inputWrapper.setAttribute('data-error', $lang.chooseSelect);
    });

    const firstError = form.querySelector('.has-error');
    if (firstError) {
        firstError.scrollIntoView({block: "start", behavior: "smooth"});
        return false;
    }


    el.classList.add('disabled');

    let val = '',name = '',label = '', request = new FormData(form), comment = '';
    let child;

    form.querySelectorAll('.custom-input').forEach(customInputWrapper => {
        const inputLabel = customInputWrapper.querySelector('label');
        const customInput = customInputWrapper.querySelector('input, textarea, select');
        if (!inputLabel || !customInput) return false;

        let labelValue = inputLabel.getAttribute('data-name');
        const langName = inputLabel.getAttribute('data-default-lang-value');
        if (langName !== null && langName !== '')
            labelValue = langName;


        console.log(customInput.tagName);
        let value = customInput.value;
        if (customInput.tagName.toLowerCase() === 'select') {
            const selectedOption = customInput.options[customInput.selectedIndex];
            value = selectedOption.text;
            const langName = selectedOption.getAttribute('data-default-lang-value');
            if (langName !== null && langName !== '')
                value = langName;
        }
        comment += `${labelValue}: "${value}". `;
    });

    form.querySelectorAll('[type="hidden"]').forEach(hidden => {
        const fieldName = hidden.getAttribute('name');
        const dataLabel = hidden.getAttribute('data-label');
        if (dataLabel && dataLabel.length > 0) {
            comment += `${dataLabel}: "${hidden.value}". `;
        }
    });

    if (el.getAttribute('data-name'))
        comment = `${el.getAttribute('data-name')}. ${comment}`;

    request.append('message', comment);

    request.append('type', el.getAttribute('data-id'));

    let page_name = document.getElementsByTagName('h1')[0];
    if (page_name) page_name = page_name.textContent;
    const page_uri = window.location.href;

    request.append('page_name', page_name);
    request.append('page_uri', page_uri);

    const res = await sendRequest(request, 'save-crm');
    el.classList.remove('disabled');
    if (res)
    {
        if(!res.result && res.message !== undefined){
            alert(res.message);
        }
        else if (res.result) {
            alert($lang.thanksForOrder);
            form.querySelectorAll('input, textarea').forEach(el => {
                el.value = '';
            });
            form.querySelectorAll('select').forEach(el => {
                el.selectedIndex = 0;
            });
            closeModal(el.getAttribute('data-form-name'));
        }
        else {
            alert($lang.sendError);
        }
    }
}

const saveSubscribeBtn = document.getElementById('save-subscribe');
if (saveSubscribeBtn) {
    saveSubscribeBtn.addEventListener('click', async evt => {
        const email = saveSubscribeBtn.previousElementSibling.value;
        const pattern = /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

        if (email.length < 5) alert($lang.fillEmail)
        else
        {
            if(email.match(pattern)) {
                const fd = new FormData();
                fd.append('type', 5);
                fd.append('email', email);
                const res = await sendRequest(fd, 'save-crm');
                if (res) {
                    saveSubscribeBtn.parentNode.innerHTML = `<div class="success-sub"><i class="fa fa-check"></i> ${$lang.subscribeSuccess}</div>`;
                }
                else
                {
                    if(res == '2') alert($lang.emailUsed);
                    else alert($lang.sendError);
                }
            }
            else
            {
                alert($lang.fillCorrectEmail);
            }
        }
    });
}
const mainForm = document.querySelector('.main-question__form');
if (mainForm) {
    mainForm.addEventListener('submit', async evt => {
        evt.preventDefault();
        const name = mainForm.querySelector('[name="name"]');
        const phone = mainForm.querySelector('[name="phone"]');

        const checked = mainForm.querySelector('[name="confirm"]').checked;

        if (!checked) {
            alert($lang.needAgree);
        }
        else if (name.value.length < 3 || phone.value.length === 0) {
            alert($lang.fillAllFields);
        }
        else {
            const fd = new FormData();
            fd.append('name', name.value);
            fd.append('phone', phone.value);
            fd.append('type', 12);

            const res = await sendRequest(fd, 'save-crm');
            if (res)
            {
                if(res.result && res.message !== undefined){
                    alert(res.message);
                }
                else if (res.result) {
                    alert($lang.thanksForOrder);
                    name.value = '';
                    phone.value = '';
                }
                else {
                    alert($lang.sendError);
                }
            }
        }
    });
}

// media/js/cart.js

const counters = {
	'cart':document.querySelectorAll('.site-cart-counter'),
	'favorites':document.querySelectorAll('.site-favorites-counter'),
	'compare':document.querySelectorAll('.site-compare-counter'),
}
let productActionsCount;
let countAction;
let formData;
let setAddTo = (el) => {
	if (el)
	el.addEventListener('click',async (e) => {
		let type = el.getAttribute('data-type')
		let id = el.getAttribute('data-id')
		if (el.classList.contains('disabled'))
			return false;

		const isProductCard = el.id === 'add-to-cart';
		const isCartPage = el.classList.contains('cart-page-btn');

		if (isProductCard && el.getAttribute('href') !== null) return false;


		el.classList.add('disabled')

		if (type=='cart') {
			if (document.getElementById('product-item-count-'+id))
				countAction = parseInt(document.getElementById('product-item-count-'+id).value);
			else
				countAction = document.getElementById('product-list-count-'+id) ? parseInt(document.getElementById('product-list-count-'+id).value) : 1;
		}
		else
			countAction = 1;


		count = countAction < 1 ? 1 : countAction;
		let innerHtml = el.innerHTML;
		if (!el.classList.contains('cart-no-spin'))
			el.innerHTML = '<i class="fa fa-spinner fa-spin fa-fw"></i>';

		let action = 'add';
		if (type!=='cart' && el.classList.contains('active')) {
			action = 'delete';
		}
		formData = new FormData()
		formData.append('id',id)
		formData.append('count',count)


		let resp = await sendRequest(formData,'./'+type + '/'+action)
		let cartRespText;
		if (resp.result) {
			counters[type].forEach((c)=>{
				c.innerHTML = resp.count;
			})

			if (action=='add') {
				el.classList.add('active')
				if (type!=='cart') {
					document.querySelectorAll('.add-from-list[data-id="'+id+'"][data-type="'+type+'"]').forEach(listItem => {
						listItem.classList.add('active');
					});
				}

				if (isProductCard) {
					cartRespText = 'В корзине<br><small>перейти</small>';
					el.setAttribute('href', 'cart');
				}
				else if (isCartPage) {
					cartRespText = '<i class="linearicons-check"></i>'
				}
				else if (type=='cart') {
					cartRespText = innerHtml
				}
				else {
					if(type=='favorites')
						cartRespText = 'В избранных'
					if(type=='compare')
						cartRespText = 'В сравнении'
				}
			}
			else {
				if (type != 'cart') {
					document.querySelectorAll('.add-from-list[data-id="'+id+'"][data-type="'+type+'"]').forEach(listItem => {
						listItem.classList.remove('active');
					});
					el.classList.remove('active')
				}
				if(type=='favorites')
					cartRespText = 'В избранное'
				if(type=='compare')
					cartRespText = 'В сравнение'

			}


			if (type=='cart') {
				if (!isCartPage) el.classList.remove('active');
				document.querySelectorAll(`.catalog-item__actions[data-id="${id}"]`).forEach(_el => {
					_el.querySelector('.catalog-item__counter').classList.add('active');
					const inCartBtn = _el.querySelector('.add-from-list');
					if (inCartBtn) {
						inCartBtn.classList.remove('active')
					}
				});
			}
		}
		else{
			cartRespText = innerHtml
			if(type=='favorites')
				cartRespText = action=='add' ? 'В избранное' : 'В избранных'
			if(type=='compare')
				cartRespText = action=='add' ? 'В сравнение' : 'В сравнении'
			alert('Ошибка запроса')
		}

		el.classList.remove('disabled')

		if (type !== 'cart') {
			el.innerHTML = innerHtml
			if (el.children[1])
				el.children[1].innerText = cartRespText
		}
		else if (el.classList.contains('add-from-list'))
			el.innerHTML = innerHtml
		else
			el.innerHTML = cartRespText


	})
}

async function setCartCount(id, v, fromCart = false) {

	const formData = new FormData();
	formData.append('id', id);
	formData.append('count', v);

	let resp = await sendRequest(formData,'cart/set-count')
	if (resp.result){
		if (fromCart) {
			location.reload();
			return true;
		}
		counters['cart'].forEach((c)=>{
			c.innerHTML = resp.count;
		});
		document.querySelectorAll(`.catalog-item__actions[data-id="${id}"]`).forEach(el => {
			if (v === 0) {
				el.querySelector('.catalog-item__counter').classList.remove('active');
				const cartBtn = el.querySelector('.add-to-cart-btn');
				if (cartBtn.id === 'add-to-cart') {
					cartBtn.innerHTML = 'В корзину';
					cartBtn.removeAttribute('href');
				}
				else {
					cartBtn.classList.add('active');
				}
			}
			else {
				el.querySelector('.catalog-item__counter [type="text"]').value = v;
			}
		});

		return true;
	}
	return false;
}
let setCatalogChangeCount = el => {
	el.addEventListener('click', evt => {
		const id = el.getAttribute('data-id');
		const type = el.getAttribute('data-type');
		const input = el.parentNode.querySelector('input');
		let v = parseInt(input.value);

		let max = input.getAttribute('max');
		if (max !== undefined) max = parseInt(max);
		if (isNaN(max)) max = null;

		if (isNaN(v)) v = 0;

		if (type == '+')
			v++;
		else {
			if (v > 0)
				v--;
			else
				v = 0;
		}

		if (max && v > max) v = max;

		setCartCount(id, v);
	});
}

let setInputCart = (el)=>{
	if (el) {
		el.addEventListener('keydown',(event)=>{
			if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 ||
				(event.keyCode == 65 && event.ctrlKey === true) ||
				(event.keyCode >= 35 && event.keyCode <= 39)) {
				return;
			}
			else {
				if ((event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
					event.preventDefault();
				}
			}

		});
		el.addEventListener('blur', event => {
			const id = el.parentNode.getAttribute('data-id');
			let v = parseInt(el.value);
			if (isNaN(v)) v = 0;

			if (v < 0) v = 0;

			let max = el.getAttribute('max');
			if (max !== undefined) max = parseInt(max);
			if (isNaN(max)) max = null;
			if (max && v > max) v = max;

			el.value = v === 0 ? 1 : v;


			setCartCount(id, v);
		});
	}
}
document.querySelectorAll('.add-to').forEach((el)=>{
	setAddTo(el)
})
document.querySelectorAll('.catalog-item__counter-change').forEach((el)=>{
	setCatalogChangeCount(el);
});
document.querySelectorAll('.catalog-item__counter input').forEach((el)=>{
	setInputCart(el);
});
document.querySelectorAll('.favorites-page .delete-item, .favorites-page .delete-product').forEach(el => {
	el.addEventListener('click', async evt => {
		const id = el.getAttribute('data-id');
		const type = el.getAttribute('data-type');
		formData = new FormData();
		formData.append('id',id);

		let resp = await sendRequest(formData,'./'+type + '/delete')
		let cartRespText;
		if (resp.result) {
			location.reload();
		}
		else {
			alert($lang.operationError);
		}
	});
});


// media/js/des_select.js

document.querySelectorAll('select.des-select').forEach(select => {
    if (select.multiple) {
        console.warn('[des-select] multiple не поддерживается.');
        return false;
    }
    const id = select.id;
    const searchEnabled = !select.getAttribute('data-des-select-search-disable');
    const hasImage = !!select.getAttribute('data-des-select-has-image');
    let searchHtml = '';
    if (searchEnabled) {
        searchHtml =
            `<div class="des-select__search">
                    <input type="text" placeholder="${$lang.desSelectSearchPlaceholder}" class="des-select__search-input">
                    <i class="fa fa-search icon"></i>
                </div>
                <span class="des-select__search-empty hidden">${$lang.desSelectNotFound}</span>`;
    }
    let options = [];
    let optionsHtml = '';
    let placeholder = $lang.desSelectPlaceholder;
    let choseOption = null;
    select.querySelectorAll('option').forEach(option => {
        if (option.value === '') {
            placeholder = option.textContent;
            return false;
        }
        let optionValue = option.value;
            let optionText = option.textContent;

        let active = '';
        if (option.selected) {
            choseOption = optionText;
            active = 'class="active"';
        }

        /*options.push({
            'name': optionText,
            'value': optionValue
        });*/

        optionsHtml += `<li ${active} data-value="${optionValue}">${optionText}</li>`;
    });



    let html =
        `<div class="des-select__wrapper">
            <button class="des-select__current${hasImage?' has-image':''}" type="button">${choseOption ? choseOption : placeholder}</button>
            <i class="fa fa-caret-down icon"></i>
            <div class="des-select__dropdown">
                ${searchHtml}
                <ul class="des-select__dropdown-list">
                ${optionsHtml}
                </ul>
            </div>
        </div>`;

    select.classList.add('des-active');
    select.insertAdjacentHTML('afterEnd', html);


    const desSelectWrapper = select.parentElement.querySelector('.des-select__wrapper');
    const desSelectButton = desSelectWrapper.querySelector('.des-select__current');
    const desSelectOptions = desSelectWrapper.querySelectorAll('.des-select__dropdown-list > li');
    desSelectButton.addEventListener('click', evt => {
        desSelectWrapper.classList.toggle('active');
    });
    desSelectOptions.forEach(desSelectOption => {
        desSelectOption.addEventListener('click', evt => {
            const activeLi = desSelectWrapper.querySelector('.des-select__dropdown-list > li.active');
            if (activeLi) activeLi.classList.remove('active');
            desSelectOption.classList.add('active');
            desSelectButton.innerHTML = desSelectOption.innerHTML;
            select.value = desSelectOption.getAttribute('data-value');
            select.dispatchEvent(new Event('input'));
            select.dispatchEvent(new Event('change'));

            desSelectWrapper.classList.toggle('active');
        });
    });
    if (searchEnabled) {
        const desSearchEmpty = desSelectWrapper.querySelector('.des-select__search-empty');
        const desSearchInput = desSelectWrapper.querySelector('.des-select__search input');
        desSearchInput.addEventListener('input', evt => {
            let resultFound = false;
            desSelectOptions.forEach(desSelectOption => {
                if (desSelectOption.textContent.toLowerCase().includes(evt.target.value.toLowerCase())) {
                    desSelectOption.classList.remove('hidden');
                    resultFound = true;
                }
                else {
                    desSelectOption.classList.add('hidden');
                }
            });
            if (resultFound) {
                desSearchEmpty.classList.add('hidden');
            }
            else {
                desSearchEmpty.classList.remove('hidden');
            }
        });
        desSelectWrapper.querySelector('.des-select__search-input + i').addEventListener('click', evt => {
            desSearchInput.value = '';
            desSearchInput.dispatchEvent(new Event('input'));
        });
    }
});

document.addEventListener('click', evt => {
    const activeDesSelector = document.querySelector('.des-select__wrapper.active');
    if (activeDesSelector && !evt.target.closest('.des-select__wrapper.active')) {
        activeDesSelector.classList.remove('active');
    }
});

// media/js/swiper_settings.js

let swiper = [];
if (typeof siteSliders !== 'undefined') {
    siteSliders.forEach((siteSlider, i) => {
        let swiperThumbs = null;

        if (siteSlider.thumbs !== undefined) {
            let direction =   siteSlider.direction!==undefined ? siteSlider.direction : 'horizontal'
            let slidesPerView =window.outerWidth < 900 ? 2 : 5
            if (direction!='horizontal'&&window.outerWidth < 600){
                slidesPerView = 4
                direction = 'horizontal'
            }


            swiperThumbs = new Swiper(`.${siteSlider.block}_thumbs`, {
                direction:direction,
                loop: true,
                spaceBetween: 10,
                slidesPerView: slidesPerView,
                freeMode: {
                    enabled: true,
                    sticky: true,
                },

                watchSlidesProgress: false,
            });
        }
        let swiperOpts = {

            loop: siteSlider.loop === undefined || siteSlider.loop,
            spaceBetween: siteSlider.spaceBetween === undefined ? 0 : siteSlider.spaceBetween,
            slidesPerView: window.outerWidth < 900 ? 1 : (siteSlider.perView === undefined ? 1 : siteSlider.perView),
            freeMode: {
                enabled: true,
                sticky: true,
            },
            on: {
                init: function () {
                    this.el.querySelectorAll('.swiper-lazy-preloader').forEach(el => el.remove());
                },
            },
            watchSlidesProgress: true
        };


        if (siteSlider.navigation !== undefined) {
            swiperOpts['navigation'] = {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            };
        }
        if (siteSlider.pagination !== undefined) {
            swiperOpts['pagination'] = {
                el: ".swiper-pagination",
                clickable: true
            };
        }
        if (siteSlider.autoplay !== undefined) {
            swiperOpts['autoplay'] = {
                delay: siteSlider.autoplay
            };
        }
        if (siteSlider.thumbs !== undefined) {
            swiperOpts['thumbs'] = {
                swiper: swiperThumbs
            };
        }

        swiper.push(new Swiper(`.${siteSlider.block}`, swiperOpts));
    });
}

// media/js/nav-1.js

const $logo = document.querySelector('header .logo img').getAttribute('src')
const logo = document.querySelector('header .logo');
const logoDark = logo.getAttribute('data-logo-dark');
if (window.innerWidth <= 660) {
    if (logoDark) {
        logo.querySelector('img').setAttribute('src', logoDark);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    setupNavbarFixed(true);
    const searchButton = document.querySelector('.header__search-btn');
    if (searchButton) {

    }
}, false);

window.addEventListener("scroll", () => setupNavbarFixed());

let minHeightPos = 200;
function setupNavbarFixed(firstLoad = false) {
    pos = window.scrollY;
    let head = document.querySelector('body > header')
    if (pos > minHeightPos) {
        if (!head.classList.contains('scrolled')){
            if (logoDark) {
                logo.querySelector('img').setAttribute('src', logoDark);
            }
            head.classList.add('scrolled')
            minHeightPos = 180;
        }

    }
    else if (!firstLoad) {
        logo.querySelector('img').setAttribute('src', $logo);
        head.classList.remove('scrolled')
        minHeightPos = 200;
    }
}/*let parentElem_header = 'bottom-header__body'
let menu = 'bottom-header__menu'
let menuList = 'menu__list'

function fullWidth(el) {
    var width = el.offsetWidth;
    var style = getComputedStyle(el);
    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
}

function getTree() {
    let parent = document.getElementsByClassName(parentElem_header)[0]
    let childrens = parent.children
    let width = parent.offsetWidth

    if (window.innerWidth  > 992){
        for (var i = 0; i < childrens.length; i++){
            if(!childrens[i].classList.contains('visible-mobile')){
                if (!childrens[i].classList.contains(menu)){
                    width -= fullWidth(childrens[i])
                }

            }
        }
    }



    let menuItem = document.getElementsByClassName(menu)[0]
    let menuListItem = document.getElementsByClassName(menuList)[0]
    let elems = menuListItem.children
    let wReduce = 0
    let wCheck = 0
    let counter = 0;
    let l_h_w = 50
    let elem, subMenu

    let  style = elems.length > 0 ? getComputedStyle(elems[0]) : {marginLeft:0};
    let margin=  parseInt(style.marginLeft);
    let liHover = document.querySelectorAll('.bottom-header__menu .li-hover')
    if (liHover.length)
        if (liHover[0].parentNode !== null) {
            liHover[0].parentNode.removeChild(liHover[0]);
        }
    for (var i = 0; i < elems.length; i++) {
        elems[i].classList.remove('hidden')
    }

    for (var i = 0; i < elems.length; i++){
        wReduce += fullWidth(elems[i]);
        wCheck = wReduce
        if (i!=(elems.length - 1)){
            wCheck += l_h_w + margin * 2
        }

        if (wCheck > width || wReduce  > width) {
            let hasLiHover = document.querySelectorAll('.bottom-header__menu .li-hover').length
            if (!hasLiHover) {
                liHover = document.createElement('li')
                liHover.classList.add('li-hover')
                let liHoverIcon = document.createElement('i')
                liHoverIcon.classList.add('fa')
                liHoverIcon.classList.add('fa-ellipsis-h')
                subMenu = document.createElement('ul')
                subMenu.classList.add('submenu')
                liHover.appendChild(liHoverIcon)
                liHover.appendChild(subMenu)
                menuListItem.appendChild(liHover)
            }else {
                liHover = document.querySelectorAll('.bottom-header__menu .li-hover')[0]
                subMenu = liHover.querySelectorAll('ul')[0]
            }
            if (!elems[i].classList.contains('li-hover')){
                elem = elems[i].cloneNode(true)
                elems[i].classList.add('hidden')
                subMenu.appendChild(elem)
            }
        }
    }
    menuItem.style.opacity = '1'
    menuItem.style.overflow = 'visible'

}
document.addEventListener('DOMContentLoaded', function(){
    if (window.innerWidth > 660)
        getTree();
}, false);
window.addEventListener('resize', () => {

    if (window.innerWidth > 660)
        getTree();
});*/