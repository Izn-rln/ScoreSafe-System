(async function() {
    const role = sessionStorage.getItem('role') || localStorage.getItem('role');
    const username = sessionStorage.getItem('username') || localStorage.getItem('username');
    const path = window.location.pathname;

    const isTeacherPage = path.includes('/teacher/');
    const isStudentPage = path.includes('/student/');

    if (!username || !role) {
        window.location.href = isTeacherPage || isStudentPage
            ? '../index.html' : 'index.html';
        return;
    }

    // Sync to sessionStorage if only in localStorage
    if (!sessionStorage.getItem('role')) sessionStorage.setItem('role', role);
    if (!sessionStorage.getItem('username')) sessionStorage.setItem('username', username);

    if (typeof API_BASE_URL !== 'undefined') {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile?username=${encodeURIComponent(username)}`);
            if (res.ok) {
                const userData = await res.json();
                if (userData.role && userData.role !== role) {
                    sessionStorage.setItem('role', userData.role);
                    localStorage.setItem('role', userData.role);
                    window.location.href = userData.role === 'teacher'
                        ? '../teacher/dashboard.html'
                        : '../student/dashboard.html';
                    return;
                }
            }
        } catch(e) {}
    }

    if (isTeacherPage && role !== 'teacher') {
        alert('Access Denied!');
        window.location.href = '../student/dashboard.html';
        return;
    }

    if (isStudentPage && role !== 'student') {
        window.location.href = '../teacher/dashboard.html';
    }
})();