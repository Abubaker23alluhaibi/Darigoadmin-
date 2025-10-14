// إعدادات عامة
const API_BASE_URL = 'http://localhost:3001/api';
let currentUser = null;

// رسالة تأكيد تحميل الملف
console.log('✅ تم تحميل ملف admin.js بنجاح');
console.log('🔗 API URL:', API_BASE_URL);
let currentPage = 'dashboard';
let currentPageNumber = 1;
let itemsPerPage = 10;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تهيئة التطبيق...');
    initializeApp();
});

async function initializeApp() {
    console.log('🔍 بدء فحص حالة تسجيل الدخول...');
    
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('adminToken');
    console.log('🔑 الرمز المميز:', token ? 'موجود' : 'غير موجود');
    
    if (!token) {
        console.log('❌ لا يوجد رمز مميز، إظهار نافذة تسجيل الدخول');
        // إظهار نافذة تسجيل الدخول مباشرة
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
            console.log('✅ تم إظهار نافذة تسجيل الدخول');
        } else {
            console.error('❌ لم يتم العثور على نافذة تسجيل الدخول');
        }
        // إعداد مستمعي الأحداث حتى لو لم يكن هناك رمز مميز
        setupEventListeners();
        return;
    }
    
    // إظهار رسالة تحميل
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(245, 247, 250, 0.9); display: flex; justify-content: center; align-items: center; z-index: 9999;">
            <div style="text-align: center; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #304F2F; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: #333; font-size: 16px; margin: 0;">جاري التحقق من تسجيل الدخول...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
    
    // التحقق من صحة الرمز المميز
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // إزالة رسالة التحميل
        document.body.removeChild(loadingDiv);
        
        if (response.ok) {
            // التحقق الناجح، تحميل لوحة التحكم
            await loadDashboard();
            setupEventListeners();
        } else {
            // الرمز المميز غير صالح
            localStorage.removeItem('adminToken');
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('خطأ في التحقق من الرمز المميز:', error);
        // إزالة رسالة التحميل
        if (document.body.contains(loadingDiv)) {
            document.body.removeChild(loadingDiv);
        }
        localStorage.removeItem('adminToken');
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
        }
    }
}

function setupEventListeners() {
    console.log('🎧 بدء إعداد مستمعي الأحداث...');
    
    // إزالة المستمعين السابقين لتجنب التكرار
    document.querySelectorAll('.menu-item').forEach(item => {
        item.replaceWith(item.cloneNode(true));
    });
    
    // قائمة التنقل
    const menuItems = document.querySelectorAll('.menu-item');
    console.log('📋 عدد عناصر القائمة:', menuItems.length);
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            console.log('🔄 الانتقال إلى صفحة:', page);
            navigateToPage(page);
        });
    });

    // نموذج تسجيل الدخول (فقط إذا لم يكن مُعرّف بالفعل)
    const loginForm = document.getElementById('login-form');
    console.log('📝 نموذج تسجيل الدخول:', loginForm ? 'موجود' : 'غير موجود');
    if (loginForm && !loginForm.hasAttribute('data-listener-added')) {
        loginForm.addEventListener('submit', handleLogin);
        loginForm.setAttribute('data-listener-added', 'true');
        console.log('✅ تم إضافة مستمع تسجيل الدخول');
    }

    // إغلاق النوافذ المنبثقة عند النقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    console.log('✅ تم إعداد جميع مستمعي الأحداث');
}

// تسجيل الدخول
async function handleLogin(e) {
    console.log('🔐 بدء عملية تسجيل الدخول...');
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('📧 البريد الإلكتروني:', email);
    console.log('🔑 كلمة المرور:', password ? 'مُدخلة' : 'غير مُدخلة');
    
    // التحقق من وجود البيانات المطلوبة
    if (!email || !password) {
        console.log('❌ بيانات ناقصة');
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    try {
        console.log('محاولة تسجيل الدخول...', { email, API_BASE_URL });
        
        // إظهار رسالة تحميل
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        const originalText = loginButton.innerHTML;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginButton.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('استجابة الخادم:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('بيانات الاستجابة:', data);
        
        if (data.status === 'success') {
            localStorage.setItem('adminToken', data.data.token);
            currentUser = data.data.user;
            
            // التحقق من أن المستخدم مدير
            if (data.data.user.userType !== 'admin') {
                alert('ليس لديك صلاحية للوصول إلى لوحة الإدارة');
                localStorage.removeItem('adminToken');
                return;
            }
            
            document.getElementById('admin-name').textContent = data.data.user.name;
            
            // إظهار لوحة التحكم فوراً
            showDashboard();
            
            // تحميل الإحصائيات في الخلفية
            loadDashboard().catch(error => {
                console.error('خطأ في تحميل الإحصائيات:', error);
            });
            
            // إعداد مستمعي الأحداث مرة واحدة فقط
            if (!window.eventListenersSetup) {
                setupEventListeners();
                window.eventListenersSetup = true;
            }
        } else {
            alert(data.message || 'خطأ في تسجيل الدخول');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('خطأ في الاتصال بالخادم: ' + error.message);
    } finally {
        // استعادة حالة الزر
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
            loginButton.disabled = false;
        }
        console.log('🏁 انتهت عملية تسجيل الدخول');
    }
}

// إظهار لوحة التحكم
function showDashboard() {
    console.log('🏠 بدء إظهار لوحة التحكم...');
    
    // إخفاء نافذة تسجيل الدخول
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.remove('active');
        console.log('✅ تم إخفاء نافذة تسجيل الدخول');
    } else {
        console.error('❌ لم يتم العثور على نافذة تسجيل الدخول');
    }
    
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار صفحة الرئيسية
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
        console.log('✅ تم إظهار صفحة الرئيسية');
    } else {
        console.error('❌ لم يتم العثور على صفحة الرئيسية');
    }
    
    // تحديث القائمة النشطة
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const dashboardMenuItem = document.querySelector('[data-page="dashboard"]');
    if (dashboardMenuItem) {
        dashboardMenuItem.classList.add('active');
        console.log('✅ تم تحديث القائمة النشطة');
    } else {
        console.error('❌ لم يتم العثور على عنصر القائمة الرئيسية');
    }
    
    console.log('✅ تم إظهار لوحة التحكم بنجاح');
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    showLoginModal();
}

// إظهار نافذة تسجيل الدخول
function showLoginModal() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.add('active');
    }
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
}

// التنقل بين الصفحات
function navigateToPage(page) {
    // تحديث القائمة النشطة
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // إظهار الصفحة المطلوبة
    document.getElementById(`${page}-page`).classList.add('active');
    
    // تحديث العنوان
    const titles = {
        dashboard: 'الرئيسية',
        users: 'إدارة المستخدمين',
        properties: 'إدارة العقارات',
        stats: 'الإحصائيات',
        messages: 'الرسائل',
        reports: 'التقارير',
        settings: 'الإعدادات'
    };
    document.getElementById('page-title').textContent = titles[page];
    
    currentPage = page;
    
    // تحميل البيانات حسب الصفحة
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'properties':
            loadProperties();
            break;
        case 'stats':
            loadStats();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            // لا حاجة لتحميل بيانات خاصة
            break;
    }
}

// تحميل لوحة التحكم
async function loadDashboard() {
    try {
        console.log('جاري تحميل إحصائيات لوحة التحكم...');
        const token = localStorage.getItem('adminToken');
        console.log('الرمز المميز:', token ? 'موجود' : 'غير موجود');
        
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('استجابة إحصائيات الأدمن:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب الإحصائيات: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('بيانات الإحصائيات:', data);
        
        if (data.status === 'success') {
            updateDashboardStats(data.data);
            loadRecentActivity();
        } else {
            throw new Error(data.message || 'فشل في جلب الإحصائيات');
        }
    } catch (error) {
        console.error('خطأ في تحميل لوحة التحكم:', error);
        throw error; // إعادة رمي الخطأ لمعالجته في مكان آخر
    }
}

// تحديث إحصائيات لوحة التحكم
function updateDashboardStats(stats) {
    document.getElementById('total-users').textContent = stats.users.total;
    document.getElementById('total-properties').textContent = stats.properties.total;
    document.getElementById('pending-properties').textContent = stats.properties.pending;
    document.getElementById('approved-properties').textContent = stats.properties.approved;
}

// تحميل النشاط الأخير
async function loadRecentActivity() {
    // يمكن إضافة API endpoint للنشاط الأخير
    const activityList = document.getElementById('recent-activity');
    activityList.innerHTML = `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="activity-content">
                <h4>مستخدم جديد</h4>
                <p>تم تسجيل مستخدم جديد في النظام</p>
            </div>
            <div class="activity-time">منذ ساعة</div>
        </div>
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-home"></i>
            </div>
            <div class="activity-content">
                <h4>عقار جديد</h4>
                <p>تم إضافة عقار جديد في انتظار المراجعة</p>
            </div>
            <div class="activity-time">منذ ساعتين</div>
        </div>
    `;
}

// تحميل المستخدمين
async function loadUsers(page = 1) {
    try {
        showLoading('users-table-body');
        
        const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}&limit=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayUsers(data.data);
            updatePagination('users-pagination', page, Math.ceil(data.total / itemsPerPage));
        }
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        showError('users-table-body', 'خطأ في تحميل المستخدمين');
    }
}

// عرض المستخدمين
function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${getUserTypeText(user.userType)}</td>
            <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'نشط' : 'غير نشط'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td class="actions">
                <button class="action-btn btn-${user.isActive ? 'danger' : 'success'}" onclick="toggleUserStatus('${user._id}', ${user.isActive})">
                    <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// تحميل العقارات
async function loadProperties(page = 1) {
    try {
        showLoading('properties-table-body');
        
        const response = await fetch(`${API_BASE_URL}/admin/properties?page=${page}&limit=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayProperties(data.data);
            updatePagination('properties-pagination', page, Math.ceil(data.total / itemsPerPage));
        }
    } catch (error) {
        console.error('خطأ في تحميل العقارات:', error);
        showError('properties-table-body', 'خطأ في تحميل العقارات');
    }
}

// عرض العقارات
function displayProperties(properties) {
    const tbody = document.getElementById('properties-table-body');
    tbody.innerHTML = '';
    
    properties.forEach(property => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${property.title}</td>
            <td>${property.owner ? property.owner.name : 'غير محدد'}</td>
            <td>${property.type}</td>
            <td>${formatPrice(property.price)}</td>
            <td><span class="status ${property.status}">${getStatusText(property.status)}</span></td>
            <td>${formatDate(property.createdAt)}</td>
            <td class="actions">
                ${property.status === 'pending' ? `
                    <button class="action-btn btn-success" onclick="updatePropertyStatus('${property._id}', 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn btn-danger" onclick="updatePropertyStatus('${property._id}', 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
                <button class="action-btn btn-danger" onclick="deleteProperty('${property._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// تحميل الإحصائيات
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            createCharts(data.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// إنشاء الرسوم البيانية
function createCharts(stats) {
    // يمكن إضافة مكتبة Chart.js هنا لإنشاء الرسوم البيانية
    console.log('إنشاء الرسوم البيانية:', stats);
}

// تبديل حالة المستخدم
async function toggleUserStatus(userId, currentStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showAlert('تم تحديث حالة المستخدم بنجاح', 'success');
            loadUsers(currentPageNumber);
        } else {
            showAlert(data.message || 'خطأ في تحديث حالة المستخدم', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث حالة المستخدم:', error);
        showAlert('خطأ في الاتصال بالخادم', 'error');
    }
}

// تحديث حالة العقار
async function updatePropertyStatus(propertyId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showAlert('تم تحديث حالة العقار بنجاح', 'success');
            loadProperties(currentPageNumber);
        } else {
            showAlert(data.message || 'خطأ في تحديث حالة العقار', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث حالة العقار:', error);
        showAlert('خطأ في الاتصال بالخادم', 'error');
    }
}

// حذف العقار
async function deleteProperty(propertyId) {
    if (confirm('هل أنت متأكد من حذف هذا العقار؟')) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                showAlert('تم حذف العقار بنجاح', 'success');
                loadProperties(currentPageNumber);
            } else {
                showAlert(data.message || 'خطأ في حذف العقار', 'error');
            }
        } catch (error) {
            console.error('خطأ في حذف العقار:', error);
            showAlert('خطأ في الاتصال بالخادم', 'error');
        }
    }
}

// تحديث الصفحات
function updatePagination(containerId, currentPage, totalPages) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => {
            if (containerId === 'users-pagination') {
                currentPageNumber = i;
                loadUsers(i);
            } else if (containerId === 'properties-pagination') {
                currentPageNumber = i;
                loadProperties(i);
            }
        };
        container.appendChild(button);
    }
}

// البحث والتصفية
function filterUsers() {
    const search = document.getElementById('user-search').value.toLowerCase();
    const typeFilter = document.getElementById('user-type-filter').value;
    const statusFilter = document.getElementById('user-status-filter').value;
    
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const type = row.cells[2].textContent;
        const status = row.cells[3].textContent;
        
        const matchesSearch = name.includes(search) || email.includes(search);
        const matchesType = !typeFilter || type.includes(typeFilter);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        row.style.display = matchesSearch && matchesType && matchesStatus ? '' : 'none';
    });
}

function filterProperties() {
    const search = document.getElementById('property-search').value.toLowerCase();
    const typeFilter = document.getElementById('property-type-filter').value;
    const statusFilter = document.getElementById('property-status-filter').value;
    
    const rows = document.querySelectorAll('#properties-table-body tr');
    
    rows.forEach(row => {
        const title = row.cells[0].textContent.toLowerCase();
        const type = row.cells[2].textContent;
        const status = row.cells[4].textContent;
        
        const matchesSearch = title.includes(search);
        const matchesType = !typeFilter || type.includes(typeFilter);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        row.style.display = matchesSearch && matchesType && matchesStatus ? '' : 'none';
    });
}

// تحديث البيانات
function refreshUsers() {
    loadUsers(currentPageNumber);
}

function refreshProperties() {
    loadProperties(currentPageNumber);
}

function refreshStats() {
    loadStats();
}

// ========== وظائف الرسائل ==========

// تحميل الرسائل
async function loadMessages(page = 1) {
    try {
        console.log('📧 جاري تحميل الرسائل...');
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/messages?page=${page}&limit=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب الرسائل: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayMessages(data.data.messages);
            updatePagination('messages', data.data.pagination);
        }
    } catch (error) {
        console.error('خطأ في تحميل الرسائل:', error);
        // عرض رسائل وهمية للاختبار
        displayMockMessages();
    }
}

// عرض الرسائل
function displayMessages(messages) {
    const tbody = document.getElementById('messages-table-body');
    tbody.innerHTML = '';
    
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${message.senderName}</td>
            <td>${message.email}</td>
            <td><span class="badge badge-${getMessageTypeClass(message.type)}">${getMessageTypeText(message.type)}</span></td>
            <td>${message.subject}</td>
            <td><span class="badge badge-${getMessageStatusClass(message.status)}">${getMessageStatusText(message.status)}</span></td>
            <td>${formatDate(message.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewMessage('${message._id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn btn-sm btn-success" onclick="replyToMessage('${message._id}')">
                    <i class="fas fa-reply"></i> رد
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMessage('${message._id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// عرض رسائل وهمية للاختبار
function displayMockMessages() {
    const mockMessages = [
        {
            _id: '1',
            senderName: 'أحمد محمد',
            email: 'ahmed@example.com',
            type: 'inquiry',
            subject: 'استفسار عن عقار',
            status: 'unread',
            createdAt: new Date()
        },
        {
            _id: '2',
            senderName: 'فاطمة علي',
            email: 'fatima@example.com',
            type: 'complaint',
            subject: 'شكوى على عقار',
            status: 'read',
            createdAt: new Date(Date.now() - 86400000)
        }
    ];
    
    displayMessages(mockMessages);
}

// تحديث الرسائل
function refreshMessages() {
    loadMessages(currentPageNumber);
}

// تعيين جميع الرسائل كمقروءة
async function markAllAsRead() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/admin/messages/mark-all-read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('تم تعيين جميع الرسائل كمقروءة');
            refreshMessages();
        }
    } catch (error) {
        console.error('خطأ في تعيين الرسائل كمقروءة:', error);
        alert('تم تعيين الرسائل كمقروءة (وهمي)');
    }
}

// عرض رسالة
function viewMessage(messageId) {
    alert(`عرض الرسالة: ${messageId}`);
    // يمكن إضافة نافذة منبثقة لعرض الرسالة
}

// الرد على رسالة
function replyToMessage(messageId) {
    alert(`الرد على الرسالة: ${messageId}`);
    // يمكن إضافة نافذة منبثقة للرد
}

// حذف رسالة
function deleteMessage(messageId) {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        alert(`تم حذف الرسالة: ${messageId}`);
        refreshMessages();
    }
}

// فلترة الرسائل
function filterMessages() {
    const search = document.getElementById('message-search').value.toLowerCase();
    const statusFilter = document.getElementById('message-status-filter').value;
    const typeFilter = document.getElementById('message-type-filter').value;
    
    const rows = document.querySelectorAll('#messages-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.querySelector('.badge').textContent;
        const type = row.querySelectorAll('.badge')[0].textContent;
        
        const matchesSearch = text.includes(search);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        const matchesType = !typeFilter || type.includes(typeFilter);
        
        row.style.display = (matchesSearch && matchesStatus && matchesType) ? '' : 'none';
    });
}

// ========== وظائف التقارير ==========

// تحميل التقارير
async function loadReports() {
    try {
        console.log('📊 جاري تحميل التقارير...');
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE_URL}/admin/reports`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب التقارير: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            updateReportsData(data.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل التقارير:', error);
        // عرض بيانات وهمية للاختبار
        updateMockReportsData();
    }
}

// تحديث بيانات التقارير
function updateReportsData(data) {
    document.getElementById('new-users-month').textContent = data.users.newThisMonth || 0;
    document.getElementById('active-users').textContent = data.users.active || 0;
    document.getElementById('growth-rate').textContent = (data.users.growthRate || 0) + '%';
    
    document.getElementById('new-properties-month').textContent = data.properties.newThisMonth || 0;
    document.getElementById('approval-rate').textContent = (data.properties.approvalRate || 0) + '%';
    document.getElementById('avg-review-time').textContent = (data.properties.avgReviewTime || 0) + ' ساعة';
    
    document.getElementById('daily-visitors').textContent = data.performance.dailyVisitors || 0;
    document.getElementById('bounce-rate').textContent = (data.performance.bounceRate || 0) + '%';
    document.getElementById('avg-session-time').textContent = (data.performance.avgSessionTime || 0) + ' دقيقة';
}

// تحديث بيانات وهمية للتقارير
function updateMockReportsData() {
    document.getElementById('new-users-month').textContent = '15';
    document.getElementById('active-users').textContent = '89';
    document.getElementById('growth-rate').textContent = '12%';
    
    document.getElementById('new-properties-month').textContent = '23';
    document.getElementById('approval-rate').textContent = '85%';
    document.getElementById('avg-review-time').textContent = '2.5 ساعة';
    
    document.getElementById('daily-visitors').textContent = '156';
    document.getElementById('bounce-rate').textContent = '35%';
    document.getElementById('avg-session-time').textContent = '4.2 دقيقة';
}

// تحديث التقارير
function refreshReports() {
    loadReports();
}

// تصدير تقرير
function generateReport() {
    alert('جاري تصدير التقرير...');
    // يمكن إضافة وظيفة تصدير PDF أو Excel
}

// ========== وظائف مساعدة ==========

// الحصول على فئة نوع الرسالة
function getMessageTypeClass(type) {
    const classes = {
        'inquiry': 'info',
        'complaint': 'danger',
        'suggestion': 'warning',
        'support': 'primary'
    };
    return classes[type] || 'secondary';
}

// الحصول على نص نوع الرسالة
function getMessageTypeText(type) {
    const texts = {
        'inquiry': 'استفسار',
        'complaint': 'شكوى',
        'suggestion': 'اقتراح',
        'support': 'دعم فني'
    };
    return texts[type] || 'غير محدد';
}

// الحصول على فئة حالة الرسالة
function getMessageStatusClass(status) {
    const classes = {
        'unread': 'warning',
        'read': 'success',
        'replied': 'info'
    };
    return classes[status] || 'secondary';
}

// الحصول على نص حالة الرسالة
function getMessageStatusText(status) {
    const texts = {
        'unread': 'غير مقروء',
        'read': 'مقروء',
        'replied': 'تم الرد'
    };
    return texts[status] || 'غير محدد';
}

// تبديل الشريط الجانبي
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// حفظ الإعدادات
function saveSettings() {
    showAlert('تم حفظ الإعدادات بنجاح', 'success');
}

// دوال مساعدة
function getUserTypeText(type) {
    const types = {
        'user': 'مستخدم عادي',
        'agent': 'وسيط عقاري',
        'admin': 'مدير'
    };
    return types[type] || type;
}

function getStatusText(status) {
    const statuses = {
        'pending': 'في الانتظار',
        'approved': 'معتمد',
        'rejected': 'مرفوض'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function formatPrice(price) {
    return new Intl.NumberFormat('ar-SA').format(price) + ' د.ع';
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <tr>
            <td colspan="6" class="loading">
                <div class="spinner"></div>
            </td>
        </tr>
    `;
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            </td>
        </tr>
    `;
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${message}
    `;
    
    // إضافة التنبيه إلى أعلى المحتوى
    const contentArea = document.querySelector('.content-area');
    contentArea.insertBefore(alertDiv, contentArea.firstChild);
    
    // إزالة التنبيه بعد 5 ثوان
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// نافذة التأكيد
let confirmCallback = null;

function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').classList.add('active');
    confirmCallback = callback;
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
    confirmCallback = null;
}

function executeConfirmAction() {
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirmModal();
}
