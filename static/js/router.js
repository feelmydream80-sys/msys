import { dispose as disposeLoading } from './components/loading.js';

const mainContent = document.getElementById('main-content');


let currentPageModule = null;

async function fetchPage(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.redirected) {
            window.location.href = response.url;
            return null;
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.text();
    } catch (error) {

        mainContent.innerHTML = `<p class="text-red-500 text-center">Error loading page. Please try again.</p>`;
        return null;
    }
}

function executeScripts(container) {
    const scripts = container.querySelectorAll("script");
    scripts.forEach(script => {
        const newScript = document.createElement("script");
        for (const attr of script.attributes) {
            newScript.setAttribute(attr.name, attr.value);
        }
        if (script.innerHTML) {
            newScript.innerHTML = script.innerHTML;
        }
        document.head.appendChild(newScript);
        if (!newScript.src) {
            document.head.removeChild(newScript);
        }
    });
}

function handlePageSpecificStyles(doc) {

    const oldStyle = document.getElementById('page-specific-style');
    if (oldStyle) {
        oldStyle.remove();
    }


    const newStyle = doc.getElementById('page-specific-style');
    if (newStyle) {
        document.head.appendChild(newStyle);
    } else {

        const allStyles = document.querySelectorAll('style[id="page-specific-style"]');
        allStyles.forEach(style => style.remove());
    }
}

async function navigate(url) {
    const pageUrl = new URL(url, window.location.origin);
    const path = pageUrl.pathname;

    if (currentPageModule && typeof currentPageModule.dispose === 'function') {
        currentPageModule.dispose();
    }
    disposeLoading();

    const html = await fetchPage(path);
    if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector('#main-content') || doc.body;

        handlePageSpecificStyles(doc);

        mainContent.innerHTML = newContent.innerHTML;
        history.pushState({}, '', path);

        executeScripts(mainContent);


        const menuItem = window.MENU_DATA.find(item => item.menu_url === path);
        
        if (menuItem && menuItem.menu_id) {
            try {

                const module = await import(`./pages/${menuItem.menu_id}.js`);
                currentPageModule = module;
                if (module.init) {
                    module.init();
                } else if (typeof module.default === 'function') {
                    module.default();
                }
            } catch (error) {

            }
        }



        if (window.updateActiveNav) {
            window.updateActiveNav();
        }
    }
}


let isInitialPageLoaded = false;

document.addEventListener('DOMContentLoaded', () => {

    if (isInitialPageLoaded) return;
    isInitialPageLoaded = true;


    const currentPath = window.location.pathname;
    const menuItem = window.MENU_DATA.find(item => item.menu_url === currentPath);
    
    if (menuItem && menuItem.menu_id) {
        import(`./pages/${menuItem.menu_id}.js`)
            .then(module => {
                currentPageModule = module;
                if (module.init) module.init();
                else if (typeof module.default === 'function') module.default();
            })
            .catch(error => {});
    }



    document.body.addEventListener('click', e => {

        const link = e.target.closest('a.nav-link');

        if (link) {

            if (link.target === '_blank') {
                return;
            }
            

            e.preventDefault();
            

            if (link.href === window.location.href) {
                return;
            }

            navigate(link.href);
        }
    });

    window.addEventListener('popstate', () => {
        navigate(window.location.href);
    });
});
