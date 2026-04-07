(async function() {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const path = window.location.pathname;

    if (!username || !role) {
        window.location.href = path.includes('/teacher/') || path.includes('/student/') 
            ? '../index.html' : '/index.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile?username=${encodeURIComponent(username)}`);
    } catch(e) {}

    if (path.includes('/teacher/') && role !== 'teacher') {
        alert("Access Denied: Teachers only!");
        window.location.href = '../student/dashboard.html';
    }

    if (path.includes('/student/') && role !== 'student') {
        window.location.href = '../teacher/dashboard.html';
    }
})();

