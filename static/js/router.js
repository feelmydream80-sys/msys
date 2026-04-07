const mainContent = document.getElementById('main-content');

// 페이지 초기화 상태를 추적하는 변수
let isPageInitialized = false;

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
        console.error('Failed to fetch page:', error);
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
    // Remove old page-specific style if it exists
    const oldStyle = document.getElementById('page-specific-style');
    if (oldStyle) {
        oldStyle.remove();
    }

    // Add new page-specific style if the new page has one
    const newStyle = doc.getElementById('page-specific-style');
    if (newStyle) {
        document.head.appendChild(newStyle);
    } else {
        // If there's no new page-specific style, ensure all old styles are removed
        const allStyles = document.querySelectorAll('style[id="page-specific-style"]');
        allStyles.forEach(style => style.remove());
    }
}

async function navigate(url) {
    const pageUrl = new URL(url, window.location.origin);
    const path = pageUrl.pathname;

    const html = await fetchPage(path);
    if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector('#main-content') || doc.body;

        handlePageSpecificStyles(doc); // Handle page-specific CSS

        mainContent.innerHTML = newContent.innerHTML;
        history.pushState({}, '', path);

        executeScripts(mainContent);

        // Find the corresponding menu item from the global MENU_DATA
        const menuItem = window.MENU_DATA.find(item => item.menu_url === path);
        
        if (menuItem && menuItem.menu_id) {
            try {
                // Dynamically import the module based on menu_id
                const module = await import(`./pages/${menuItem.menu_id}.js`);
                if (module.init) {
                    module.init();
                } else if (typeof module.default === 'function') {
                    module.default();
                }
            } catch (error) {
                console.error(`[Router] CRITICAL: Failed to load or initialize module for ${menuItem.menu_id}:`, error);
            }
        }


        // Update the active navigation link
        if (window.updateActiveNav) {
            window.updateActiveNav();
        }
    }
}

// 중복 초기화 방지 플래그
let isInitialPageLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    // 이미 초기화되었으면 스킵
    if (isInitialPageLoaded) return;
    isInitialPageLoaded = true;

    // Initial page load handler
    const currentPath = window.location.pathname;
    const menuItem = window.MENU_DATA.find(item => item.menu_url === currentPath);
    
    if (menuItem && menuItem.menu_id) {
        import(`./pages/${menuItem.menu_id}.js`)
            .then(module => {
                if (module.init) module.init();
                else if (typeof module.default === 'function') module.default();
            })
            .catch(error => console.error(`Initial load failed for ${menuItem.menu_id}:`, error));
    }


    // 이벤트 위임을 사용하여 동적으로 추가되는 링크도 처리합니다.
    document.body.addEventListener('click', e => {
        // 클릭된 요소가 'a.nav-link'이거나 그 자식 요소인지 확인합니다.
        const link = e.target.closest('a.nav-link');

        if (link) {
            // 외부 링크(target="_blank")는 제외합니다.
            if (link.target === '_blank') {
                return;
            }
            
            // 기본 동작(페이지 이동)을 막습니다.
            e.preventDefault();
            
            // 현재 URL과 같은 링크를 클릭하면 무시합니다.
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
