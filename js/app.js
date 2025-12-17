// ===== DOM Elements =====
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');
const tocItems = document.querySelectorAll('.toc-item');
const sections = document.querySelectorAll('.content-section');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const currentSectionEl = document.getElementById('currentSection');
const backToTopBtn = document.getElementById('backToTop');

// ===== State =====
let activeSection = null;

// ===== Search Functionality =====
function performSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
        clearSearch();
        return;
    }
    
    searchClear.classList.remove('hidden');
    
    let matchCount = 0;
    const matchedSections = new Set();
    
    // Remove previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.outerHTML = el.textContent;
    });
    
    // Search through sections
    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        const sectionId = section.id;
        
        if (text.includes(normalizedQuery)) {
            matchedSections.add(sectionId);
            matchCount++;
            
            // Highlight matches in visible text
            highlightMatches(section, normalizedQuery);
        }
    });
    
    // Update TOC highlighting
    tocItems.forEach(item => {
        const targetId = item.getAttribute('data-target');
        if (matchedSections.has(targetId)) {
            item.classList.add('bg-yellow-50', 'border-l-yellow-400');
        } else {
            item.classList.remove('bg-yellow-50', 'border-l-yellow-400');
        }
    });
    
    // Update results count
    searchResults.textContent = `${matchCount} section${matchCount !== 1 ? 's' : ''} found`;
    searchResults.classList.remove('hidden');
}

function highlightMatches(element, query) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(query)) {
            textNodes.push(node);
        }
    }
    
    // Only highlight first few matches to avoid performance issues
    textNodes.slice(0, 5).forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        
        if (regex.test(text)) {
            const span = document.createElement('span');
            span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            textNode.parentNode.replaceChild(span, textNode);
        }
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearSearch() {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    searchResults.classList.add('hidden');
    
    // Remove highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.outerHTML = el.textContent;
    });
    
    // Remove TOC highlighting
    tocItems.forEach(item => {
        item.classList.remove('bg-yellow-50', 'border-l-yellow-400');
    });
}

// ===== TOC Navigation =====
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerOffset = 80;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // Close mobile sidebar
        closeSidebar();
    }
}

function updateActiveSection() {
    const scrollPosition = window.scrollY + 100;
    
    let currentSection = null;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.id;
        }
    });
    
    if (currentSection && currentSection !== activeSection) {
        activeSection = currentSection;
        
        // Update TOC active state
        tocItems.forEach(item => {
            const targetId = item.getAttribute('data-target');
            if (targetId === currentSection) {
                item.classList.add('bg-teal-50', 'border-l-teal-500', 'text-teal-700', 'font-medium');
                item.classList.remove('border-l-transparent');
                
                // Scroll TOC item into view
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.classList.remove('bg-teal-50', 'border-l-teal-500', 'text-teal-700', 'font-medium');
                item.classList.add('border-l-transparent');
            }
        });
        
        // Update breadcrumb
        const sectionTitle = document.querySelector(`#${currentSection} h2`)?.textContent || 'Introduction';
        if (currentSectionEl) {
            currentSectionEl.textContent = sectionTitle;
        }
    }
}

// ===== Mobile Sidebar =====
function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.add('active');
    document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
}

// ===== Back to Top =====
function toggleBackToTop() {
    if (window.scrollY > 500) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
    } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100');
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Print Functionality =====
function printGuide() {
    window.print();
}

// ===== Event Listeners =====
// Search
searchInput.addEventListener('input', (e) => performSearch(e.target.value));
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearSearch();
});
searchClear.addEventListener('click', clearSearch);

// TOC clicks
tocItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        scrollToSection(targetId);
    });
});

// Mobile menu
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openSidebar);
}
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', closeSidebar);
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
}

// Scroll events
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateActiveSection();
            toggleBackToTop();
            ticking = false;
        });
        ticking = true;
    }
});

// Back to top
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', scrollToTop);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K for search focus
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to close sidebar
    if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebar();
    }
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    updateActiveSection();
    toggleBackToTop();
});
