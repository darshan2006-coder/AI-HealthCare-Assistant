document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

function initializeTheme() {
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    
    if (window.authUtils) {
        window.authUtils.showMessage(`Switched to ${newTheme} mode`, 'success');
    }
}

function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '☀️ Light Mode';
        }
    } else {
        body.classList.remove('dark-theme');
        if (themeToggle) {
            themeToggle.innerHTML = '🌙 Dark Mode';
        }
    }
}


function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}


if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}


window.themeUtils = {
    getCurrentTheme: () => document.body.classList.contains('dark-theme') ? 'dark' : 'light',
    setTheme: applyTheme,
    toggleTheme
};