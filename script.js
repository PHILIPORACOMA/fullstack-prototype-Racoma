const STORAGE_KEY = 'fpt_demo_v1';

let db = {
    users: [],
    employees: [],
    departments: [],
    requests: []
};
let currentUser = null;

// Load Data on Startup
function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        db = JSON.parse(data);
    } else {
        // Phase 4: Seed defaults if missing
        db.users = [
            { 
                firstName: 'Admin', 
                lastName: 'User', 
                email: 'admin@example.com', 
                password: 'Password123!', 
                role: 'admin', 
                verified: true 
            }
        ];
        db.departments = [
            { id: 1, name: 'Engineering', description: 'Software devs' },
            { id: 2, name: 'HR', description: 'Human Resources' }
        ];
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Function: setAuthState(isAuth, user)
function setAuthState(isAuthenticated, user = null) {
    const body = document.body;
    const navName = document.getElementById('nav-display-name');
    
    if (isAuthenticated && user) {
        currentUser = user;
        localStorage.setItem('auth_token', user.email); 
        
        navName.textContent = user.role === 'admin' ? 'Admin' : user.firstName;
        
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        body.classList.toggle('is-admin', user.role === 'admin');
        
        // Phase 3.D: Toggles body.is-admin
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }

        // Update UI displays
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-role').textContent = user.role.toUpperCase();
        
        // Update Navbar Brand or Welcome Message if needed
        const brand = document.querySelector('.navbar-brand');
        brand.textContent = `Full-Stack App (${user.firstName} ${user.lastName})`;

    } else {
        currentUser = null;
        localStorage.removeItem('auth_token');
        
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated');
        body.classList.remove('is-admin');
        
        const brand = document.querySelector('.navbar-brand');
        brand.textContent = `Full-Stack App`;
    }
    
    handleRouting();
}

// Phase 3.E: Logout
function logout() {
    setAuthState(false);
    window.location.hash = '#home';
}

function checkSession() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = db.users.find(u => u.email === token);
        if (user) {
            setAuthState(true, user);
            return;
        }
    }
    setAuthState(false);
}

function handleRouting() {
    // 1. Read current hash
    let hash = window.location.hash || '#home';
    
    // 2. Route Guards
    const protectedRoutes = ['#profile', '#requests'];
    const adminRoutes = ['#employees', '#departments', '#accounts'];

    // Redirect unauthenticated users
    if ((protectedRoutes.includes(hash) || adminRoutes.includes(hash)) && !currentUser) {
        window.location.hash = '#login';
        return;
    }

    // Block non-admins from admin routes
    if (adminRoutes.includes(hash) && currentUser && currentUser.role !== 'admin') {
        window.location.hash = '#profile';
        return;
    }
    if (hash === '#login') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
    }

    // 3. UI Switching: Hide all, show matching
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    const targetPage = document.querySelector(hash);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        document.querySelector('#home').classList.add('active');
    }
}

/* Phase 3 */

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    checkSession();
    handleRouting();

    window.addEventListener('hashchange', handleRouting);

    // Phase 3.A: Registration 
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = document.getElementById('reg-fname').value;
            const lastName = document.getElementById('reg-lname').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            // Check if email already exists
            if (db.users.find(u => u.email === email)) {
                alert('Email already exists!');
                return;
            }

            // Save new account
            const newUser = { 
                firstName, 
                lastName, 
                email, 
                password, 
                role: 'user', 
                verified: false 
            };
            db.users.push(newUser);
            saveToStorage();

            // Store for verification screen
            localStorage.setItem('unverified_email', email);
            document.getElementById('verify-email-display').textContent = email;
            
            window.location.hash = '#verify-email';
        });
    }

    // Phase 3.C: Login Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const user = db.users.find(u => u.email === email && u.password === password);

            if (!user) {
                alert('Invalid email or password.');
                return;
            }

            if (!user.verified) {
                alert('Email not verified.');
                localStorage.setItem('unverified_email', email);
                window.location.hash = '#verify-email';
                return;
            }

            setAuthState(true, user);
            window.location.hash = '#profile';
        });
    }
});

/* Phase 3 B. */
function simulateEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    const user = db.users.find(u => u.email === email);
    
    if (user) {
        user.verified = true;
        saveToStorage();
        alert("Verification Successful! Redirecting to login...");
        localStorage.removeItem('unverified_email');
        window.location.hash = '#login';
    }
}