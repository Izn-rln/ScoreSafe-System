let cropper;
let avatarInput;
let imageToCrop;
let cropperModal;

window.onload = () => {
    avatarInput  = document.getElementById('studentAvatar');
    imageToCrop  = document.getElementById('imageToCrop');
    cropperModal = document.getElementById('cropperModal');

    renderStudentData();
    displayStudentProfile();
    setupCropper();

    document.getElementById('resetStudentProfile')?.addEventListener('click', () => {
        if (confirm('Discard all unsaved changes?')) {
            displayStudentProfile();
            if (avatarInput) avatarInput.value = '';
        }
    });
};

document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogoutModal();
    });
});

function showLogoutModal() {
    let modal = document.getElementById('logoutModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'logoutModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <h3><i class="fas fa-sign-out-alt" style="color:var(--accent-color);margin-right:8px;"></i>Sign Out</h3>
                <p>Are you sure you want to sign out?</p>
                <div class="modal-buttons">
                    <button class="btn outline btn-cancel" id="cancelLogout">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn btn-confirm" id="confirmLogout" style="background:var(--accent-color);">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('cancelLogout').addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('confirmLogout').addEventListener('click', () => {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '../index.html';
        });
    }
    modal.style.display = 'flex';
}

function getAuthToken() {
    return sessionStorage.getItem('firebaseToken') || localStorage.getItem('firebaseToken') || '';
}

function authHeaders(extra = {}) {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ── XSS escape ────────────────────────────────────────────────
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ── Scores table ──────────────────────────────────────────────
async function renderStudentData() {
    const email = sessionStorage.getItem('username');
    const tbody = document.querySelector('#studentScoresTable tbody') ||
                  document.querySelector('#myRecordsTable tbody');
    if (!tbody || !email) return;

    try {
        const res     = await fetch(`${API_BASE_URL}/api/scores/get-records?email=${encodeURIComponent(email)}`);
        const records = await res.json();
        const finalized = records.filter(r => r.is_finalized === 1);

        tbody.innerHTML = '';
        if (finalized.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8" style="text-align:center;padding:40px;color:#666;">
                        <i class="fas fa-info-circle" style="display:block;font-size:1.5rem;margin-bottom:10px;color:var(--primary-color);"></i>
                        No finalized records yet.<br>
                        <small>Grades appear here once confirmed by your instructor.</small>
                    </td>
                </tr>`;
            ['studentTotalScores','studentTotalSubjects','studentAverage'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = id === 'studentAverage' ? '0%' : '0';
            });
            return;
        }

        finalized.forEach(r => {
            const tr = document.createElement('tr');
            const badge = `<span class="badge" style="background:#e6f4ea;color:#1e7e34;padding:4px 8px;border-radius:4px;font-size:.75rem;font-weight:bold;border:1px solid #1e7e34;">
                <i class="fas fa-check-circle"></i> OFFICIAL</span>`;
            tr.innerHTML = `
                <td>${esc(r.subject_name) || 'General'}</td>
                <td><strong>${esc(r.score)}</strong></td>
                <td>${esc(r.total_items) || '-'}</td>
                <td>${r.paper_image_url
                    ? `<a href="${r.paper_image_url}" target="_blank" class="view-link">View Paper</a>`
                    : 'No Image'}</td>
                <td>${esc(r.category)}</td>
                <td>${esc(r.teacher_name) || 'Faculty Member'}</td>
                <td>${badge}</td>
                <td>${new Date(r.date_created).toLocaleDateString()}</td>`;
            tbody.appendChild(tr);
        });

        const uniqueSubs    = [...new Set(finalized.map(r => r.subject_name))];
        const totalEarned   = finalized.reduce((s, r) => s + Number(r.score), 0);
        const totalPossible = finalized.reduce((s, r) => s + Number(r.total_items || 0), 0);
        const average       = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0;

        if (document.getElementById('studentTotalScores'))   document.getElementById('studentTotalScores').innerText   = finalized.length;
        if (document.getElementById('studentTotalSubjects')) document.getElementById('studentTotalSubjects').innerText = uniqueSubs.length;
        if (document.getElementById('studentAverage'))       document.getElementById('studentAverage').innerText       = `${average}%`;

    } catch (e) { console.error('Data fetch failed:', e); }
}

// ── Profile ──────────────────────────────────────────────────
async function displayStudentProfile() {
    const email = sessionStorage.getItem('username');
    if (!email) return;

    try {
        const res  = await fetch(`${API_BASE_URL}/api/auth/profile?username=${encodeURIComponent(email)}`);
        const user = await res.json();

        if (res.ok) {
            setTimeout(() => {
                const nameField     = document.getElementById('studentFullName');
                const emailField    = document.getElementById('studentEmail');
                const bioField      = document.getElementById('studentBio');
                const avatarWrapper = document.getElementById('studentAvatarPreview');

                if (nameField)  nameField.value  = user.full_name || '';
                if (emailField) emailField.value = user.username  || '';
                if (bioField)   bioField.value   = user.bio       || '';

                if (avatarWrapper) {
                    if (user.profile_photo) {
                        const src = user.profile_photo.startsWith('http')
                            ? user.profile_photo.replace(/=s\d+-c/g, '=s0')
                            : `${API_BASE_URL}/uploads/${user.profile_photo}`;
                        avatarWrapper.innerHTML = `<img src="${src}" referrerpolicy="no-referrer"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
                    } else {
                        avatarWrapper.innerHTML = `<i class="fas fa-user-circle" style="font-size:8rem;color:#ccc;"></i>`;
                    }
                }
            }, 100);
        }
    } catch (err) { console.error('Profile load failed', err); }
}

// ── Cropper / photo upload ────────────────────────────────────
function setupCropper() {
    if (!avatarInput || !imageToCrop || !cropperModal) return;

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            imageToCrop.src = ev.target.result;
            cropperModal.style.display = 'flex';
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                aspectRatio : 1,
                viewMode    : 1,
                dragMode    : 'move',
                autoCropArea: 0.8
            });
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('cancelCrop')?.addEventListener('click', () => {
        cropperModal.style.display = 'none';
        if (cropper) { cropper.destroy(); cropper = null; }
        if (avatarInput) avatarInput.value = '';
    });

    // FIX: include Authorization header for photo upload
    document.getElementById('confirmCrop')?.addEventListener('click', () => {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('profile_photo', blob, 'avatar.jpg');

            const email = sessionStorage.getItem('username');
            if (!email) { alert('Session expired. Please sign in again.'); return; }
            formData.append('email', email);

            const token   = getAuthToken();
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            // NOTE: Do NOT set Content-Type — browser sets multipart boundary

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/profile/upload-photo`, {
                    method : 'POST',
                    headers,
                    body   : formData
                });

                if (res.ok) {
                    alert('Profile picture updated!');
                    cropperModal.style.display = 'none';
                    if (cropper) { cropper.destroy(); cropper = null; }
                    if (avatarInput) avatarInput.value = '';
                    displayStudentProfile();
                } else {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const errData = await res.json();
                        alert('Upload Error: ' + errData.error);
                    } else {
                        const text = await res.text();
                        console.error('Server error:', text);
                        alert('Server Error: Upload failed.');
                    }
                }
            } catch (err) {
                console.error('Upload error:', err);
                alert('Connection error to backend.');
            }
        }, 'image/jpeg', 0.9);
    });
}

// ── Profile form save ─────────────────────────────────────────
const studentProfileForm = document.getElementById('studentProfileForm');
if (studentProfileForm) {
    studentProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('studentFullName').value.trim();
        const bio      = document.getElementById('studentBio').value.trim();
        const email    = sessionStorage.getItem('username');

        if (!email) { alert('Session expired. Please sign in again.'); return; }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile/update`, {
                method : 'POST',
                headers: authHeaders(),            // ← token included
                body   : JSON.stringify({ fullName, bio, email })
            });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.setItem('fullName', fullName);
                alert('Profile saved!');
                displayStudentProfile();
            } else {
                alert('Error: ' + (data.error || 'Failed to save profile.'));
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Connection error. Please try again.');
        }
    });
}

// ── Filter ────────────────────────────────────────────────────
function applyFilter(tableId, type, value) {
    const table = document.querySelector(tableId);
    if (!table) return;
    table.querySelectorAll('tbody tr:not(.empty-row)').forEach(row => {
        if (type === 'reset' || value === 'all' || value === '') {
            row.style.display = ''; return;
        }
        const cell = row.children[4]?.innerText.trim().toLowerCase() || '';
        row.style.display = cell === value.toLowerCase() ? '' : 'none';
    });
    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));
}

// ── Search ────────────────────────────────────────────────────
document.getElementById('studentSearchInput')?.addEventListener('input', function () {
    const val     = this.value.toLowerCase();
    const tableId = this.getAttribute('data-table');
    document.querySelectorAll(`${tableId} tbody tr:not(.empty-row)`)
        .forEach(r => r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none');
});

document.getElementById('recordsSearch')?.addEventListener('input', function () {
    const val     = this.value.toLowerCase();
    const tableId = this.getAttribute('data-table');
    document.querySelectorAll(`${tableId} tbody tr:not(.empty-row)`)
        .forEach(r => r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none');
});

// ── Filter menu toggle ────────────────────────────────────────
document.addEventListener('click', (e) => {
    if (e.target.closest('.filter-btn')) {
        const menu = e.target.closest('.search-container')?.querySelector('.filter-menu');
        if (menu) menu.classList.toggle('active');
    } else {
        document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));
    }
});

// ── Mobile nav ────────────────────────────────────────────────
document.getElementById('hamburger')?.addEventListener('click', () => {
    document.querySelector('nav')?.classList.toggle('active');
});
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => document.querySelector('nav')?.classList.remove('active'));
});

window.applyFilter = applyFilter;