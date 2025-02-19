const mainPageProducts = document.querySelector('.main-page__products');
if (mainPageProducts) {
    mainPageProducts.querySelectorAll('.dop-items button').forEach(el => {
        el.addEventListener('click', async evt => {
            if (el.classList.contains('active')) return false;

            const type = el.getAttribute('data-type');
            const href = el.getAttribute('data-href');
            const buttonName = el.getAttribute('data-name');
            const loader = mainPageProducts.querySelector('.load-full-page');
            loader.classList.add('active');
            const fd = new FormData();
            fd.append('type', type);
            const res = await sendRequest(fd, '#');
            loader.classList.remove('active');
            if (res.result) {

                mainPageProducts.querySelectorAll('.dop-items button').forEach(btn => {
                    if (btn.getAttribute('data-type') === type)
                        btn.classList.add('active');
                    else
                        btn.classList.remove('active');
                });

                const mainCatalogProducts = mainPageProducts.querySelector('.catalog-products');
                mainCatalogProducts.innerHTML = res.html;


                const moreBtn = mainPageProducts.querySelector('.main-page__products-more');
                let hasItems = false;

                mainCatalogProducts.querySelectorAll('.catalog-item').forEach(item => {
                    hasItems = true;
                    item.querySelectorAll('.add-to').forEach((ch)=>{
                        setAddTo(ch);
                    });
                    item.querySelectorAll('.catalog-item__counter-change').forEach((ch)=>{
                        setCatalogChangeCount(ch);
                    });
                    item.querySelectorAll('.catalog-item__counter input').forEach((ch)=>{
                        setInputCart(ch);
                    });
                    item.querySelectorAll('.quick-view').forEach(qw=>{
                        qw.addEventListener('click',()=>{
                            quickViewProduct(qw);
                        });
                    });
                });
                if (hasItems) {
                    if (moreBtn) {
                        moreBtn.classList.remove('hidden');
                        moreBtn.setAttribute('href', href);
                        moreBtn.textContent = buttonName;
                    }
                    mainCatalogProducts.classList.remove('catalog-empty');
                }
                else {
                    mainCatalogProducts.classList.add('catalog-empty');
                    if (moreBtn) moreBtn.classList.add('hidden');
                }
            }
            else if (res.message !== undefined) {
                alert(res.message);
            }
        });
    });
}
noCatalog = noCatalog === undefined ? false : noCatalog;
categoriesOnlyRoot = categoriesOnlyRoot === undefined ? false : categoriesOnlyRoot;
countInMainLine = countInMainLine === undefined ? 5 : countInMainLine;

if (noCatalog && categoriesOnlyRoot) {
    document.querySelectorAll('.main-products__categories > li').forEach(el => {
        el.addEventListener('click', evt => {
            document.querySelector('.main-products__categories > li.active').classList.remove('active');
            el.classList.add('active');
            loadCategory(el.getAttribute('data-id'));
        });
    });
}

if (!categoriesOnlyRoot) {
    const mainCategoriesWrapper = document.querySelector('.main-products__categories-wrapper');
    const mainCategories = document.querySelector('.main-products__categories');
    const chainList = document.querySelector('.main-products__chain');

    window.addEventListener('DOMContentLoaded', evt => {
        if (mainCategoriesWrapper) {
            mainCategoriesWrapper.style.height = `${mainCategories.offsetHeight}px`;
        }
    });
    document.querySelectorAll('.main-products .main-products__categories > li').forEach(li => {
        li.addEventListener('click', async evt => {
            const id = li.getAttribute('data-id');
            const clonedLi = li.cloneNode(true);
            clonedLi.classList.add('active');
            clonedLi.querySelector('button').classList.replace('btn-nonactive', 'btn-site');
            chainList.append(clonedLi);
            await showSubCategories(id);
            setChainActive();
            await loadCategory(id);
        });
    });
    document.addEventListener('click', async evt => {
        if (evt.target.closest('.main-products__chain > li:not(:last-child)')) {
            const currentLi = evt.target.closest('.main-products__chain > li');
            const id = currentLi.getAttribute('data-id');

            getNextSiblings(currentLi).forEach(el => {
                el.remove();
            });
            await showSubCategories(id);
            setChainActive();
            await loadCategory(id);
        }
    });
    function getNextSiblings(elem, filter) {
        let sibs = [];
        while (elem) {
            elem = elem.nextSibling;
            if (!elem || elem.nodeType === 3) continue; // text node
            if (!filter || filter(elem)) sibs.push(elem);
        }
        return sibs;
    }

    function setChainActive() {
        const chainLi = document.querySelectorAll('.main-products__chain li');
        chainLi.forEach((li, idx) => {
            if (chainLi.length - 1 === idx) {
                li.querySelector('button').classList.replace('btn-nonactive', 'btn-site');
            }
            else {
                li.querySelector('button').classList.replace('btn-site', 'btn-nonactive');
            }
        });
    }
    async function showSubCategories(id) {
        document.querySelectorAll('.main-products .main-products__categories > li').forEach(otherLi => {
            const otherParentId = otherLi.getAttribute('data-parent-id');
            if (otherParentId === id) {
                otherLi.classList.remove('hidden');
            }
            else {
                otherLi.classList.add('hidden');
            }
        });
        mainCategoriesWrapper.style.height = `${mainCategories.offsetHeight}px`;
    }
}

async function loadCategory(categoryID) {
    const moreBtn = document.getElementById('load-more-products-btn');
    if (moreBtn)
        moreBtn.remove();

    let fd = new FormData();
    fd.append('cat_id', categoryID);
    fd.append('param_page_number', 1);
    fd.append('custom_count', countInMainLine);

    const response = await loadProducts(fd, false);

    if (response) {
        fd.append('only_more_btn', true);
        const responseBtn = await fetch('catalog/get-pagination', {
            method: 'POST',
            headers: {
                'Accept': 'text/html'
            },
            body: fd
        });
        if (responseBtn.ok) {
            const dataBtn = await responseBtn.text();
            const paginationBlock = document.querySelector('.main-products .pagination-block');
            if (paginationBlock)
                paginationBlock.innerHTML += dataBtn;
        }
    }

}