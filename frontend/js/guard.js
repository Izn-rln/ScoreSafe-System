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
        if (res.ok) {
            const userData = await res.json();
            // Update localStorage with real role from DB
            if (userData.role && userData.role !== role) {
                localStorage.setItem('role', userData.role);
                // Redirect to correct dashboard
                window.location.href = userData.role === 'teacher' 
                    ? '/teacher/dashboard.html' 
                    : '/student/dashboard.html';
                return;
            }
        }
    } catch(e) {}

    if (path.includes('/teacher/') && localStorage.getItem('role') !== 'teacher') {
        alert("Access Denied!");
        window.location.href = '../student/dashboard.html';
    }

    if (path.includes('/student/') && localStorage.getItem('role') !== 'student') {
        window.location.href = '../teacher/dashboard.html';
    }
})();