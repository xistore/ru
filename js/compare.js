function unique(arr) {
    var obj = {};

    for (var i = 0; i < arr.length; i++) {
        var str = arr[i];
        obj[str] = true;
    }

    return Object.keys(obj);
}
document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.delete-product').forEach(el => {
        el.addEventListener('click', async evt => {
            const id = el.getAttribute('data-id');
            const fd = new FormData();
            fd.append('id', id);
            const res = await sendRequest(fd, 'compare/delete');
            if (res.result)
            {
                location.reload();
            }
            else
                alert($lang.sendError);
        });
    });

    let compareOptions = {};
    compareOptionsObjects = document.querySelectorAll('.compare__option');
    compareOptionsObjects.forEach(compareOption => {
        const optionID = compareOption.getAttribute('data-id');
        if (!compareOptions[optionID]) compareOptions[optionID] = [];
        compareOptions[optionID].push(compareOption.querySelector('em').innerHTML);
    });
    let compareOptionsUnique = {};
    for (let id in compareOptions) {
        compareOptionsUnique[id] = unique(compareOptions[id]);
    }
    document.querySelector('.switch input').addEventListener('change', evt => {
        if (evt.currentTarget.checked) {
            compareOptionsObjects.forEach(compareOption => {
                const id = compareOption.getAttribute('data-id');
                if (compareOptionsUnique[id].length == 1) {
                    compareOption.classList.add('hidden');
                }
                else {
                    compareOption.classList.remove('hidden');
                }
            });
        }
        else {
            compareOptionsObjects.forEach(el => {
                el.classList.remove('hidden');
            });
        }
    });

}, false);