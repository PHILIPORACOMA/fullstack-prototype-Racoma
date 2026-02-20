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

        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-role').textContent = user.role.toUpperCase();

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

function renderRequests() {
    const tbody = document.getElementById('requests-table-body');
    const tableContainer = document.getElementById('requests-table-container');
    const emptyState = document.getElementById('requests-empty-state');
    
    if (!tbody) return;

    // Filtering for the current user
    const myRequests = db.requests.filter(r => r.employeeEmail === currentUser.email);

    if (myRequests.length === 0) {
        tableContainer.classList.add('d-none');
        emptyState.classList.remove('d-none');
    } else {
        tableContainer.classList.remove('d-none');
        emptyState.classList.add('d-none');

        tbody.innerHTML = '';
        myRequests.forEach(req => {
            const itemsList = req.items.map(i => `${i.qty}x ${i.name}`).join(', ');
            
            // Logic for status badge color
            let badgeClass = 'bg-warning text-dark';
            if (req.status === 'Approved') badgeClass = 'bg-success';

            tbody.innerHTML += `
                <tr>
                    <td>${req.date}</td>
                    <td>${req.employeeEmail}</td>
                    <td><span class="badge bg-info text-dark">${req.type}</span></td>
                    <td>${itemsList}</td>
                    <td><span class="badge ${badgeClass}">${req.status}</span></td>
                    <td>
                        ${req.status === 'Pending' ? `
                            <button class="btn btn-sm btn-success me-2" onclick="approveRequest(${req.id})">Approve</button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteRequest(${req.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    }
}

function approveRequest(id) {
    const req = db.requests.find(r => r.id === id);
    if (req) {
        req.status = 'Approved';
        saveToStorage();
        renderRequests();
        showToast('Request Approved');
    }
}
// Logout
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
    let hash = window.location.hash || '#home';

    const protectedRoutes = ['#profile', '#requests'];
    const adminRoutes = ['#employees', '#departments', '#accounts'];

    if ((protectedRoutes.includes(hash) || adminRoutes.includes(hash)) && !currentUser) {
        window.location.hash = '#login';
        return;
    }

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

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    const targetPage = document.querySelector(hash);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        document.querySelector('#home').classList.add('active');
    }

    if (hash === '#requests') {
        renderRequests(); 
    }
    if (hash === '#accounts') {
        renderAccountsList();
    }
    if (hash === '#employees') {
        renderEmployeesTable();
    }
    if (hash === '#departments') {
        renderDepartmentsTable();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    checkSession();
    handleRouting();

    window.addEventListener('hashchange', handleRouting);

    // Registration 
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

    // Login Submit
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

// email simulation
function prepareVerifyModal() {
    // Modal is already set up, just show it
}

function confirmEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    const user = db.users.find(u => u.email === email);
    
    if (user) {
        user.verified = true;
        saveToStorage();
        showToast('Email Verified Successfully!');
        localStorage.removeItem('unverified_email');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('verifyEmailModal'));
        if (modal) modal.hide();
        
        // Redirect to login after short delay
        setTimeout(() => {
            window.location.hash = '#login';
        }, 1000);
    }
}

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

// UTILITY: TOASTS 
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    document.getElementById('toast-message').textContent = message;
    document.getElementById('toast-header').className = `toast-header text-white ${type === 'success' ? 'bg-success' : 'bg-danger'}`;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// Variable to track editing state
let currentEditingEmail = null;

function renderAccountsList() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    db.users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.firstName} ${u.lastName}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${u.role}</span></td>
                <td>${u.verified ? '✅' : '❌'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="prepareEditAccount('${u.email}')" data-bs-toggle="modal" data-bs-target="#accountModal">Edit</button>
                    <button class="btn btn-sm btn-warning" onclick="prepareResetPassword('${u.email}')" data-bs-toggle="modal" data-bs-target="#resetPasswordModal">Reset Password</button>
                    <button class="btn btn-sm btn-danger" onclick="prepareDeleteAccount('${u.email}')" data-bs-toggle="modal" data-bs-target="#deleteAccountModal">Delete</button>
                </td>
            </tr>`;
    });
}

function prepareAddAccount() {
    currentEditingEmail = null;
    document.getElementById('account-form').reset();
    document.getElementById('acc-email').disabled = false;
}

function prepareEditAccount(email) {
    const user = db.users.find(u => u.email === email);
    if (!user) return;
    
    currentEditingEmail = email;
    
    document.getElementById('acc-fname').value = user.firstName;
    document.getElementById('acc-lname').value = user.lastName;
    document.getElementById('acc-email').value = user.email;
    document.getElementById('acc-email').disabled = true;
    document.getElementById('acc-pass').value = '';
    document.getElementById('acc-role').value = user.role;
    document.getElementById('acc-verified').checked = user.verified;
}

function handleAccountSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('acc-fname').value;
    const lastName = document.getElementById('acc-lname').value;
    const emailInput = document.getElementById('acc-email').value;
    const passwordInput = document.getElementById('acc-pass').value;
    const role = document.getElementById('acc-role').value;
    const verified = document.getElementById('acc-verified').checked;

    if (currentEditingEmail) {
        // Edit existing account
        const user = db.users.find(u => u.email === currentEditingEmail);
        if (user) {
            user.firstName = firstName;
            user.lastName = lastName;
            user.role = role;
            user.verified = verified;
            if (passwordInput) user.password = passwordInput;
            showToast('Account Updated');
        }
    } else {
        // Add new account
        const existingUser = db.users.find(u => u.email === emailInput);
        if (existingUser) {
            alert('Email already exists!');
            return;
        }

        const newUser = {
            firstName,
            lastName,
            email: emailInput,
            password: passwordInput || '123456',
            role,
            verified
        };
        db.users.push(newUser);
        showToast('Account Created');
    }

    saveToStorage();
    renderAccountsList();
    
    // Close Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
    if (modal) modal.hide();
}

let currentResetEmail = null;
let currentDeleteEmail = null;

function prepareResetPassword(email) {
    currentResetEmail = email;
    document.getElementById('reset-email-display').value = email;
    document.getElementById('reset-new-password').value = '';
}

function confirmResetPassword(e) {
    e.preventDefault();
    
    if (!currentResetEmail) return;
    
    const user = db.users.find(u => u.email === currentResetEmail);
    if (!user) return;
    
    const newPassword = document.getElementById('reset-new-password').value;
    
    if (newPassword.trim().length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }
    
    user.password = newPassword;
    saveToStorage();
    showToast('Password Reset Successfully');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
    if (modal) modal.hide();
}

function prepareDeleteAccount(email) {
    currentDeleteEmail = email;
    document.getElementById('delete-email-display').textContent = email;
}

function confirmDeleteAccount() {
    if (!currentDeleteEmail) return;
    
    db.users = db.users.filter(u => u.email !== currentDeleteEmail);
    saveToStorage();
    renderAccountsList();
    showToast('Account Deleted');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
    if (modal) modal.hide();
}

function addRequestItemRow() {
    const container = document.getElementById('req-items-container');
    const div = document.createElement('div');
    div.className = 'input-group mb-2 req-item-row';
    div.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item Name" required>
        <input type="number" class="form-control item-qty" placeholder="Qty" style="max-width: 80px;" min="1" required>
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function prepareNewRequest() {
    document.getElementById('request-form').reset();
    document.getElementById('req-items-container').innerHTML = ''; // Clear previous items
    addRequestItemRow(); // Add one empty row to start
}

// Function to handle saving a new request
document.getElementById('request-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect item rows from the modal
    const itemRows = document.querySelectorAll('.req-item-row');
    const items = Array.from(itemRows).map(row => ({
        name: row.querySelector('.item-name').value,
        qty: row.querySelector('.item-qty').value
    }));

    if (items.length === 0) {
        alert("Please add at least one item.");
        return;
    }

    // Strictly saving: type, items[], status: "Pending", date, employeeEmail
    const newRequest = {
        id: Date.now(), // Unique ID for deletion logic
        type: document.getElementById('req-type').value,
        items: items,
        status: "Pending", // Always starts as Pending
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    db.requests.push(newRequest);
    saveToStorage();
    renderRequests(); 
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    modal.hide();
});

function deleteRequest(id) {
    if (confirm("Cancel this request?")) {
        db.requests = db.requests.filter(r => r.id !== id);
        saveToStorage();
        renderRequests();
    }
}

// EMPLOYEES LOGIC

let currentEditingEmployeeId = null;

function prepareEmployeeModal() {
    currentEditingEmployeeId = null;
    document.getElementById('employee-form').reset();
    document.getElementById('emp-id').disabled = false;
    
    // Fill User Email dropdown
    const userSelect = document.getElementById('emp-user-select');
    if (userSelect) {
        userSelect.innerHTML = db.users.map(u => `<option value="${u.email}">${u.email}</option>`).join('');
    }
    
    // Fill Department dropdown
    const deptSelect = document.getElementById('emp-dept-select');
    if (deptSelect) {
        deptSelect.innerHTML = db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }
}

function prepareEditEmployee(id) {
    const emp = db.employees.find(e => e.id === id);
    if (!emp) return;
    
    currentEditingEmployeeId = id;
    
    // Fill User Email dropdown
    const userSelect = document.getElementById('emp-user-select');
    if (userSelect) {
        userSelect.innerHTML = db.users.map(u => `<option value="${u.email}" ${u.email === emp.email ? 'selected' : ''}>${u.email}</option>`).join('');
    }
    
    // Fill Department dropdown
    const deptSelect = document.getElementById('emp-dept-select');
    if (deptSelect) {
        deptSelect.innerHTML = db.departments.map(d => `<option value="${d.name}" ${d.name === emp.dept ? 'selected' : ''}>${d.name}</option>`).join('');
    }
    
    // Populate form fields
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-id').disabled = true;
    document.getElementById('emp-user-select').value = emp.email;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-dept-select').value = emp.dept;
    document.getElementById('emp-date').value = emp.hireDate;
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeData = {
        id: document.getElementById('emp-id').value,
        email: document.getElementById('emp-user-select').value,
        position: document.getElementById('emp-position').value,
        dept: document.getElementById('emp-dept-select').value,
        hireDate: document.getElementById('emp-date').value
    };

    if (currentEditingEmployeeId) {
        // Editing existing employee
        const index = db.employees.findIndex(emp => emp.id === currentEditingEmployeeId);
        if (index !== -1) {
            db.employees[index] = employeeData;
            showToast('Employee Updated');
        }
    } else {
        // Adding new employee
        if (db.employees.find(emp => emp.id === employeeData.id)) {
            alert("Employee ID already exists!");
            return;
        }
        db.employees.push(employeeData);
        showToast('Employee Created');
    }

    saveToStorage();
    renderEmployeesTable();
    
    // Close Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
    if (modal) modal.hide();
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    db.employees.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${emp.dept}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="prepareEditEmployee('${emp.id}')" data-bs-toggle="modal" data-bs-target="#employeeModal">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="prepareDeleteEmployee('${emp.id}')" data-bs-toggle="modal" data-bs-target="#deleteEmployeeModal">Delete</button>
                </td>
            </tr>
        `;
    });
}

let currentDeleteEmployeeId = null;

function prepareDeleteEmployee(id) {
    currentDeleteEmployeeId = id;
    const emp = db.employees.find(e => e.id === id);
    if (emp) {
        document.getElementById('delete-employee-display').textContent = `${emp.id} (${emp.email})`;
    }
}

function confirmDeleteEmployee() {
    if (!currentDeleteEmployeeId) return;
    
    db.employees = db.employees.filter(emp => emp.id !== currentDeleteEmployeeId);
    saveToStorage();
    renderEmployeesTable();
    showToast('Employee Deleted');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteEmployeeModal'));
    if (modal) modal.hide();
}

function deleteEmployee(id) {
    if(confirm("Confirm deletion?")) {
        db.employees = db.employees.filter(emp => emp.id !== id);
        saveToStorage();
        renderEmployeesTable();
    }
}

function renderDepartmentsTable() {
    const tbody = document.getElementById('dept-table');
    if (!tbody) return;

    tbody.innerHTML = '';
    db.departments.forEach(dept => {
        tbody.innerHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}   

function editDepartment(id) {
    const dept = db.departments.find(d => d.id === id);
    // For now, using a simple prompt to follow Phase 6 instructions
    const newName = prompt("Enter new department name:", dept.name);
    if (newName) {
        dept.name = newName;
        saveToStorage();
        renderDepartmentsTable();
    }
}

function deleteDepartment(id) {
    if (confirm("Are you sure you want to delete this department?")) {
        db.departments = db.departments.filter(d => d.id !== id);
        saveToStorage();
        renderDepartmentsTable();
    }
}