/* ═══════════════════════════════════════════
   Admin Panel — Full CRUD for Cars
   ═══════════════════════════════════════════ */

import {
    supabaseGet, supabaseGetWithCount,
    supabaseInsert, supabaseUpdate, supabaseDelete,
    supabaseUpload, supabaseStorageDelete, supabasePublicUrl,
    SUPABASE_URL, SUPABASE_ANON_KEY
} from '../supabase.js';

/* ──── Config ──── */
const ADMIN_PASSWORD = 'mtechnics2024';
const BUCKET = 'car-images';

/* ──── State ──── */
let allBrands = [];
let allModels = [];
let pendingPhotos = [];     // { file, preview, isMain }
let existingPhotos = [];    // URLs from DB  
let mainPhotoIndex = 0;
let editingCarId = null;
let deleteCarId = null;
let searchTimeout = null;

/* ══════════════════════════════════════
   AUTH
   ══════════════════════════════════════ */
function checkAuth() {
    const stored = localStorage.getItem('mtechnics_admin');
    if (stored === ADMIN_PASSWORD) {
        showPanel();
    }
}

document.getElementById('authForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('authPassword').value;
    if (pwd === ADMIN_PASSWORD) {
        localStorage.setItem('mtechnics_admin', pwd);
        showPanel();
    } else {
        document.getElementById('authError').style.display = 'block';
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('mtechnics_admin');
    location.reload();
});

function showPanel() {
    document.getElementById('adminAuth').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    initAdmin();
}

/* ══════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════ */
async function initAdmin() {
    if (window.lucide) lucide.createIcons();

    await loadBrands();
    loadDashboard();
    loadCarsList();
    initNavigation();
    initForm();
    initDropzone();
    initDeleteModal();
    initMobileSidebar();
}

/* ══════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════ */
function initNavigation() {
    const links = document.querySelectorAll('.admin-nav__link[data-tab]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    document.getElementById('headerAddBtn')?.addEventListener('click', () => {
        resetForm();
        switchTab('add');
    });

    document.getElementById('formCancelBtn')?.addEventListener('click', () => {
        switchTab('cars');
    });
}

function switchTab(tabName) {
    // Update nav
    document.querySelectorAll('.admin-nav__link[data-tab]').forEach(l => l.classList.remove('active'));
    document.querySelector(`.admin-nav__link[data-tab="${tabName}"]`)?.classList.add('active');

    // Update tabs
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

    const titles = { dashboard: 'Дашборд', cars: 'Автомобили', add: editingCarId ? 'Редактирование' : 'Добавить авто' };
    document.getElementById('pageTitle').textContent = titles[tabName] || '';

    if (tabName === 'dashboard') {
        document.getElementById('tabDashboard').classList.add('active');
        loadDashboard();
    } else if (tabName === 'cars') {
        document.getElementById('tabCars').classList.add('active');
        loadCarsList();
    } else if (tabName === 'add') {
        document.getElementById('tabAdd').classList.add('active');
    }

    // Close mobile sidebar
    document.querySelector('.admin-sidebar')?.classList.remove('open');
}

/* ══════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════ */
async function loadDashboard() {
    try {
        const { count: total } = await supabaseGetWithCount('cars', { select: 'id' });
        const { count: available } = await supabaseGetWithCount('cars', { select: 'id', status: 'eq.available' });
        const { count: reserved } = await supabaseGetWithCount('cars', { select: 'id', status: 'eq.reserved' });
        const { count: sold } = await supabaseGetWithCount('cars', { select: 'id', status: 'eq.sold' });

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statAvailable').textContent = available;
        document.getElementById('statReserved').textContent = reserved;
        document.getElementById('statSold').textContent = sold;

        // Recent 5 cars
        const recent = await supabaseGet('cars', {
            select: 'id,slug,title,brand,model,year,price,status,main_image,images,created_at',
            order: 'created_at.desc',
            limit: '5'
        });

        const tbody = document.getElementById('recentCarsBody');
        tbody.innerHTML = recent.map(car => renderTableRow(car, false)).join('');
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

/* ══════════════════════════════════════
   CARS LIST
   ══════════════════════════════════════ */
async function loadCarsList() {
    try {
        const params = {
            select: 'id,slug,title,brand,model,year,price,mileage,status,main_image,images,created_at',
            order: 'created_at.desc'
        };

        // Search filter
        const search = document.getElementById('carsSearch')?.value?.trim();
        if (search) {
            params.title = `ilike.*${search}*`;
        }

        // Status filter
        const status = document.getElementById('carsStatusFilter')?.value;
        if (status) {
            params.status = `eq.${status}`;
        }

        const cars = await supabaseGet('cars', params);

        const tbody = document.getElementById('carsBody');
        const empty = document.getElementById('carsEmpty');

        if (cars.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'flex';
        } else {
            empty.style.display = 'none';
            tbody.innerHTML = cars.map(car => renderTableRow(car, true)).join('');
            bindTableActions();
        }

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('Cars list error:', err);
    }
}

function renderTableRow(car, withActions) {
    const img = car.main_image || (car.images && car.images[0]) || '/images/search-europe.jpg';
    const statusMap = {
        'available': { text: 'В наличии', cls: 'badge--green' },
        'reserved': { text: 'Забронирован', cls: 'badge--orange' },
        'sold': { text: 'Продан', cls: 'badge--red' }
    };
    const s = statusMap[car.status] || statusMap['available'];
    const date = car.created_at ? new Date(car.created_at).toLocaleDateString('ru-RU') : '—';
    const price = car.price ? Number(car.price).toLocaleString('ru-RU') + ' ₽' : '—';
    const mileage = car.mileage ? Number(car.mileage).toLocaleString('ru-RU') + ' км' : '';

    return `
        <tr data-id="${car.id}">
            <td><img src="${img}" alt="" class="admin-table__thumb" onerror="this.src='/images/search-europe.jpg'" /></td>
            <td><strong>${car.title || car.brand + ' ' + car.model}</strong></td>
            <td>${car.year || '—'}</td>
            <td>${price}</td>
            ${withActions ? `<td>${mileage}</td>` : ''}
            <td><span class="admin-badge ${s.cls}">${s.text}</span></td>
            <td>${date}</td>
            ${withActions ? `
                <td class="admin-table__actions">
                    <button class="admin-action-btn" data-action="view" data-slug="${car.slug}" title="Просмотр">
                        <i data-lucide="external-link"></i>
                    </button>
                    <button class="admin-action-btn" data-action="edit" data-id="${car.id}" title="Редактировать">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="admin-action-btn admin-action-btn--danger" data-action="delete" data-id="${car.id}" data-title="${car.title || car.brand + ' ' + car.model}" title="Удалить">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            ` : ''}
        </tr>
    `;
}

function bindTableActions() {
    // View
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', () => {
            window.open(`/car?slug=${btn.dataset.slug}`, '_blank');
        });
    });

    // Edit
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => loadCarForEdit(btn.dataset.id));
    });

    // Delete
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteCarId = btn.dataset.id;
            document.getElementById('deleteModalText').textContent = `Удалить "${btn.dataset.title}"? Это действие нельзя отменить.`;
            document.getElementById('deleteModal').classList.add('open');
        });
    });

    // Search
    document.getElementById('carsSearch')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadCarsList, 400);
    });

    // Status filter
    document.getElementById('carsStatusFilter')?.addEventListener('change', loadCarsList);
}

// Bind search/status filters once (they persist across list reloads)
document.getElementById('carsSearch')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadCarsList, 400);
});
document.getElementById('carsStatusFilter')?.addEventListener('change', loadCarsList);

/* ══════════════════════════════════════
   FORM — ADD / EDIT
   ══════════════════════════════════════ */
async function loadBrands() {
    try {
        allBrands = await supabaseGet('car_brands', {
            select: 'id,name',
            is_active: 'eq.true',
            order: 'name.asc'
        });

        const select = document.getElementById('formBrand');
        select.innerHTML = '<option value="">Выберите марку</option>';
        allBrands.forEach(b => {
            select.innerHTML += `<option value="${b.name}">${b.name}</option>`;
        });
    } catch (err) {
        console.error('Error loading brands:', err);
    }
}

async function loadModels(brandName) {
    const select = document.getElementById('formModel');

    if (!brandName) {
        select.innerHTML = '<option value="">Сначала выберите марку</option>';
        select.disabled = true;
        return;
    }

    const brand = allBrands.find(b => b.name === brandName);
    if (!brand) return;

    try {
        allModels = await supabaseGet('car_models', {
            select: 'id,name',
            brand_id: `eq.${brand.id}`,
            is_active: 'eq.true',
            order: 'name.asc'
        });

        select.innerHTML = '<option value="">Выберите модель</option>';
        allModels.forEach(m => {
            select.innerHTML += `<option value="${m.name}">${m.name}</option>`;
        });
        select.disabled = false;
    } catch (err) {
        console.error('Error loading models:', err);
    }
}

function initForm() {
    // Brand → Model dependency
    document.getElementById('formBrand')?.addEventListener('change', (e) => {
        loadModels(e.target.value);
    });

    // Form submit
    document.getElementById('carForm')?.addEventListener('submit', handleFormSubmit);
}

function generateSlug(brand, model, year) {
    const text = `${brand} ${model} ${year}`;
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('formSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Сохранение...';
    if (window.lucide) lucide.createIcons();

    try {
        // Upload new photos first
        const uploadedUrls = [];
        for (const photo of pendingPhotos) {
            const ext = photo.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const path = `cars/${fileName}`;

            await supabaseUpload(BUCKET, path, photo.file);
            uploadedUrls.push(supabasePublicUrl(BUCKET, path));
        }

        const allPhotos = [...existingPhotos, ...uploadedUrls];
        const mainImage = allPhotos[mainPhotoIndex] || allPhotos[0] || null;

        const brand = document.getElementById('formBrand').value;
        const model = document.getElementById('formModel').value;
        const year = document.getElementById('formYear').value;
        const title = document.getElementById('formTitle').value || `${brand} ${model} ${year}`;

        const carData = {
            brand,
            model,
            year: parseInt(year),
            price: parseFloat(document.getElementById('formPrice').value),
            currency: 'RUB',
            mileage: parseInt(document.getElementById('formMileage').value),
            fuel_type: document.getElementById('formFuel').value,
            transmission: document.getElementById('formTransmission').value,
            engine_volume: document.getElementById('formEngine').value ? parseFloat(document.getElementById('formEngine').value) : null,
            engine_power: document.getElementById('formPower').value ? parseInt(document.getElementById('formPower').value) : null,
            drive_type: document.getElementById('formDrive').value || null,
            body_type: document.getElementById('formBody').value || null,
            color_exterior: document.getElementById('formColorExt').value || null,
            color_interior: document.getElementById('formColorInt').value || null,
            title,
            slug: generateSlug(brand, model, year),
            short_description: document.getElementById('formShortDesc').value || null,
            full_description: document.getElementById('formFullDesc').value || null,
            vin_checked: true,
            documents_ready: true,
            is_featured: document.getElementById('formFeatured').checked,
            status: document.getElementById('formStatus').value,
            main_image: mainImage,
            images: allPhotos,
            updated_at: new Date().toISOString()
        };

        if (editingCarId) {
            // Update existing
            await supabaseUpdate('cars', { id: `eq.${editingCarId}` }, carData);
            showToast('Автомобиль обновлён', 'success');
        } else {
            // Insert new — also make slug unique
            carData.slug = carData.slug + '-' + Date.now().toString(36);
            await supabaseInsert('cars', carData);
            showToast('Автомобиль добавлен', 'success');
        }

        resetForm();
        switchTab('cars');

    } catch (err) {
        console.error('Save error:', err);
        showToast('Ошибка сохранения: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="save"></i> Сохранить';
        if (window.lucide) lucide.createIcons();
    }
}

async function loadCarForEdit(carId) {
    try {
        const cars = await supabaseGet('cars', { id: `eq.${carId}` });
        if (!cars || !cars.length) return;
        const car = cars[0];

        editingCarId = carId;

        // Fill form fields
        document.getElementById('carId').value = carId;
        document.getElementById('formBrand').value = car.brand;
        await loadModels(car.brand);
        document.getElementById('formModel').value = car.model;
        document.getElementById('formYear').value = car.year;
        document.getElementById('formPrice').value = car.price;
        document.getElementById('formMileage').value = car.mileage;
        document.getElementById('formStatus').value = car.status || 'available';
        document.getElementById('formFuel').value = car.fuel_type || '';
        document.getElementById('formTransmission').value = car.transmission || '';
        document.getElementById('formEngine').value = car.engine_volume || '';
        document.getElementById('formPower').value = car.engine_power || '';
        document.getElementById('formDrive').value = car.drive_type || '';
        document.getElementById('formBody').value = car.body_type || '';
        document.getElementById('formColorExt').value = car.color_exterior || car.color || '';
        document.getElementById('formColorInt').value = car.color_interior || '';
        document.getElementById('formTitle').value = car.title || '';
        document.getElementById('formShortDesc').value = car.short_description || '';
        document.getElementById('formFullDesc').value = car.full_description || car.description || '';
        document.getElementById('formFeatured').checked = car.is_featured || false;

        // Photos
        existingPhotos = car.images || [];
        if (car.main_image && !existingPhotos.includes(car.main_image)) {
            existingPhotos.unshift(car.main_image);
        }
        mainPhotoIndex = car.main_image ? existingPhotos.indexOf(car.main_image) : 0;
        if (mainPhotoIndex < 0) mainPhotoIndex = 0;
        pendingPhotos = [];
        renderPhotoPreviews();

        document.getElementById('formSubmitBtn').innerHTML = '<i data-lucide="save"></i> Обновить';
        switchTab('add');
        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error('Edit load error:', err);
        showToast('Ошибка загрузки', 'error');
    }
}

function resetForm() {
    editingCarId = null;
    pendingPhotos = [];
    existingPhotos = [];
    mainPhotoIndex = 0;
    document.getElementById('carForm')?.reset();
    document.getElementById('carId').value = '';
    document.getElementById('formModel').innerHTML = '<option value="">Сначала выберите марку</option>';
    document.getElementById('formModel').disabled = true;

    document.getElementById('formSubmitBtn').innerHTML = '<i data-lucide="save"></i> Сохранить';
    renderPhotoPreviews();
    if (window.lucide) lucide.createIcons();
}

/* ══════════════════════════════════════
   DROPZONE & PHOTOS
   ══════════════════════════════════════ */
function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 10 * 1024 * 1024) {
            showToast('Файл слишком большой (макс 10 МБ)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            pendingPhotos.push({ file, preview: e.target.result, isMain: false });
            renderPhotoPreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderPhotoPreviews() {
    const container = document.getElementById('photosPreview');
    if (!container) return;

    const allPhotos = [
        ...existingPhotos.map((url, i) => ({ url, type: 'existing', idx: i })),
        ...pendingPhotos.map((p, i) => ({ url: p.preview, type: 'pending', idx: i }))
    ];

    if (allPhotos.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = allPhotos.map((photo, globalIdx) => `
        <div class="admin-photo ${globalIdx === mainPhotoIndex ? 'admin-photo--main' : ''}" data-global="${globalIdx}">
            <img src="${photo.url}" alt="Фото" />
            <div class="admin-photo__actions">
                <button type="button" class="admin-photo__btn" data-action="main" data-global="${globalIdx}" title="Сделать главным">
                    <i data-lucide="star"></i>
                </button>
                <button type="button" class="admin-photo__btn admin-photo__btn--del" data-action="remove" data-type="${photo.type}" data-idx="${photo.idx}" title="Удалить">
                    <i data-lucide="x"></i>
                </button>
            </div>
            ${globalIdx === mainPhotoIndex ? '<span class="admin-photo__label">Главное</span>' : ''}
        </div>
    `).join('');

    // Bind actions
    container.querySelectorAll('[data-action="main"]').forEach(btn => {
        btn.addEventListener('click', () => {
            mainPhotoIndex = parseInt(btn.dataset.global);
            renderPhotoPreviews();
        });
    });

    container.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const idx = parseInt(btn.dataset.idx);
            if (type === 'existing') {
                existingPhotos.splice(idx, 1);
            } else {
                pendingPhotos.splice(idx, 1);
            }
            if (mainPhotoIndex >= existingPhotos.length + pendingPhotos.length) {
                mainPhotoIndex = 0;
            }
            renderPhotoPreviews();
        });
    });

    if (window.lucide) lucide.createIcons();
}

/* ══════════════════════════════════════
   DELETE MODAL
   ══════════════════════════════════════ */
function initDeleteModal() {
    document.getElementById('deleteCancelBtn')?.addEventListener('click', () => {
        document.getElementById('deleteModal').classList.remove('open');
        deleteCarId = null;
    });

    document.getElementById('deleteConfirmBtn')?.addEventListener('click', async () => {
        if (!deleteCarId) return;
        try {
            await supabaseDelete('cars', { id: `eq.${deleteCarId}` });
            document.getElementById('deleteModal').classList.remove('open');
            showToast('Автомобиль удалён', 'success');
            deleteCarId = null;
            loadCarsList();
            loadDashboard();
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Ошибка удаления', 'error');
        }
    });
}

/* ══════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════ */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `admin-toast admin-toast--${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ══════════════════════════════════════
   MOBILE SIDEBAR
   ══════════════════════════════════════ */
function initMobileSidebar() {
    document.getElementById('adminBurger')?.addEventListener('click', () => {
        document.querySelector('.admin-sidebar')?.classList.toggle('open');
    });
}

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */
checkAuth();
if (window.lucide) lucide.createIcons();
