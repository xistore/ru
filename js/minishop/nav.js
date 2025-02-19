/*function fullWidth(el) {
    var width = el.offsetWidth;
    var style = getComputedStyle(el);
    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
}

function getTree(currentWrapper) {
    if (currentWrapper === undefined) return;

    let wrapperChildren = currentWrapper.children
    let wrapperWidth = currentWrapper.offsetWidth

    if (window.innerWidth > 992) {
        for (let i = 0; i < wrapperChildren.length; i++){
            if(!wrapperChildren[i].classList.contains('visible-mobile')){
                if (!wrapperChildren[i].classList.contains('nav-shrinker__list-block')){
                    wrapperWidth -= fullWidth(wrapperChildren[i])
                }
            }
        }
    }


    let menuItem = currentWrapper.querySelector('.nav-shrinker__list-block')
    let menuListItem = currentWrapper.querySelector('ul')
    let elems = menuListItem.children
    let wReduce = 0
    let wCheck = 0
    let counter = 0;
    let l_h_w = 50
    let elem, subMenu

    let style = elems.length > 0 ? getComputedStyle(elems[0]) : {marginLeft:0};
    let margin = parseInt(style.marginLeft);
    let liHover = currentWrapper.querySelectorAll('.li-hover')
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
        if (i != (elems.length - 1)){
            wCheck += l_h_w + margin * 2
        }


        if (wCheck > wrapperWidth || wReduce  > wrapperWidth) {
            let hasLiHover = currentWrapper.querySelectorAll(`.li-hover`).length
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
                liHover = currentWrapper.querySelector('.li-hover')
                subMenu = liHover.querySelector('ul')
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
    if (window.innerWidth > 660) {
        document.querySelectorAll('.nav-shrinker__wrapper').forEach(value => getTree(value));
    }
}, false);
window.addEventListener('resize', () => {
    if (window.innerWidth > 660)
        document.querySelectorAll('.nav-shrinker__wrapper').forEach(value => getTree(value));
});*/