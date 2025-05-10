// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  const loginError = document.getElementById('login-error');
  const logoutButton = document.getElementById('logout-button');
  const facilityTableBody = document.getElementById('facilities-table');
  const noFacilities = document.getElementById('no-facilities');
  const facilityModal = document.getElementById('facility-modal');
  const closeModalButton = document.getElementById('close-modal');
  const statusForm = document.getElementById('status-form');
  const statusFilter = document.getElementById('status-filter');
  const searchInput = document.getElementById('search-input');
  const cityFilter = document.getElementById('city-filter');
  const facilityDetailsModal = document.getElementById('facility-details-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const adminPanel = document.getElementById('admin-panel');
  
  // Counter elements
  const totalCountEl = document.getElementById('total-count');
  const pendingCountEl = document.getElementById('pending-count');
  const approvedCountEl = document.getElementById('approved-count');
  const rejectedCountEl = document.getElementById('rejected-count');

  // Global variables for state management
  let facilities = [];
  let filteredFacilities = [];
  let selectedFacility = null;
  let token = localStorage.getItem('authToken');
  let isDebugMode = false;
  let currentSection = null;

  // Form structure for the form editor
  let formStructure = {
    sections: [
      {
        id: "section-1746855813780",
        title: "Genel Bilgiler",
        description: "",
        order: 1
      },
      {
        id: "section-1746856011653",
        title: "Doktorlar",
        description: "",
        order: 2
      },
      {
        id: "section-1746856698467",
        title: "3",
        description: "",
        order: 3
      },
      {
        id: "section-1746856704438",
        title: "4",
        description: "",
        order: 4
      }
    ],
    fields: [
      {
        id: "field-1746855819428",
        label: "Sağlık Tesis Adı",
        type: "text",
        section: "section-1746855813780",
        placeholder: "Örn: Özel Özdemir Muayenehanesi",
        order: 1,
        required: true
      },
      {
        id: "field-ckyscode",
        label: "ÇKYS Kodu",
        type: "text",
        section: "section-1746855813780",
        placeholder: "Örn: 123456",
        order: 2,
        required: true
      },
      {
        id: "field-kurum_tipi",
        label: "Kurum Tipi",
        type: "select",
        section: "section-1746855813780",
        options: ["Özel", "Kamu", "Üniversite"],
        placeholder: "Kurum tipini seçiniz",
        order: 3,
        required: true
      },
      {
        id: "field-group",
        label: "Grup",
        type: "select",
        section: "section-1746855813780",
        options: ["Hastane", "Muayenehane", "Poliklinik", "Tıp Merkezi", "Ağız ve Diş Sağlığı Merkezi", "Laboratuvar", "Görüntüleme Merkezi", "Fizik Tedavi Merkezi", "Diğer"],
        placeholder: "Grup seçiniz",
        order: 4,
        required: true
      },
      {
        id: "field-city",
        label: "Şehir",
        type: "select",
        section: "section-1746855813780",
        options: ["Adana", "Adıyaman", "Afyon", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İçel (Mersin)", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"],
        placeholder: "Şehir seçiniz",
        order: 5,
        required: true
      },
      {
        id: "field-district",
        label: "İlçe",
        type: "text",
        section: "section-1746855813780",
        placeholder: "İlçe adı",
        order: 6,
        required: true
      },
      {
        id: "field-address",
        label: "Adres",
        type: "textarea",
        section: "section-1746855813780",
        placeholder: "Tam adres bilgisi",
        order: 7,
        required: true
      },
      {
        id: "field-postal_code",
        label: "Posta Kodu",
        type: "text",
        section: "section-1746855813780",
        placeholder: "Örn: 61050",
        order: 8,
        required: false
      },
      {
        id: "field-coordinates",
        label: "Koordinatlar",
        type: "text",
        section: "section-1746855813780",
        placeholder: "Örn: 41.035725, 28.984897",
        order: 9,
        required: false
      },
      {
        id: "field-website",
        label: "Web Site URL",
        type: "url",
        section: "section-1746855813780",
        placeholder: "Örn: https://www.sitenizinadresi.com",
        order: 10,
        required: false
      },
      {
        id: "field-email",
        label: "E-posta",
        type: "email",
        section: "section-1746855813780",
        placeholder: "Örn: info@saglikmerkeziniz.com",
        order: 11,
        required: true
      },
      {
        id: "field-phone",
        label: "Telefon",
        type: "tel",
        section: "section-1746855813780",
        placeholder: "Örn: +90 212 123 45 67",
        order: 12,
        required: true
      },
      {
        id: "field-staff_count",
        label: "Personel Sayısı",
        type: "number",
        section: "section-1746855813780",
        placeholder: "Toplam personel sayısı",
        order: 13,
        required: false
      },
      {
        id: "field-foundation_year",
        label: "Kuruluş Yılı",
        type: "number",
        section: "section-1746855813780",
        placeholder: "Örn: 2022",
        order: 14,
        required: false
      },
      {
        id: "field-certifications",
        label: "Sertifikalar",
        type: "checkbox",
        section: "section-1746855813780",
        options: ["JCI", "ISO", "TÜV", "Bakanlık Onayı", "Diğer"],
        order: 15,
        required: false
      },
      {
        id: "field-1746856125435",
        label: "test",
        type: "email",
        section: "section-1746856011653",
        placeholder: "test",
        order: 16,
        required: false
      },
      {
        id: "field-1746856722510",
        label: "Yetki Belgesi",
        type: "file",
        section: "section-1746856698467",
        placeholder: "test",
        order: 17,
        required: false,
        accept: ".pdf,.doc,.docx,image/*"
      },
      {
        id: "field-1746856743924",
        label: "2",
        type: "file",
        section: "section-1746856698467",
        placeholder: "",
        order: 18,
        required: false,
        accept: ".pdf,.doc,.docx,image/*"
      }
    ],
    lastModified: new Date().toISOString()
  };

  // Initialize the application
  window.addEventListener('load', function() {
    console.log('Admin panel initialized with window.onload');
    console.log('DOM Elements: ', {
      loginForm,
      loginContainer,
      dashboardContainer,
      logoutButton
    });
    
    // Add debug code to check tab content elements
    console.log('Tab Content Elements: ', {
      contentInfo: document.getElementById('content-info'),
      contentDocuments: document.getElementById('content-documents'),
      contentStatus: document.getElementById('content-status'),
      contentNotes: document.getElementById('content-notes')
    });
    
    // Set up debug tools
    setupDebugTools();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set default status filter to "Bekliyor"
    if (statusFilter) {
      statusFilter.value = "Bekliyor";
    }
    
    // Check authentication
    checkAuth();
  });

  // Set up event listeners
  function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Login form submission
    if (loginForm) {
      console.log('Adding event listener to login form');
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Login attempt with:', { username, password });
        
        // Simple validation
        if (username && password) {
          loginUser(username, password);
        } else {
          console.log('Login failed: missing username or password');
          showLoginError('Kullanıcı adı ve şifre gereklidir');
        }
      });
    } else {
      console.error('Login form not found!');
    }

    // Logout button
    if (logoutButton) {
      console.log('Adding event listener to logout button');
      logoutButton.addEventListener('click', function() {
        console.log('Logout button clicked');
        // Clear token
        localStorage.removeItem('adminToken');
        token = null;
        isAuthenticated = false;
        
        // Show login form
        showLogin();
      });
    } else {
      console.error('Logout button not found!');
    }

    // Form Edit button
    const formEditButton = document.getElementById('form-edit-button');
    if (formEditButton) {
      formEditButton.addEventListener('click', function() {
        openFormEditor();
      });
    }

    // Close Form Editor button
    const closeFormEditorButton = document.getElementById('close-form-editor');
    if (closeFormEditorButton) {
      closeFormEditorButton.addEventListener('click', function() {
        closeFormEditor();
      });
    }

    // Cancel Form Edit button
    const cancelFormEditButton = document.getElementById('cancel-form-edit');
    if (cancelFormEditButton) {
      cancelFormEditButton.addEventListener('click', function() {
        closeFormEditor();
      });
    }

    // Form editor tabs
    const formEditorTabs = document.querySelectorAll('.form-editor-tab');
    formEditorTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        switchFormEditorTab(tabId);
      });
    });

    // Add Section button
    const addSectionBtn = document.getElementById('add-section-btn');
    if (addSectionBtn) {
      addSectionBtn.addEventListener('click', function() {
        openAddSectionModal();
      });
    }

    // Close Add Section Modal button
    const closeAddSectionBtn = document.getElementById('close-add-section');
    if (closeAddSectionBtn) {
      closeAddSectionBtn.addEventListener('click', function() {
        closeAddSectionModal();
      });
    }

    // Cancel Add Section button
    const cancelAddSectionBtn = document.getElementById('cancel-add-section');
    if (cancelAddSectionBtn) {
      cancelAddSectionBtn.addEventListener('click', function() {
        closeAddSectionModal();
      });
    }

    // Save New Section button
    const saveNewSectionBtn = document.getElementById('save-new-section');
    if (saveNewSectionBtn) {
      saveNewSectionBtn.addEventListener('click', function() {
        saveNewSection();
      });
    }

    // Add Field button
    const addFieldBtn = document.getElementById('add-field-btn');
    if (addFieldBtn) {
      addFieldBtn.addEventListener('click', function() {
        openAddFieldModal();
      });
    }

    // Close Add Field Modal button
    const closeAddFieldBtn = document.getElementById('close-add-field');
    if (closeAddFieldBtn) {
      closeAddFieldBtn.addEventListener('click', function() {
        closeAddFieldModal();
      });
    }

    // Cancel Add Field button
    const cancelAddFieldBtn = document.getElementById('cancel-add-field');
    if (cancelAddFieldBtn) {
      cancelAddFieldBtn.addEventListener('click', function() {
        closeAddFieldModal();
      });
    }
    
    // Save New Field button
    const saveNewFieldBtn = document.getElementById('save-new-field');
    if (saveNewFieldBtn) {
      saveNewFieldBtn.addEventListener('click', function() {
        saveNewField();
      });
    }

    // Field type change - show/hide options
    const fieldTypeSelect = document.getElementById('field-type');
    if (fieldTypeSelect) {
      fieldTypeSelect.addEventListener('change', function() {
        toggleFieldOptionsContainer();
      });
    }

    // Save Form Changes button
    const saveFormChangesBtn = document.getElementById('save-form-changes');
    if (saveFormChangesBtn) {
      saveFormChangesBtn.addEventListener('click', function() {
        saveFormChanges();
      });
    }
    
    // Search and filters
    if (searchInput) {
      searchInput.addEventListener('input', filterFacilities);
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', filterFacilities);
    }
    
    // Institution Type Filter
    const institutionFilter = document.getElementById('institution-filter');
    if (institutionFilter) {
      institutionFilter.addEventListener('change', filterFacilities);
    }
    
    // City Filter
    if (cityFilter) {
      cityFilter.addEventListener('change', filterFacilities);
    }
    
    // Filter button dropdown toggle
    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (filterButton && filterDropdown) {
      filterButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling to document
        filterDropdown.classList.toggle('show');
        // Toggle active class on button
        filterButton.classList.toggle('filter-button-active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(event) {
        if (!filterButton.contains(event.target) && !filterDropdown.contains(event.target)) {
          filterDropdown.classList.remove('show');
          filterButton.classList.remove('filter-button-active');
        }
      });
      
      // Prevent dropdown from closing when clicking inside it
      filterDropdown.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling to document
      });
    }
    
    // Apply Filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', function() {
        filterFacilities();
        // Hide dropdown after applying filters
        filterDropdown.classList.remove('show');
        filterButton.classList.remove('filter-button-active');
      });
    }
    
    // Section filter for form editor
    const sectionFilter = document.getElementById('section-filter');
    if (sectionFilter) {
      sectionFilter.addEventListener('change', function() {
        renderFieldsList();
      });
    }
  }

  // Admin login - basic version
  async function loginUser(username, password) {
    try {
      // Show loading state
      const submitBtn = document.querySelector('#login-form button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Giriş Yap';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Giriş Yapılıyor...';
      }
      
      // Clear previous errors
      if (loginError) {
        loginError.classList.add('hidden');
      }
      
      // Send login request
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      
      // Parse response
      const data = await response.json();
      
      if (response.ok) {
        console.log('Login successful:', data);
        
        // Store token
        token = data.token;
        localStorage.setItem('adminToken', token);
        isAuthenticated = true;
        
        // Add debug log
        debugInfo.lastResponse = JSON.stringify(data);
        debugInfo.logs.push({
          time: new Date().toLocaleTimeString(),
          type: 'success',
          message: 'Login successful'
        });
        
        // Show dashboard
        showDashboard();
        
        // Load facilities
        loadFacilities();
      } else {
        console.error('Login failed:', data);
        showLoginError(data.message || 'Geçersiz kullanıcı adı veya şifre');
        
        // Add debug log
        debugInfo.lastError = JSON.stringify(data);
        debugInfo.logs.push({
          time: new Date().toLocaleTimeString(),
          type: 'error',
          message: `Login failed: ${data.message || 'Bilinmeyen hata'}`
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Reset button state
      const submitBtn = document.querySelector('#login-form button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Giriş Yap';
      }
      
      showLoginError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      
      // Add debug log
      debugInfo.lastError = error.toString();
      debugInfo.logs.push({
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: `Login exception: ${error.toString()}`
      });
    }
  }

  // Check authentication
  function checkAuth() {
    console.log('Checking authentication, token:', token);
    
    // Try to get token from localStorage
    if (!token) {
      token = localStorage.getItem('adminToken');
      isAuthenticated = !!token;
    }
    
    if (isAuthenticated) {
      console.log('User is authenticated, showing dashboard');
      showDashboard();
      loadFacilities();
    } else {
      console.log('User is not authenticated, showing login form');
      showLogin();
    }
  }

  // Show login form
  function showLogin() {
    console.log('Showing login form');
    if (loginContainer) {
      loginContainer.classList.remove('hidden');
    } else {
      console.error('Login container not found!');
    }
    
    if (dashboardContainer) {
      dashboardContainer.classList.add('hidden');
    } else {
      console.error('Dashboard container not found!');
    }
    
    if (loginError) {
      loginError.classList.add('hidden');
    }
  }

  // Show login error
  function showLoginError(message) {
    if (loginError) {
      loginError.textContent = message;
      loginError.classList.remove('hidden');
    }
  }

  // Show dashboard
  function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    
    // Set status filter default to "Bekliyor" instead of "all"
    if (statusFilter) {
      statusFilter.value = 'Bekliyor';
    }
  }

  // Filter facilities based on current filter settings and render the table
  function filterFacilities() {
    // Get filtered facilities
    const filteredFacilities = filterFacilitiesData();
    
    // Render table with filtered facilities
    renderFacilitiesTable(filteredFacilities);
    
    // Update filter counts in the UI
    const filterCount = document.getElementById('filter-count');
    if (filterCount) {
      filterCount.textContent = filteredFacilities.length;
    }
    
    // Update filter button UI
    const filterButton = document.getElementById('filter-button');
    if (filterButton) {
      // Check if any filters are active
      const hasActiveFilters = 
        (statusFilter && statusFilter.value !== 'all') || 
        (searchInput && searchInput.value.trim() !== '') ||
        (cityFilter && cityFilter.value !== 'all') ||
        (document.getElementById('institution-filter') && document.getElementById('institution-filter').value !== 'all');
      
      // Add active class if filters are applied
      if (hasActiveFilters) {
        filterButton.classList.add('filter-active');
      } else {
        filterButton.classList.remove('filter-active');
      }
    }
  }
  
  // Get filtered facilities based on filter settings
  function filterFacilitiesData() {
    if (!facilities || !Array.isArray(facilities)) {
      console.error('Facilities is not an array:', facilities);
      return [];
    }
    
    // Apply filters
    let filtered = [...facilities];
    
    // Status filter
    if (statusFilter && statusFilter.value !== 'all') {
      filtered = filtered.filter(facility => facility.status === statusFilter.value);
    }
    
    // Search filter
    if (searchInput && searchInput.value.trim() !== '') {
      const searchTerm = searchInput.value.toLowerCase().trim();
      filtered = filtered.filter(facility => {
        return (
          (facility.facilityName && facility.facilityName.toLowerCase().includes(searchTerm)) ||
          (facility.applicationId && facility.applicationId.toLowerCase().includes(searchTerm)) ||
          (facility.ckyscode && facility.ckyscode.toLowerCase().includes(searchTerm)) ||
          (facility.city && facility.city.toLowerCase().includes(searchTerm)) ||
          (facility.district && facility.district.toLowerCase().includes(searchTerm))
        );
      });
    }
    
    // City filter
    if (cityFilter && cityFilter.value !== 'all') {
      filtered = filtered.filter(facility => facility.city === cityFilter.value);
    }
    
    // Institution type filter
    const institutionFilter = document.getElementById('institution-filter');
    if (institutionFilter && institutionFilter.value !== 'all') {
      filtered = filtered.filter(facility => facility.institutionType === institutionFilter.value);
    }
    
    return filtered;
  }

  // Load facilities
  async function loadFacilities() {
    try {
      console.log('Loading facilities...');
      
      // Show loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-facilities';
      loadingIndicator.className = 'flex items-center justify-center p-4';
      loadingIndicator.innerHTML = `
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        <p>Tesisler yükleniyor...</p>
      `;
      
      if (facilityTableBody) {
        facilityTableBody.innerHTML = '';
        facilityTableBody.appendChild(loadingIndicator);
      }
      
      const response = await fetch('/api/admin/facilities', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Handle unauthorized error (token expired or invalid)
        console.error('Authorization failed. Token may be expired.');
        localStorage.removeItem('adminToken');
        token = null;
        isAuthenticated = false;
        showLogin();
        showLoginError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        return;
      }
      
      // Check for other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        showNotification(`Tesisler yüklenirken bir hata oluştu: ${response.status} ${response.statusText}`, 'error');
        
        // Clean up loading indicator
        const loadingElement = document.getElementById('loading-facilities');
        if (loadingElement && loadingElement.parentNode) {
          loadingElement.parentNode.removeChild(loadingElement);
        }
        
        if (noFacilities) {
          noFacilities.classList.remove('hidden');
        }
        return;
      }
      
      // Parse the JSON response
      const result = await response.json();
      
      // Log the response for debugging
      console.log('Facilities API response:', result);
      
      // Remove loading indicator
      const loadingElement = document.getElementById('loading-facilities');
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
      
      if (result.success) {
        // Check if data is an array
        if (!result.data || !Array.isArray(result.data)) {
          console.error('Invalid facilities data format, expected array:', result.data);
          showNotification('Tesisler yüklenirken bir veri format hatası oluştu', 'error');
          
          if (facilityTableBody) {
            facilityTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-600">Veri formatı hatası: Tesisler listesi alınamadı</td></tr>';
          }
          
          if (noFacilities) {
            noFacilities.classList.remove('hidden');
          }
          return;
        }
        
        facilities = result.data || [];
        console.log(`Loaded ${facilities.length} facilities`);
        
        // Check if there are any warnings in the response
        if (result.errors && result.errors.length > 0) {
          console.warn('API warnings:', result.errors);
          
          // If in debug mode, show warnings
          if (isDebugMode) {
            result.errors.forEach(error => {
              addDebugLog(`API Uyarı: ${error}`, 'warning');
            });
          }
        }
        
        // Sort by applicationId or createdAt date (newest first)
        facilities.sort((a, b) => {
          if (a.applicationId && b.applicationId) {
            return a.applicationId.localeCompare(b.applicationId);
          }
          
          // If no applicationId, sort by creation date
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        // Make sure statusFilter is set to "Bekliyor" before filtering
        if (statusFilter) {
          statusFilter.value = 'Bekliyor';
        }
        
        // Apply default filtering by status "Bekliyor"
        filterFacilities();
        updateCounters(facilities);
      } else {
        console.error('Failed to load facilities:', result.message);
        showNotification(`Tesisler yüklenirken hata oluştu: ${result.message || 'Bilinmeyen hata'}`, 'error');
        
        if (facilityTableBody) {
          facilityTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-600">Hata: ${result.message || 'Bilinmeyen hata'}</td></tr>`;
        }
        
        if (noFacilities) {
          noFacilities.classList.remove('hidden');
        }
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      showNotification('Tesisler yüklenirken bir hata oluştu: ' + error.message, 'error');
      
      if (facilityTableBody) {
        facilityTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-600">Bağlantı hatası: ${error.message}</td></tr>`;
      }
      
      if (noFacilities) {
        noFacilities.classList.remove('hidden');
      }
      
      // If in debug mode, add detailed error info
      if (isDebugMode) {
        addDebugLog(`Tesis yükleme hatası: ${error.message}`, 'error');
        addDebugLog(`Hata detayı: ${error.stack || 'Stack trace yok'}`, 'error');
      }
    }
  }

  // Render facilities table
  function renderFacilitiesTable(facilitiesToRender) {
    if (!facilityTableBody) return;
    
    facilityTableBody.innerHTML = '';
    
    if (facilitiesToRender.length === 0) {
      document.getElementById('no-facilities').classList.remove('hidden');
      return;
    }
    
    document.getElementById('no-facilities').classList.add('hidden');
    
    facilitiesToRender.forEach((facility, index) => {
      const row = document.createElement('tr');
      row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      
      // Format date
      const createdDate = facility.createdAt 
        ? new Date(facility.createdAt).toLocaleDateString('tr-TR') 
        : 'Belirtilmemiş';
      
      // Create status badge
      const statusBadge = createStatusBadge(facility.status || 'Bekliyor');
      
      // Get the facility ID
      const facilityId = facility._id || facility.id || facility.applicationId || '';
      
      // Ensure facility data is properly displayed even if some fields are missing
      const facilityName = facility.facilityName || 'İsimsiz Tesis';
      const institutionType = facility.institutionType || 'Belirtilmemiş';
      const city = facility.city || 'Belirtilmemiş';
      const district = facility.district || '';
      
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="ml-0">
              <div class="text-sm font-medium text-gray-900">${facilityName}</div>
              <div class="text-sm text-gray-500">${facilityId}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${institutionType}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${city}</div>
          <div class="text-sm text-gray-500">${district}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${createdDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex space-x-2 justify-end">
            <button 
              class="text-blue-600 hover:text-blue-900 view-facility" 
              data-id="${facilityId}">
              Görüntüle
            </button>
            <button 
              class="text-green-600 hover:text-green-900 approve-facility" 
              data-id="${facilityId}">
              Onayla
            </button>
            <button 
              class="text-red-600 hover:text-red-900 reject-facility" 
              data-id="${facilityId}">
              Reddet
            </button>
            <button 
              class="text-gray-600 hover:text-gray-900 delete-facility" 
              data-id="${facilityId}">
              Sil
            </button>
          </div>
        </td>
      `;
      
      facilityTableBody.appendChild(row);
      
      // Add event listeners to the buttons
      const viewBtn = row.querySelector('.view-facility');
      const approveBtn = row.querySelector('.approve-facility');
      const rejectBtn = row.querySelector('.reject-facility');
      const deleteBtn = row.querySelector('.delete-facility');
      
      if (viewBtn) {
        viewBtn.addEventListener('click', () => showFacilityDetails(facility));
      }
      
      if (approveBtn) {
        approveBtn.addEventListener('click', () => updateFacilityStatus(facilityId, 'Onaylandı'));
      }
      
      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => updateFacilityStatus(facilityId, 'İptal Edildi'));
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteFacility(facilityId));
      }
    });
  }

  // Handle status update from the modal
  function handleStatusUpdate(e) {
    e.preventDefault();
    
    const facilityId = document.getElementById('facility-id').value;
    const status = document.getElementById('status').value;
    const adminNotes = document.getElementById('admin-notes').value;
    
    // Create a note object with timestamp
    const note = {
      text: adminNotes,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    updateFacilityStatus(facilityId, status, adminNotes, note);
    facilityModal.classList.add('hidden');
  }

  // Update facility status
  async function updateFacilityStatus(facilityId, status, adminNotes, noteObject) {
    try {
      // Bildirim göster
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white py-2 px-4 rounded shadow-lg z-50 flex items-center';
      notification.innerHTML = `
        <div class="mr-2 animate-spin">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <span>Durum güncelleniyor...</span>
      `;
      document.body.appendChild(notification);
      
      console.log('Durum güncelleniyor...', { facilityId, status });
      
      const response = await fetch(`/api/admin/facilities/${facilityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status, 
          adminNotes: adminNotes || '',
          noteObject: noteObject || {
            text: `Durum şuna güncellendi: ${status}`,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      // Bildirimi kaldır
      document.body.removeChild(notification);
      
      const result = await response.json();
      
      if (result.success) {
        // Başarılı bildirim göster
        showNotification(`Durum başarıyla güncellendi: ${status}`, 'success');
        
        // Yerel veriyi güncelle
        const index = facilities.findIndex(f => (
          f._id === facilityId || 
          f.id === facilityId || 
          f.applicationId === facilityId
        ));
        
        if (index !== -1) {
          facilities[index].status = status;
          
          if (adminNotes) {
            facilities[index].adminNotes = adminNotes;
          }
          
          // Notu ekle
          if (!facilities[index].notesHistory) {
            facilities[index].notesHistory = [];
          }
          
          if (noteObject) {
            facilities[index].notesHistory.push(noteObject);
          }
          
          // Tabloyu yeniden render et
          renderFacilitiesTable(filterFacilitiesData());
          updateCounters(facilities);
        } else {
          console.warn('Güncellenen tesis bulunamadı:', facilityId);
          // Tablo verilerini sunucudan yenile
          await loadFacilities();
        }
      } else {
        console.error('Durum güncellenirken hata oluştu:', result);
        showNotification(`Durum güncellenemedi: ${result.message || 'Sunucu hatası'}`, 'error');
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      showNotification('Bağlantı hatası: ' + error.message, 'error');
    }
  }

  // Delete facility
  async function deleteFacility(facilityId) {
    if (!confirm('Bu tesisi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      // Bildirim göster
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-600 text-white py-2 px-4 rounded shadow-lg z-50 flex items-center';
      notification.innerHTML = `
        <div class="mr-2 animate-spin">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <span>Tesis siliniyor...</span>
      `;
      document.body.appendChild(notification);
      
      const response = await fetch(`/api/admin/facilities/${facilityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Bildirimi kaldır
      document.body.removeChild(notification);
      
      const result = await response.json();
      
      if (result.success) {
        // Başarılı bildirim göster
        showNotification('Tesis başarıyla silindi', 'success');
        
        // Yerel veriyi güncelle
        facilities = facilities.filter(f => (
          f._id !== facilityId && 
          f.id !== facilityId && 
          f.applicationId !== facilityId
        ));
        
        // Tabloyu yeniden render et
        renderFacilitiesTable(filterFacilitiesData());
        updateCounters(facilities);
      } else {
        console.error('Tesis silinirken hata oluştu:', result);
        showNotification(`Tesis silinemedi: ${result.message || 'Sunucu hatası'}`, 'error');
      }
    } catch (error) {
      console.error('Silme işlemi hatası:', error);
      showNotification('Bağlantı hatası: ' + error.message, 'error');
    }
  }

  // Show facility details
  function showFacilityDetails(facility) {
    // Get DOM elements
    const modalTitle = document.getElementById('modal-title');
    const facilityName = document.getElementById('facility-name');
    const facilityTitle = document.getElementById('facility-title');
    const facilityApplicationId = document.getElementById('facility-application-id');
    const facilityImage = document.getElementById('facility-image');
    const noFacilityImageIcon = document.getElementById('no-facility-image-icon');
    const logoImage = document.getElementById('logo-image');
    const facilityLogo = document.getElementById('facility-logo');
    const noLogoModalIcon = document.getElementById('no-logo-modal-icon');
    const noLogoIcon = document.getElementById('no-logo-icon');
    const noAuthDocIcon = document.getElementById('no-auth-doc-icon');
    const authDocContent = document.getElementById('auth-doc-content');
    const noLicenseIcon = document.getElementById('no-license-icon');
    const licenseContent = document.getElementById('license-content');
    const noFacilityImage = document.getElementById('no-facility-image');
    const noLogo = document.getElementById('no-logo');
    const noAuthDoc = document.getElementById('no-auth-doc');
    const noLicense = document.getElementById('no-license');
    const galleryContainer = document.getElementById('gallery-container');
    const noGallery = document.getElementById('no-gallery');
    const facilityIdInput = document.getElementById('facility-id');
    const statusSelect = document.getElementById('status');
    const adminNotesTextarea = document.getElementById('admin-notes');
    
    // Get download buttons
    const downloadFacilityImage = document.getElementById('download-facility-image');
    const downloadLogo = document.getElementById('download-logo');
    const downloadAuthDoc = document.getElementById('download-auth-doc');
    const downloadLicense = document.getElementById('download-license');
    
    // Set basic details
    modalTitle.textContent = `Tesis Detayları: ${facility.facilityName || 'İsimsiz Tesis'}`;
    facilityName.textContent = facility.facilityName || 'İsimsiz Tesis';
    facilityTitle.textContent = facility.facilityTitle || '';
    
    // Set application ID
    const appId = facility.applicationId || facility._id || facility.id || '';
    facilityApplicationId.textContent = appId;
    
    // Set form values for status update
    facilityIdInput.value = appId;
    statusSelect.value = facility.status || 'Bekliyor';
    adminNotesTextarea.value = facility.adminNotes || '';
    
    // Handle facility image
    if (facility.facilityImage) {
      facilityImage.src = facility.facilityImage;
      facilityImage.alt = facility.facilityName;
      facilityImage.classList.remove('hidden');
      noFacilityImageIcon.classList.add('hidden');
      downloadFacilityImage.href = facility.facilityImage;
      downloadFacilityImage.classList.remove('hidden');
      noFacilityImage.classList.add('hidden');
    } else {
      facilityImage.src = '';
      facilityImage.classList.add('hidden');
      noFacilityImageIcon.classList.remove('hidden');
      downloadFacilityImage.classList.add('hidden');
      noFacilityImage.classList.remove('hidden');
    }
    
    // Handle facility logo in both the document tab and the modal header
    if (facility.facilityLogo) {
      // Update logo in documents tab
      logoImage.src = facility.facilityLogo;
      logoImage.alt = 'Tesis Logosu';
      logoImage.classList.remove('hidden');
      noLogoIcon.classList.add('hidden');
      downloadLogo.href = facility.facilityLogo;
      downloadLogo.classList.remove('hidden');
      noLogo.classList.add('hidden');
      
      // Update logo in modal header
      facilityLogo.src = facility.facilityLogo;
      facilityLogo.alt = facility.facilityName || 'Tesis Logosu';
      facilityLogo.classList.remove('hidden');
      noLogoModalIcon.classList.add('hidden');
    } else {
      // Update logo in documents tab
      logoImage.src = '';
      logoImage.classList.add('hidden');
      noLogoIcon.classList.remove('hidden');
      downloadLogo.classList.add('hidden');
      noLogo.classList.remove('hidden');
      
      // Update logo in modal header
      facilityLogo.src = '';
      facilityLogo.classList.add('hidden');
      noLogoModalIcon.classList.remove('hidden');
    }
    
    // Handle authorization document
    if (facility.authorizationDocument) {
      authDocContent.classList.remove('hidden');
      noAuthDocIcon.classList.add('hidden');
      downloadAuthDoc.href = facility.authorizationDocument;
      downloadAuthDoc.classList.remove('hidden');
      noAuthDoc.classList.add('hidden');
    } else {
      authDocContent.classList.add('hidden');
      noAuthDocIcon.classList.remove('hidden');
      downloadAuthDoc.classList.add('hidden');
      noAuthDoc.classList.remove('hidden');
    }
    
    // Handle facility license
    if (facility.facilityLicense) {
      licenseContent.classList.remove('hidden');
      noLicenseIcon.classList.add('hidden');
      downloadLicense.href = facility.facilityLicense;
      downloadLicense.classList.remove('hidden');
      noLicense.classList.add('hidden');
    } else {
      licenseContent.classList.add('hidden');
      noLicenseIcon.classList.remove('hidden');
      downloadLicense.classList.add('hidden');
      noLicense.classList.remove('hidden');
    }
    
    // Handle gallery
    galleryContainer.innerHTML = '';
    
    // Get gallery images from various property formats
    let galleryImages = [];
    
    // Check for array property
    if (Array.isArray(facility.galleryImages)) {
      galleryImages = facility.galleryImages;
    } 
    // Check for gallery properties with numbered keys
    else {
      for (const key in facility) {
        if (key.startsWith('gallery') && facility[key]) {
          galleryImages.push(facility[key]);
        }
      }
    }
    
    if (galleryImages.length > 0) {
      noGallery.classList.add('hidden');
      galleryImages.forEach(imageUrl => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'bg-gray-100 rounded-lg overflow-hidden h-40 flex items-center justify-center';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Klinik Görüntüsü';
        img.className = 'max-h-full object-contain';
        
        imgContainer.appendChild(img);
        galleryContainer.appendChild(imgContainer);
      });
    } else {
      noGallery.classList.remove('hidden');
    }
    
    // Set up upload buttons event listeners
    const uploadImageButtons = document.querySelectorAll('.upload-image-button');
    uploadImageButtons.forEach(button => {
      button.addEventListener('click', function() {
        const fieldName = this.getAttribute('data-field');
        openUploadModal(fieldName, 'image');
      });
    });

    const uploadDocButtons = document.querySelectorAll('.upload-doc-button');
    uploadDocButtons.forEach(button => {
      button.addEventListener('click', function() {
        const fieldName = this.getAttribute('data-field');
        openUploadModal(fieldName, 'document');
      });
    });

    // Set up 'Add Gallery Image' button
    const addGalleryBtn = document.getElementById('add-gallery-image');
    if (addGalleryBtn) {
      addGalleryBtn.addEventListener('click', function() {
        openUploadModal('galleryImage', 'image');
      });
    }
    
    // Load admin notes history
    const notesContainer = document.getElementById('notes-container');
    const noNotes = document.getElementById('no-notes');
    
    if (notesContainer) {
      notesContainer.innerHTML = '';
      
      // Check if we have admin notes history
      if (facility.notesHistory && Array.isArray(facility.notesHistory) && facility.notesHistory.length > 0) {
        noNotes.classList.add('hidden');
        
        // Sort notes by date (newest first)
        const sortedNotes = [...facility.notesHistory].sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Add each note to the container
        sortedNotes.forEach(note => {
          const noteDate = new Date(note.timestamp);
          const formattedDate = `${noteDate.toLocaleDateString('tr-TR')} ${noteDate.toLocaleTimeString('tr-TR')}`;
          
          const noteElement = document.createElement('div');
          noteElement.className = 'p-3 bg-gray-50 rounded-lg';
          noteElement.innerHTML = `
            <div class="flex justify-between items-start">
              <p class="text-sm font-medium text-gray-900">${note.status || 'Durum Güncellemesi'}</p>
              <p class="text-xs text-gray-500">${formattedDate}</p>
            </div>
            <p class="text-sm text-gray-700 mt-1">${note.text || ''}</p>
          `;
          
          notesContainer.appendChild(noteElement);
        });
      } else if (facility.adminNotes) {
        // If we have just a single adminNotes field but no history
        noNotes.classList.add('hidden');
        
        const noteElement = document.createElement('div');
        noteElement.className = 'p-3 bg-gray-50 rounded-lg';
        
        // Try to extract date from createdAt or updateAt if available
        let dateText = 'Tarih bilgisi yok';
        if (facility.updatedAt) {
          const noteDate = new Date(facility.updatedAt);
          dateText = `${noteDate.toLocaleDateString('tr-TR')} ${noteDate.toLocaleTimeString('tr-TR')}`;
        } else if (facility.createdAt) {
          const noteDate = new Date(facility.createdAt);
          dateText = `${noteDate.toLocaleDateString('tr-TR')} ${noteDate.toLocaleTimeString('tr-TR')}`;
        }
        
        noteElement.innerHTML = `
          <div class="flex justify-between items-start">
            <p class="text-sm font-medium text-gray-900">${facility.status || 'Durum Bilgisi'}</p>
            <p class="text-xs text-gray-500">${dateText}</p>
          </div>
          <p class="text-sm text-gray-700 mt-1">${facility.adminNotes}</p>
        `;
        
        notesContainer.appendChild(noteElement);
      } else {
        // No notes at all
        noNotes.classList.remove('hidden');
      }
    }
    
    // Populate file list in downloads tab
    populateFilesList(facility);
    
    // Setup download buttons
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', () => generatePdfFile(facility));
    }
    
    const downloadZipBtn = document.getElementById('download-zip-btn');
    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', () => generateZipFile(facility));
    }
    
    // Render facility details
    renderFacilityDetails(facility);
    
    // Show the modal
    facilityModal.classList.remove('hidden');
    
    // Debug the tab content elements before setting up tabs
    console.log('Tab Content Elements before setupTabs: ', {
      contentInfo: document.getElementById('content-info'),
      contentDocuments: document.getElementById('content-documents'),
      contentStatus: document.getElementById('content-status'),
      contentNotes: document.getElementById('content-notes')
    });
    
    // Additional check for direct styles
    const allTabPanes = document.querySelectorAll('.tab-pane');
    console.log('All tab panes count:', allTabPanes.length);
    allTabPanes.forEach((pane, index) => {
      console.log(`Tab pane ${index}:`, pane.id, 'Computed display:', window.getComputedStyle(pane).display);
    });
    
    // Setup tabs
    setupTabs();
    
    // Debug the tab content elements after setting up tabs
    console.log('Tab Content Elements after setupTabs: ', {
      contentInfo: document.getElementById('content-info'),
      contentDocuments: document.getElementById('content-documents'),
      contentStatus: document.getElementById('content-status'),
      contentNotes: document.getElementById('content-notes')
    });
    
    // Setup edit buttons
    setupEditButtons();
  }

  // Populate files list in the downloads tab
  function populateFilesList(facility) {
    const filesListContainer = document.getElementById('facility-files-list');
    const noFilesMessage = document.getElementById('no-files');
    
    if (!filesListContainer || !noFilesMessage) return;
    
    filesListContainer.innerHTML = '';
    
    // Collect all available files
    const files = [];
    
    // Facility Image
    if (facility.facilityImage) {
      files.push({
        name: 'Tesis Fotoğrafı',
        url: facility.facilityImage,
        type: 'image',
        extension: getFileExtension(facility.facilityImage)
      });
    }
    
    // Facility Logo
    if (facility.facilityLogo) {
      files.push({
        name: 'Tesis Logosu',
        url: facility.facilityLogo,
        type: 'image',
        extension: getFileExtension(facility.facilityLogo)
      });
    }
    
    // Authorization Document
    if (facility.authorizationDocument) {
      files.push({
        name: 'Sağlık Turizmi Yetki Belgesi',
        url: facility.authorizationDocument,
        type: 'document',
        extension: getFileExtension(facility.authorizationDocument)
      });
    }
    
    // Facility License
    if (facility.facilityLicense) {
      files.push({
        name: 'Sağlık Tesis Ruhsatı',
        url: facility.facilityLicense,
        type: 'document',
        extension: getFileExtension(facility.facilityLicense)
      });
    }
    
    // Gallery Images
    let galleryImages = [];
    
    // Check for array property
    if (Array.isArray(facility.galleryImages)) {
      galleryImages = facility.galleryImages;
    } 
    // Check for gallery properties with numbered keys
    else {
      for (const key in facility) {
        if (key.startsWith('gallery') && facility[key]) {
          galleryImages.push(facility[key]);
        }
      }
    }
    
    // Add gallery images to files list
    galleryImages.forEach((imageUrl, index) => {
      files.push({
        name: `Klinik Fotoğrafı ${index + 1}`,
        url: imageUrl,
        type: 'image',
        extension: getFileExtension(imageUrl)
      });
    });
    
    // Check if we have any files
    if (files.length === 0) {
      noFilesMessage.classList.remove('hidden');
      filesListContainer.classList.add('hidden');
      return;
    }
    
    noFilesMessage.classList.add('hidden');
    filesListContainer.classList.remove('hidden');
    
    // Render each file
    files.forEach(file => {
      const fileRow = document.createElement('div');
      fileRow.className = 'p-3 flex justify-between items-center';
      
      // Get icon based on file type
      let iconClass = '';
      let textColor = '';
      let bgColor = '';
      
      if (file.type === 'image') {
        iconClass = 'fa-file-image';
        textColor = 'text-blue-600';
        bgColor = 'bg-blue-100';
      } else if (file.extension === 'pdf') {
        iconClass = 'fa-file-pdf';
        textColor = 'text-red-600';
        bgColor = 'bg-red-100';
      } else {
        iconClass = 'fa-file-alt';
        textColor = 'text-gray-600';
        bgColor = 'bg-gray-100';
      }
      
      fileRow.innerHTML = `
        <div class="flex items-center">
          <div class="p-2 rounded-full ${bgColor} mr-3">
            <i class="fas ${iconClass} ${textColor}"></i>
          </div>
          <div>
            <p class="font-medium">${file.name}</p>
            <p class="text-xs text-gray-500">${file.type === 'image' ? 'Görüntü' : 'Belge'} (${file.extension.toUpperCase()})</p>
          </div>
        </div>
        <a href="${file.url}" download class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center">
          <i class="fas fa-download mr-1"></i> İndir
        </a>
      `;
      
      filesListContainer.appendChild(fileRow);
    });
  }
  
  // Get file extension from URL or path
  function getFileExtension(url) {
    if (!url) return '';
    
    // Extract filename from URL
    const filename = url.split('/').pop();
    
    // Get extension
    const extension = filename.split('.').pop().toLowerCase();
    
    // Return pdf for documents and the actual extension for images
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return extension;
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'unknown';
    }
  }
  
  // Generate PDF file from facility data
  function generatePdfFile(facility) {
    showNotification('PDF dosyası oluşturuluyor...', 'info');
    
    // Get facility ID
    const facilityId = facility._id || facility.id || facility.applicationId;
    
    // Show loading state
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const originalPdfBtnText = downloadPdfBtn.innerHTML;
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Oluşturuluyor...`;
    
    console.log('Generating PDF for facility ID:', facilityId);
    
    // Use fetch instead of direct link to handle errors better
    fetch(`/api/admin/facilities/${facilityId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('PDF response status:', response.status);
      
      if (!response.ok) {
        // Try to get more detailed error information
        return response.text().then(text => {
          try {
            // Try to parse as JSON error response
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || 'Sunucu hatası');
          } catch (parseError) {
            // If not JSON or parsing fails, just throw the status
            throw new Error(`Sunucu hatası (${response.status})`);
          }
        });
      }
      
      // Check if response is a text/plain (our file)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/plain')) {
        // Get file name from content-disposition
        const contentDisposition = response.headers.get('content-disposition');
        const fileName = contentDisposition ? 
          contentDisposition.split('filename=')[1].replace(/"/g, '') : 
          `${facility.facilityName || 'Tesis'}_Bilgileri.txt`;
        
        // Return the blob from response
        return response.blob().then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showNotification('PDF dosyası başarıyla indirildi', 'success');
        });
      } else {
        console.error('Unexpected content type:', contentType);
        throw new Error('Geçersiz yanıt formatı');
      }
    })
    .catch(error => {
      console.error('PDF indirme hatası:', error);
      showNotification(`PDF dosyası oluşturulurken bir hata oluştu: ${error.message}`, 'error');
    })
    .finally(() => {
      // Reset button after a short delay
      setTimeout(() => {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.innerHTML = originalPdfBtnText;
      }, 1000);
    });
  }
  
  // Update facility in table
  function updateFacilityInTable(facilityId, fieldName, value) {
    // Find the facility row in the table
    const facilityRow = document.querySelector(`tr button[data-id="${facilityId}"]`);
    if (facilityRow) {
      const row = facilityRow.closest('tr');
      
      // Update the cell based on field name
      if (fieldName === 'facilityName') {
        const nameCell = row.querySelector('td:first-child .text-sm.font-medium');
        if (nameCell) nameCell.textContent = value;
      } else if (fieldName === 'facilityType') {
        const typeCell = row.querySelector('td:nth-child(2)');
        if (typeCell) typeCell.textContent = value;
      } else if (fieldName === 'city') {
        const cityCell = row.querySelector('td:nth-child(3)');
        if (cityCell) cityCell.textContent = value;
      } else if (fieldName === 'group') {
        const groupCell = row.querySelector('td:nth-child(4)');
        if (groupCell) groupCell.textContent = value;
      } else if (fieldName === 'phone') {
        const phoneCell = row.querySelector('td:nth-child(5)');
        if (phoneCell) phoneCell.textContent = value;
      }
      // Array-type fields won't be shown in the table directly
      
      console.log(`Updated ${fieldName} in table to:`, Array.isArray(value) ? value.join(', ') : value);
    } else {
      console.log(`Facility row not found in table for ID: ${facilityId}`);
    }
  }
  
  // Open upload modal
  function openUploadModal(fieldName, fileType) {
    const modal = document.getElementById('upload-modal');
    const modalTitle = document.getElementById('upload-modal-title');
    const fieldNameInput = document.getElementById('upload-field-name');
    const facilityIdInput = document.getElementById('upload-facility-id');
    const fileTypesHint = document.getElementById('file-types-hint');
    
    // Set modal title based on field name
    switch (fieldName) {
      case 'facilityImage':
        modalTitle.textContent = 'Tesis Fotoğrafı Yükle';
        break;
      case 'facilityLogo':
        modalTitle.textContent = 'Tesis Logosu Yükle';
        break;
      case 'authorizationDocument':
        modalTitle.textContent = 'Yetki Belgesi Yükle';
        break;
      case 'facilityLicense':
        modalTitle.textContent = 'Tesis Ruhsatı Yükle';
        break;
      case 'galleryImage':
        modalTitle.textContent = 'Klinik Fotoğrafı Yükle';
        break;
      default:
        modalTitle.textContent = 'Dosya Yükle';
    }
    
    // Set file type hint
    if (fileType === 'image') {
      fileTypesHint.textContent = 'Desteklenen formatlar: JPG, PNG, GIF';
    } else {
      fileTypesHint.textContent = 'Desteklenen formatlar: PDF, DOC, DOCX';
    }
    
    // Set field inputs
    fieldNameInput.value = fieldName;
    facilityIdInput.value = document.getElementById('facility-id').value;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Reset file input
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
    document.getElementById('selected-file').classList.add('hidden');
    
    // Setup file input change event
    fileInput.removeEventListener('change', handleFileInputChange);
    fileInput.addEventListener('change', handleFileInputChange);
    
    // Setup close button
    const closeBtn = document.getElementById('close-upload-modal');
    closeBtn.removeEventListener('click', closeUploadModal);
    closeBtn.addEventListener('click', closeUploadModal);
    
    // Setup cancel button
    const cancelBtn = document.getElementById('cancel-upload');
    cancelBtn.removeEventListener('click', closeUploadModal);
    cancelBtn.addEventListener('click', closeUploadModal);
    
    // Setup form submission
    const form = document.getElementById('file-upload-form');
    form.removeEventListener('submit', handleFormSubmit);
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // Handle file input change
  function handleFileInputChange() {
    const selectedFile = document.getElementById('selected-file');
    const fileName = document.getElementById('file-name');
    const fileInput = document.getElementById('file-input');
    
    if (fileInput.files && fileInput.files[0]) {
      selectedFile.classList.remove('hidden');
      fileName.textContent = fileInput.files[0].name;
    } else {
      selectedFile.classList.add('hidden');
    }
  }
  
  // Close upload modal
  function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.classList.add('hidden');
  }
  
  // Handle form submit
  function handleFormSubmit(e) {
    e.preventDefault();
    uploadFile();
  }
  
  // Upload file
  function uploadFile() {
    const modal = document.getElementById('upload-modal');
    const fieldName = document.getElementById('upload-field-name').value;
    const facilityId = document.getElementById('upload-facility-id').value;
    const fileInput = document.getElementById('file-input');
    
    if (!fileInput.files || !fileInput.files[0]) {
      showNotification('Lütfen bir dosya seçin.', 'error');
      return;
    }
    
    // Show loading state
    const confirmUploadBtn = document.getElementById('confirm-upload');
    const originalBtnText = confirmUploadBtn.textContent;
    confirmUploadBtn.disabled = true;
    confirmUploadBtn.textContent = 'Yükleniyor...';
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldName', fieldName);
    
    console.log('Uploading file:', { fieldName, facilityId, fileName: file.name, fileType: file.type, fileSize: file.size });
    
    // Record API call for debug
    debugInfo.lastApiCall = `POST /api/admin/facilities/${facilityId}/upload
Headers: { 'Authorization': 'Bearer ${token ? token.substring(0, 15) + '...' : 'none'}' }
FormData: file=${file.name}, fieldName=${fieldName}`;
    
    if (isDebugMode) {
      addDebugLog(`Dosya yükleme işlemi başlatıldı: ${fieldName}, ${file.name}`, 'info');
    }
    
    // Add debug element only if in debug mode
    let debugDiv = null;
    if (isDebugMode) {
      debugDiv = document.createElement('div');
      debugDiv.id = 'upload-debug';
      debugDiv.className = 'mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32';
      debugDiv.textContent = 'Yükleniyor...';
      document.getElementById('file-upload-form').appendChild(debugDiv);
    }
    
    // Upload file via API
    fetch(`/api/admin/facilities/${facilityId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        console.log('Upload response status:', response.status);
        
        if (isDebugMode && debugDiv) {
          debugDiv.textContent += `\nYanıt durumu: ${response.status}`;
          addDebugLog(`Dosya yükleme yanıt durumu: ${response.status}`, 'info');
        }
        
        // Get the raw response as text first
        return response.text().then(text => {
          console.log('Raw response:', text);
          
          if (isDebugMode && debugDiv) {
            debugDiv.textContent += `\nHam yanıt: ${text.substring(0, 150)}...`;
            addDebugLog(`Ham yanıt: ${text.substring(0, 100)}...`, 'info');
          }
          
          try {
            // Try to parse as JSON
            return { isJson: true, data: JSON.parse(text), raw: text };
          } catch (error) {
            // Return the raw text if it's not JSON
            return { isJson: false, data: null, raw: text };
          }
        });
      })
      .then(({ isJson, data, raw }) => {
        if (!isJson) {
          console.error('Non-JSON response received:', raw);
          
          if (isDebugMode && debugDiv) {
            debugDiv.textContent += `\nJSON olmayan yanıt alındı. HTML yanıt olabilir.`;
          }
          
          showNotification(`Sunucu geçersiz bir yanıt döndürdü. Konsol ve debug paneline bakın.`, 'error');
          
          debugInfo.lastError = `Non-JSON response: ${raw.substring(0, 200)}`;
          
          if (isDebugMode) {
            addDebugLog('JSON olmayan yanıt alındı. HTML yanıt olabilir.', 'error');
            showDebugConsole();
          }
          
          throw new Error('Sunucu beklenmeyen bir yanıt döndürdü.');
        }
        
        console.log('Upload result:', data);
        
        if (data.success) {
          // Close modal
          modal.classList.add('hidden');
          
          // Reload facility to show updated files
          const facility = facilities.find(f => f._id === facilityId || f.id === facilityId || f.applicationId === facilityId);
          if (facility) {
            // Update the facility object with new file
            if (fieldName === 'galleryImage') {
              // Add to gallery images array
              if (!facility.galleryImages) {
                facility.galleryImages = [];
              }
              facility.galleryImages.push(data.filePath);
            } else {
              facility[fieldName] = data.filePath;
            }
            
            // Refresh facility details display - instead of calling showFacilityDetails which can create new event listeners
            // we'll update just the affected elements
            updateFacilityDisplayAfterUpload(facility, fieldName, data.filePath);
          }
          
          // Show success message
          showNotification('Dosya başarıyla yüklendi', 'success');
          
          if (isDebugMode) {
            addDebugLog(`Dosya başarıyla yüklendi: ${data.filePath}`, 'success');
          }
        } else {
          showNotification(`Dosya yüklenirken bir hata oluştu: ${data.message || 'Bilinmeyen hata'}`, 'error');
          
          debugInfo.lastError = `API error: ${data.message}`;
          
          if (isDebugMode) {
            addDebugLog(`Dosya yükleme hatası: ${data.message}`, 'error');
            showDebugConsole();
          }
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        
        if (isDebugMode && debugDiv) {
          debugDiv.textContent += `\nHata: ${error.message}`;
        }
        
        showNotification(`Dosya yüklenirken bir hata oluştu: ${error.message}`, 'error');
        
        debugInfo.lastError = error.toString();
        
        if (isDebugMode) {
          addDebugLog(`Dosya yükleme hatası: ${error.message}`, 'error');
          showDebugConsole();
        }
      })
      .finally(() => {
        // Reset button
        confirmUploadBtn.disabled = false;
        confirmUploadBtn.textContent = originalBtnText;
        
        // Remove debug div if it exists and we're not in debug mode
        if (!isDebugMode) {
          const existingDebugDiv = document.getElementById('upload-debug');
          if (existingDebugDiv && existingDebugDiv.parentNode) {
            existingDebugDiv.parentNode.removeChild(existingDebugDiv);
          }
        }
      });
  }

  // Update only affected elements after file upload instead of refreshing entire modal
  function updateFacilityDisplayAfterUpload(facility, fieldName, filePath) {
    switch(fieldName) {
      case 'facilityImage':
        const facilityImage = document.getElementById('facility-image');
        const noFacilityImageIcon = document.getElementById('no-facility-image-icon');
        const downloadFacilityImage = document.getElementById('download-facility-image');
        const noFacilityImage = document.getElementById('no-facility-image');
        
        facilityImage.src = filePath;
        facilityImage.alt = facility.facilityName || 'Tesis Fotoğrafı';
        facilityImage.classList.remove('hidden');
        noFacilityImageIcon.classList.add('hidden');
        downloadFacilityImage.href = filePath;
        downloadFacilityImage.classList.remove('hidden');
        noFacilityImage.classList.add('hidden');
        break;
        
      case 'facilityLogo':
        const logoImage = document.getElementById('logo-image');
        const facilityLogo = document.getElementById('facility-logo');
        const noLogoIcon = document.getElementById('no-logo-icon');
        const noLogoModalIcon = document.getElementById('no-logo-modal-icon');
        const downloadLogo = document.getElementById('download-logo');
        const noLogo = document.getElementById('no-logo');
        
        logoImage.src = filePath;
        logoImage.alt = 'Tesis Logosu';
        logoImage.classList.remove('hidden');
        noLogoIcon.classList.add('hidden');
        downloadLogo.href = filePath;
        downloadLogo.classList.remove('hidden');
        noLogo.classList.add('hidden');
        
        facilityLogo.src = filePath;
        facilityLogo.alt = facility.facilityName || 'Tesis Logosu';
        facilityLogo.classList.remove('hidden');
        noLogoModalIcon.classList.add('hidden');
        break;
        
      case 'authorizationDocument':
        const authDocContent = document.getElementById('auth-doc-content');
        const noAuthDocIcon = document.getElementById('no-auth-doc-icon');
        const downloadAuthDoc = document.getElementById('download-auth-doc');
        const noAuthDoc = document.getElementById('no-auth-doc');
        
        authDocContent.classList.remove('hidden');
        noAuthDocIcon.classList.add('hidden');
        downloadAuthDoc.href = filePath;
        downloadAuthDoc.classList.remove('hidden');
        noAuthDoc.classList.add('hidden');
        break;
        
      case 'facilityLicense':
        const licenseContent = document.getElementById('license-content');
        const noLicenseIcon = document.getElementById('no-license-icon');
        const downloadLicense = document.getElementById('download-license');
        const noLicense = document.getElementById('no-license');
        
        licenseContent.classList.remove('hidden');
        noLicenseIcon.classList.add('hidden');
        downloadLicense.href = filePath;
        downloadLicense.classList.remove('hidden');
        noLicense.classList.add('hidden');
        break;
        
      case 'galleryImage':
        const galleryContainer = document.getElementById('gallery-container');
        const noGallery = document.getElementById('no-gallery');
        
        noGallery.classList.add('hidden');
        
        const imgContainer = document.createElement('div');
        imgContainer.className = 'bg-gray-100 rounded-lg overflow-hidden h-40 flex items-center justify-center';
        
        const img = document.createElement('img');
        img.src = filePath;
        img.alt = 'Klinik Görüntüsü';
        img.className = 'max-h-full object-contain';
        
        imgContainer.appendChild(img);
        galleryContainer.appendChild(imgContainer);
        
        // Also update files list in downloads tab
        populateFilesList(facility);
        break;
    }
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notifyContainer = document.getElementById('notification-container');
    if (!notifyContainer) {
      notifyContainer = document.createElement('div');
      notifyContainer.id = 'notification-container';
      notifyContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-md';
      document.body.appendChild(notifyContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `p-3 rounded-lg shadow-md flex items-start justify-between transition-all duration-300 transform translate-x-full opacity-0 ${
      type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-600' : 
      type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-600' : 
      'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
    }`;
    
    // Icon based on type
    const iconClass = type === 'error' ? 'fas fa-exclamation-circle text-red-600' : 
                     type === 'success' ? 'fas fa-check-circle text-green-600' : 
                     'fas fa-info-circle text-blue-600';
    
    notification.innerHTML = `
      <div class="flex items-start">
        <i class="${iconClass} mr-2 mt-1"></i>
        <div class="text-sm overflow-auto max-h-32">${message}</div>
      </div>
      <button class="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add notification to container
    notifyContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Add click handler to close button
    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => {
      closeNotification(notification);
    });
    
    // Auto close after 10 seconds for non-error messages, 20 seconds for errors
    setTimeout(() => {
      closeNotification(notification);
    }, type === 'error' ? 20000 : 10000);
  }
  
  // Close notification
  function closeNotification(notification) {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
  
  // Update facility field
  async function updateFacilityField(facilityId, fieldName, value) {
    try {
      console.log('Calling API to update field:', { facilityId, fieldName, value });
      
      // Record API call for debug
      debugInfo.lastApiCall = `PATCH /api/admin/facilities/${facilityId}/field
Headers: ${JSON.stringify({ 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}, null, 2)}
Body: ${JSON.stringify({ fieldName, value }, null, 2)}`;
      
      if (isDebugMode) {
        addDebugLog(`Alan güncelleme API çağrısı yapılıyor: ${fieldName}`, 'info');
      }
      
      const response = await fetch(`/api/admin/facilities/${facilityId}/field`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fieldName, value })
      });
      
      console.log('Update field response status:', response.status);
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (isDebugMode) {
        addDebugLog(`Yanıt durumu: ${response.status}`, 'info');
        addDebugLog(`Ham yanıt: ${responseText.substring(0, 100)}...`, 'info');
      }
      
      let result;
      try {
        // Try to parse as JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        // Show the raw response in an error notification with formatting
        showNotification(`Response is not valid JSON. Raw response: <br><pre>${responseText.substring(0, 200)}...</pre>`, 'error');
        
        debugInfo.lastError = `JSON parse error: ${parseError.message}\nRaw response: ${responseText.substring(0, 200)}`;
        
        if (isDebugMode) {
          addDebugLog(`JSON parse hatası: ${parseError.message}`, 'error');
          showDebugConsole();
        }
        
        throw new Error('Sunucu geçersiz bir yanıt döndürdü. Detaylar konsol ve bildirimde.');
      }
      
      console.log('Update field result:', result);
      
      if (result.success) {
        // Show success notification
        showNotification('Alan başarıyla güncellendi', 'success');
        
        if (isDebugMode) {
          addDebugLog(`Alan güncelleme başarılı: ${fieldName}`, 'success');
        }
        
        return result;
      } else {
        console.error('Failed to update field:', result.message);
        showNotification(`Alan güncellenirken hata: ${result.message}`, 'error');
        
        debugInfo.lastError = `API error: ${result.message}`;
        
        if (isDebugMode) {
          addDebugLog(`Alan güncelleme hatası: ${result.message}`, 'error');
          showDebugConsole();
        }
        
        throw new Error(result.message || 'Sunucu hatası');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      showNotification(`Alan güncellenirken hata: ${error.message}`, 'error');
      
      debugInfo.lastError = error.toString();
      
      if (isDebugMode) {
        addDebugLog(`Alan güncelleme hatası: ${error.message}`, 'error');
        showDebugConsole();
      }
      
      throw error;
    }
  }

  // Add debug button to DOM
  function setupDebugTools() {
    // Create and append debug button
    const debugBtnContainer = document.createElement('div');
    debugBtnContainer.className = 'fixed bottom-4 right-4 z-50';
    
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debug-btn';
    debugBtn.className = 'bg-gray-800 text-white p-2 rounded shadow-lg hover:bg-gray-700 flex items-center';
    debugBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
    </svg> ${isDebugMode ? 'Debug Açık' : 'Debug'}`;
    debugBtn.title = "Debug modu aç/kapat";
    
    debugBtnContainer.appendChild(debugBtn);
    document.body.appendChild(debugBtnContainer);
    
    // Toggle debug mode
    debugBtn.addEventListener('click', function() {
      isDebugMode = !isDebugMode;
      localStorage.setItem('adminDebugMode', isDebugMode);
      debugBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
      </svg> ${isDebugMode ? 'Debug Açık' : 'Debug'}`;
      
      showNotification(`Debug modu ${isDebugMode ? 'açıldı' : 'kapatıldı'}`, 'info');
      
      // If debug mode is enabled, show the debug console
      if (isDebugMode) {
        showDebugConsole();
      }
    });
    
    // Create and append debug modal
    const debugModal = document.createElement('div');
    debugModal.id = 'debug-modal';
    debugModal.className = 'fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 hidden';
    
    debugModal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-screen overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium">Debug Konsolu</h3>
          <button id="close-debug-modal" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="flex flex-col md:flex-row h-full overflow-hidden">
          <div class="w-full md:w-1/3 p-4 overflow-y-auto">
            <h4 class="font-medium text-gray-700 mb-2">Son API Çağrısı</h4>
            <pre id="debug-last-call" class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32"></pre>
            
            <h4 class="font-medium text-gray-700 mt-4 mb-2">Token</h4>
            <pre id="debug-token" class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32"></pre>
            
            <h4 class="font-medium text-gray-700 mt-4 mb-2">Son Hata</h4>
            <pre id="debug-last-error" class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32"></pre>
            
            <div class="mt-4">
              <button id="clear-debug-logs" class="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200">Logları Temizle</button>
              <button id="test-auth" class="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 ml-2">Auth Test</button>
            </div>
          </div>
          <div class="w-full md:w-2/3 p-4 overflow-hidden flex flex-col">
            <h4 class="font-medium text-gray-700 mb-2">Log</h4>
            <div id="debug-logs" class="bg-gray-100 p-3 rounded text-xs font-mono overflow-y-auto flex-grow"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(debugModal);
    
    // Close debug modal
    document.getElementById('close-debug-modal').addEventListener('click', function() {
      debugModal.classList.add('hidden');
    });
    
    // Clear debug logs
    document.getElementById('clear-debug-logs').addEventListener('click', function() {
      debugInfo.logs = [];
      updateDebugConsole();
    });
    
    // Test authentication
    document.getElementById('test-auth').addEventListener('click', function() {
      testAuthentication();
    });
  }
  
  // Update debug console with current values
  function updateDebugConsole() {
    const lastCallEl = document.getElementById('debug-last-call');
    const lastErrorEl = document.getElementById('debug-last-error');
    const logsEl = document.getElementById('debug-logs');
    const tokenEl = document.getElementById('debug-token');
    
    if (lastCallEl) lastCallEl.textContent = debugInfo.lastApiCall || 'Henüz API çağrısı yapılmadı';
    if (lastErrorEl) lastErrorEl.textContent = debugInfo.lastError || 'Henüz hata oluşmadı';
    if (tokenEl) tokenEl.textContent = token ? `${token.substring(0, 15)}...` : 'Token yok';
    
    if (logsEl) {
      logsEl.innerHTML = '';
      debugInfo.logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = `mb-2 pb-2 border-b border-gray-200 ${
          log.type === 'error' ? 'text-red-600' : 
          log.type === 'success' ? 'text-green-600' : 
          log.type === 'warning' ? 'text-yellow-600' : 'text-gray-800'
        }`;
        
        const time = new Date(log.timestamp).toLocaleTimeString('tr-TR');
        logEntry.innerHTML = `<span class="text-gray-500">${time}</span> ${log.message}`;
        logsEl.appendChild(logEntry);
      });
      
      // Scroll to bottom
      logsEl.scrollTop = logsEl.scrollHeight;
    }
  }
  
  // Show debug console
  function showDebugConsole() {
    const debugModal = document.getElementById('debug-modal');
    if (debugModal) {
      debugModal.classList.remove('hidden');
      updateDebugConsole();
    }
  }
  
  // Add to debug log
  function addDebugLog(message, type = 'info') {
    const logEntry = {
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    debugInfo.logs.unshift(logEntry);
    
    // Keep only the last 100 logs
    if (debugInfo.logs.length > 100) {
      debugInfo.logs.pop();
    }
    
    // If debug modal is open, update it
    const debugModal = document.getElementById('debug-modal');
    if (!debugModal.classList.contains('hidden')) {
      updateDebugConsole();
    }
    
    // Log to console as well
    if (type === 'error') {
      console.error(message);
    } else if (type === 'warning') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
  
  // Test authentication with the server
  async function testAuthentication() {
    addDebugLog('Token doğrulaması test ediliyor...', 'info');
    
    try {
      const response = await fetch('/api/admin/facilities', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      debugInfo.lastApiCall = `GET /api/admin/facilities
Headers: ${JSON.stringify({ 'Authorization': `Bearer ${token}` }, null, 2)}`;
      
      const responseText = await response.text();
      
      try {
        // Try to parse as JSON
        const result = JSON.parse(responseText);
        
        if (response.ok) {
          addDebugLog(`Auth Test: Başarılı (status: ${response.status})`, 'success');
          addDebugLog(`Dönen cevap: ${JSON.stringify(result).substring(0, 100)}...`, 'info');
        } else {
          addDebugLog(`Auth Test: Başarısız (status: ${response.status}) - ${result.message || 'Bilinmeyen hata'}`, 'error');
        }
      } catch (jsonError) {
        // Not a JSON response
        addDebugLog(`Auth Test: JSON olmayan yanıt (status: ${response.status})`, 'error');
        addDebugLog(`Raw response: ${responseText.substring(0, 100)}...`, 'error');
      }
    } catch (error) {
      debugInfo.lastError = error.toString();
      addDebugLog(`Auth Test: Hata - ${error.message}`, 'error');
    }
    
    updateDebugConsole();
  }
  
  // Update the dashboard counters with facility statistics
  function updateCounters(facilities) {
    if (!totalCountEl || !pendingCountEl || !approvedCountEl || !rejectedCountEl) {
      console.warn('Counter elements not found in DOM');
      return;
    }
    
    if (!Array.isArray(facilities)) {
      console.error('Invalid facilities data for updateCounters:', facilities);
      return;
    }
    
    // Calculate counts
    const total = facilities.length;
    const pending = facilities.filter(f => f.status === 'Bekliyor').length;
    const approved = facilities.filter(f => f.status === 'Onaylandı').length;
    const rejected = facilities.filter(f => f.status === 'İptal Edildi').length;
    
    // Update elements
    totalCountEl.textContent = total;
    pendingCountEl.textContent = pending;
    approvedCountEl.textContent = approved;
    rejectedCountEl.textContent = rejected;
    
    // Apply highlight class if count > 0
    totalCountEl.classList.toggle('highlight', total > 0);
    pendingCountEl.classList.toggle('highlight', pending > 0);
    approvedCountEl.classList.toggle('highlight', approved > 0);
    rejectedCountEl.classList.toggle('highlight', rejected > 0);
  }
  
  // Create status badge HTML with appropriate styling
  function createStatusBadge(status) {
    let badgeClass = '';
    let textColor = '';
    
    switch (status) {
      case 'Bekliyor':
        badgeClass = 'bg-yellow-100 border-yellow-400';
        textColor = 'text-yellow-800';
        break;
      case 'Onaylandı':
        badgeClass = 'bg-green-100 border-green-400';
        textColor = 'text-green-800';
        break;
      case 'İptal Edildi':
        badgeClass = 'bg-red-100 border-red-400';
        textColor = 'text-red-800';
        break;
      case 'Tamamlandı':
        badgeClass = 'bg-blue-100 border-blue-400';
        textColor = 'text-blue-800';
        break;
      case 'Belge Bekleniyor':
        badgeClass = 'bg-purple-100 border-purple-400';
        textColor = 'text-purple-800';
        break;
      case 'Bakanlıkta':
        badgeClass = 'bg-indigo-100 border-indigo-400';
        textColor = 'text-indigo-800';
        break;
      default:
        badgeClass = 'bg-gray-100 border-gray-400';
        textColor = 'text-gray-800';
    }
    
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${badgeClass} ${textColor}">
      ${status}
    </span>`;
  }
  
  // Setup tabs in the facility details modal
  function setupTabs() {
    console.log('Setting up tabs');
    const tabIds = ['tab-info', 'tab-documents', 'tab-status', 'tab-notes', 'tab-downloads'];
    const tabButtons = tabIds.map(id => document.getElementById(id));
    const tabContents = document.querySelectorAll('.tab-pane');
    
    if (!tabButtons.filter(Boolean).length || !tabContents.length) {
      console.error('Tab buttons or tab contents not found');
      return;
    }
    
    console.log(`Found ${tabButtons.filter(Boolean).length} tab buttons and ${tabContents.length} tab panes`);
    
    // First, hide all tab contents
    tabContents.forEach(content => {
      content.classList.add('hidden');
    });
    
    // Loop through each button and add event listeners
    tabButtons.forEach(button => {
      if (!button) return;
      
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => {
          if (!btn) return;
          btn.classList.remove('active-tab', 'text-blue-500', 'border-blue-500');
          btn.classList.add('text-gray-500');
        });
        
        // Add active class to clicked button
        button.classList.remove('text-gray-500');
        button.classList.add('active-tab', 'text-blue-500', 'border-blue-500');
        
        // Hide all tab contents
        tabContents.forEach(content => {
          content.classList.add('hidden');
        });
        
        // Show the selected tab content
        const tabId = button.id.replace('tab-', 'content-');
        const tabContent = document.getElementById(tabId);
        
        if (tabContent) {
          tabContent.classList.remove('hidden');
          console.log(`Activated tab: ${tabId}`);
        } else {
          console.error(`Tab content not found for id: ${tabId}`);
        }
      });
    });
    
    // Activate first tab by default
    if (tabButtons[0]) {
      tabButtons[0].click();
    }
  }
  
  // Setup edit buttons in the facility details modal
  function setupEditButtons() {
    console.log('Setting up edit buttons');
    const editButtons = document.querySelectorAll('.edit-facility-field');
    
    if (!editButtons.length) {
      console.warn('No edit buttons found in the DOM');
      return;
    }
    
    console.log(`Found ${editButtons.length} edit buttons`);
    
    editButtons.forEach(button => {
      // Remove any existing event listeners
      button.removeEventListener('click', handleEditButtonClick);
      // Add new event listener
      button.addEventListener('click', handleEditButtonClick);
    });
  }
  
  // Handler for edit button clicks
  function handleEditButtonClick() {
    const fieldName = this.getAttribute('data-field');
    const facilityId = document.getElementById('facility-id').value;
    const displayElement = document.getElementById(`display-${fieldName}`);
    const editElement = document.getElementById(`edit-${fieldName}`);
    
    console.log(`Edit button clicked for field: ${fieldName}`);
    
    if (!displayElement || !editElement) {
      console.error(`Display or edit elements not found for field: ${fieldName}`);
      return;
    }
    
    // Hide display, show edit
    displayElement.classList.add('hidden');
    editElement.classList.remove('hidden');
    
    // Focus on input
    const input = editElement.querySelector('input, textarea, select');
    if (input) {
      input.focus();
    }
    
    // Add cancel and save buttons if they don't exist
    if (!editElement.querySelector('.edit-actions')) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'edit-actions flex mt-2 space-x-2';
      actionsDiv.innerHTML = `
        <button class="cancel-edit px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
          İptal
        </button>
        <button class="save-edit px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
          Kaydet
        </button>
      `;
      editElement.appendChild(actionsDiv);
      
      // Add event listeners to new buttons
      const cancelBtn = actionsDiv.querySelector('.cancel-edit');
      const saveBtn = actionsDiv.querySelector('.save-edit');
      
      cancelBtn.addEventListener('click', function() {
        // Hide edit, show display
        editElement.classList.add('hidden');
        displayElement.classList.remove('hidden');
      });
      
      saveBtn.addEventListener('click', function() {
        const input = editElement.querySelector('input, textarea, select');
        if (!input) return;
        
        let newValue = input.value;
        
        // Check if this is an array field by seeing if the input has a data-array attribute
        // or if the value contains commas and has a "Virgülle ayırarak giriniz" placeholder
        const isArrayInput = input.placeholder === 'Virgülle ayırarak giriniz' || input.type === 'text';
        
        // Get the input type from the element
        const inputType = input.type || 'text';
        
        // Handle special cases for different input types
        if (isArrayInput && input.value.includes(',')) {
          // Parse comma-separated values into an array
          newValue = input.value.split(',').map(item => item.trim()).filter(item => item !== '');
        } else if (inputType === 'number') {
          // Convert number input to actual number
          newValue = input.value === '' ? null : Number(input.value);
        }
        
        // Update the field via API
        updateFacilityField(facilityId, fieldName, newValue)
          .then(result => {
            if (result && result.success) {
              // Update display value based on value type
              if (Array.isArray(newValue)) {
                displayElement.querySelector(`#${fieldName}-display`).textContent = newValue.join(', ') || 'Belirtilmemiş';
              } else {
                displayElement.querySelector(`#${fieldName}-display`).textContent = newValue || 'Belirtilmemiş';
              }
              
              if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
                displayElement.querySelector(`#${fieldName}-display`).classList.add('text-gray-500');
              } else {
                displayElement.querySelector(`#${fieldName}-display`).classList.remove('text-gray-500');
              }
              
              // Update in facilities array
              const facilityIndex = facilities.findIndex(f => 
                f._id === facilityId || 
                f.id === facilityId || 
                f.applicationId === facilityId
              );
              
              if (facilityIndex !== -1) {
                facilities[facilityIndex][fieldName] = newValue;
              }
              
              // Update in table if visible
              updateFacilityInTable(facilityId, fieldName, newValue);
            }
            
            // Hide edit, show display
            editElement.classList.add('hidden');
            displayElement.classList.remove('hidden');
          })
          .catch(error => {
            console.error('Error updating field:', error);
            showNotification(`Alan güncellenirken hata: ${error.message}`, 'error');
          });
      });
    }
  }
  
  // Render facility details in the modal
  function renderFacilityDetails(facility) {
    console.log('Rendering facility details:', facility.facilityName);
    
    if (!facility) {
      console.error('No facility data provided to renderFacilityDetails');
      return;
    }
    
    // Get the facility details container
    const facilityDetailsContainer = document.getElementById('facility-details-container');
    if (!facilityDetailsContainer) {
      console.error('Facility details container not found');
      return;
    }
    
    // Clear the container
    facilityDetailsContainer.innerHTML = '';

    // Create sections for different groups of data
    const sections = [
      {
        title: 'Temel Bilgiler',
        id: 'basic-info',
        fields: [
          { key: 'facilityName', label: 'Tesis Adı', type: 'text' },
          { key: 'facilityTitle', label: 'Tesis Ünvanı', type: 'text' },
          { key: 'ckyscode', label: 'ÇKYS Kodu', type: 'text' },
          { key: 'facilityType', label: 'Tesis Tipi', type: 'text' },
          { key: 'institutionType', label: 'Kurum Tipi', type: 'select', options: ['Kamu', 'Özel', 'Üniversite'] },
          { key: 'group', label: 'Grup', type: 'text' }
        ]
      },
      {
        title: 'Konum Bilgileri',
        id: 'location-info',
        fields: [
          { key: 'city', label: 'Şehir', type: 'text' },
          { key: 'district', label: 'İlçe', type: 'text' },
          { key: 'address', label: 'Adres', type: 'textarea' }
        ]
      },
      {
        title: 'İletişim Bilgileri',
        id: 'contact-info',
        fields: [
          { key: 'email', label: 'E-posta', type: 'email' },
          { key: 'phone', label: 'Telefon', type: 'tel' },
          { key: 'authorizedPhone', label: 'Yetkili Telefon', type: 'tel' },
          { key: 'website', label: 'Web Sitesi', type: 'url' }
        ]
      },
      {
        title: 'Kurum Bilgileri',
        id: 'institution-info',
        fields: [
          { key: 'foundationYear', label: 'Kuruluş Yılı', type: 'number' },
          { key: 'staffCount', label: 'Personel Sayısı', type: 'number' },
          { key: 'authorizationNumber', label: 'Ruhsat Numarası', type: 'text' }
        ]
      },
      {
        title: 'Tıbbi Hizmetler',
        id: 'medical-services',
        fields: [
          { key: 'medicalBranches', label: 'Tıbbi Branşlar', type: 'array' },
          { key: 'specializedTreatments', label: 'Özellikli Tedaviler', type: 'array' },
          { key: 'services', label: 'Sağlık Hizmetleri', type: 'array' }
        ]
      },
      {
        title: 'Tesis Olanakları',
        id: 'facility-amenities',
        fields: [
          { key: 'facilityAmenities', label: 'Tesis Olanakları', type: 'array' },
          { key: 'supportServices', label: 'Destek Hizmetleri', type: 'array' },
          { key: 'paymentMethods', label: 'Ödeme Yöntemleri', type: 'array' },
          { key: 'serviceLanguages', label: 'Hizmet Dilleri', type: 'array' }
        ]
      },
      {
        title: 'Diğer Bilgiler',
        id: 'other-info',
        fields: [
          { key: 'createdAt', label: 'Oluşturulma Tarihi', type: 'date', readonly: true },
          { key: 'status', label: 'Durum', type: 'text', readonly: true }
        ]
      }
    ];
    
    // Create each section
    sections.forEach(section => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'mb-6';
      sectionElement.id = `section-${section.id}`;
      
      // Add section title with edit button
      const titleContainer = document.createElement('div');
      titleContainer.className = 'flex justify-between items-center mb-4 pb-1 border-b';
      
      const titleElement = document.createElement('h3');
      titleElement.className = 'text-lg font-medium text-gray-900';
      titleElement.textContent = section.title;
      
      titleContainer.appendChild(titleElement);
      
      // Don't add edit button to sections with readonly fields
      const hasEditableFields = section.fields.some(field => !field.readonly);
      
      if (hasEditableFields) {
        const editButton = document.createElement('button');
        editButton.className = 'edit-section-button text-gray-400 hover:text-blue-600 focus:outline-none transition-colors';
        editButton.setAttribute('data-section', section.id);
        editButton.innerHTML = '<i class="fas fa-edit"></i> <span class="text-sm">Düzenle</span>';
        editButton.addEventListener('click', function() {
          toggleSectionEditMode(section.id, facility);
        });
        
        titleContainer.appendChild(editButton);
      }
      
      sectionElement.appendChild(titleContainer);
      
      // Create display container for section (visible by default)
      const displayContainer = document.createElement('div');
      displayContainer.id = `${section.id}-display`;
      displayContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4';
      
      // Create edit container for section (hidden by default)
      const editContainer = document.createElement('div');
      editContainer.id = `${section.id}-edit`;
      editContainer.className = 'hidden grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4';
      
      // Add fields to containers
      section.fields.forEach(field => {
        // Create display field
        const displayField = document.createElement('div');
        displayField.className = field.type === 'textarea' || field.type === 'array' ? 'md:col-span-2' : '';
        
        const fieldLabel = document.createElement('p');
        fieldLabel.className = 'text-sm font-medium text-gray-700 mb-1';
        fieldLabel.textContent = field.label;
        
        const fieldValue = document.createElement('p');
        fieldValue.id = `${field.key}-display`;
        fieldValue.className = 'text-sm text-gray-900';
        
        // Set the display value
        if (field.type === 'array') {
          if (facility[field.key] && Array.isArray(facility[field.key]) && facility[field.key].length > 0) {
            fieldValue.textContent = facility[field.key].join(', ');
          } else {
            fieldValue.textContent = 'Belirtilmemiş';
            fieldValue.className += ' text-gray-500';
          }
        } else if (field.type === 'date' && facility[field.key]) {
          try {
            const date = new Date(facility[field.key]);
            fieldValue.textContent = date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
          } catch (error) {
            fieldValue.textContent = facility[field.key] || 'Belirtilmemiş';
          }
        } else {
          fieldValue.textContent = facility[field.key] || 'Belirtilmemiş';
          if (!facility[field.key]) {
            fieldValue.className += ' text-gray-500';
          }
        }
        
        displayField.appendChild(fieldLabel);
        displayField.appendChild(fieldValue);
        displayContainer.appendChild(displayField);
        
        // Create edit field (only if not readonly)
        if (!field.readonly) {
          const editField = document.createElement('div');
          editField.className = field.type === 'textarea' || field.type === 'array' ? 'md:col-span-2' : '';
          
          const editLabel = document.createElement('label');
          editLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
          editLabel.setAttribute('for', `${field.key}-input`);
          editLabel.textContent = field.label;
          
          // Create appropriate input element based on field type
          let inputElement;
          
          if (field.type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.rows = 3;
            inputElement.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
            inputElement.value = facility[field.key] || '';
          } else if (field.type === 'select') {
            inputElement = document.createElement('select');
            inputElement.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Seçiniz...';
            inputElement.appendChild(emptyOption);
            
            // Add options
            field.options.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option;
              optionElement.textContent = option;
              if (facility[field.key] === option) {
                optionElement.selected = true;
              }
              inputElement.appendChild(optionElement);
            });
          } else if (field.type === 'array') {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
            inputElement.placeholder = 'Virgülle ayırarak giriniz';
            
            if (facility[field.key] && Array.isArray(facility[field.key])) {
              inputElement.value = facility[field.key].join(', ');
            }
          } else {
            inputElement = document.createElement('input');
            inputElement.type = field.type;
            inputElement.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
            inputElement.value = facility[field.key] || '';
          }
          
          inputElement.id = `${field.key}-input`;
          inputElement.name = field.key;
          inputElement.setAttribute('data-original-value', inputElement.value);
          
          editField.appendChild(editLabel);
          editField.appendChild(inputElement);
          editContainer.appendChild(editField);
        }
      });
      
      // Add action buttons for edit mode if there are editable fields
      if (hasEditableFields) {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex justify-end mt-4 md:col-span-2 space-x-3';
        actionButtons.innerHTML = `
          <button class="cancel-edit px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            İptal
          </button>
          <button class="save-edit px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Kaydet
          </button>
        `;
        
        // Add event listeners to action buttons
        const cancelButton = actionButtons.querySelector('.cancel-edit');
        cancelButton.addEventListener('click', function() {
          toggleSectionEditMode(section.id, facility);
        });
        
        const saveButton = actionButtons.querySelector('.save-edit');
        saveButton.addEventListener('click', function() {
          saveSectionChanges(section.id, facility);
        });
        
        editContainer.appendChild(actionButtons);
      }
      
      sectionElement.appendChild(displayContainer);
      sectionElement.appendChild(editContainer);
      facilityDetailsContainer.appendChild(sectionElement);
    });
    
    // Update special links
    const websiteLinkElement = document.getElementById('website-link');
    if (websiteLinkElement && facility.website) {
      websiteLinkElement.href = facility.website.startsWith('http') ? facility.website : 'https://' + facility.website;
      websiteLinkElement.classList.remove('hidden');
    } else if (websiteLinkElement) {
      websiteLinkElement.classList.add('hidden');
    }
    
    // Handle email link
    const emailLinkElement = document.getElementById('email-link');
    if (emailLinkElement && facility.email) {
      emailLinkElement.href = 'mailto:' + facility.email;
      emailLinkElement.classList.remove('hidden');
    } else if (emailLinkElement) {
      emailLinkElement.classList.add('hidden');
    }
    
    // Handle phone link
    const phoneLinkElement = document.getElementById('phone-link');
    if (phoneLinkElement && facility.phone) {
      phoneLinkElement.href = 'tel:' + facility.phone;
      phoneLinkElement.classList.remove('hidden');
    } else if (phoneLinkElement) {
      phoneLinkElement.classList.add('hidden');
    }
    
    console.log('Facility details rendering completed');
  }
  
  // Toggle section edit mode
  function toggleSectionEditMode(sectionId, facility) {
    const displayContainer = document.getElementById(`${sectionId}-display`);
    const editContainer = document.getElementById(`${sectionId}-edit`);
    
    if (!displayContainer || !editContainer) {
      console.error(`Display or edit container not found for section: ${sectionId}`);
      return;
    }
    
    if (displayContainer.classList.contains('hidden')) {
      // Switch to display mode
      displayContainer.classList.remove('hidden');
      editContainer.classList.add('hidden');
      
      // Update edit button text
      const editButton = document.querySelector(`button[data-section="${sectionId}"]`);
      if (editButton) {
        editButton.innerHTML = '<i class="fas fa-edit"></i> <span class="text-sm">Düzenle</span>';
        editButton.classList.remove('text-blue-600');
        editButton.classList.add('text-gray-400');
      }
    } else {
      // Switch to edit mode
      displayContainer.classList.add('hidden');
      editContainer.classList.remove('hidden');
      
      // Update edit button text
      const editButton = document.querySelector(`button[data-section="${sectionId}"]`);
      if (editButton) {
        editButton.innerHTML = '<i class="fas fa-edit"></i> <span class="text-sm">Düzenleniyor</span>';
        editButton.classList.remove('text-gray-400');
        editButton.classList.add('text-blue-600');
      }
      
      // Focus on first input
      const firstInput = editContainer.querySelector('input, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }
  
  // Save section changes
  async function saveSectionChanges(sectionId, facility) {
    const facilityId = document.getElementById('facility-id').value;
    const editContainer = document.getElementById(`${sectionId}-edit`);
    const inputs = editContainer.querySelectorAll('input, textarea, select');
    
    // Create an array to track all update promises
    const updatePromises = [];
    
    // Show loading indication
    const saveButton = editContainer.querySelector('.save-edit');
    const originalSaveText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Kaydediliyor...';
    
    // Process each input
    inputs.forEach(input => {
      if (!input.name) return; // Skip if input has no name
      
      let newValue = input.value;
      const originalValue = input.getAttribute('data-original-value');
      
      // Skip if value hasn't changed
      if (newValue === originalValue) return;
      
      // Process different input types
      const inputType = input.type;
      if (input.placeholder === 'Virgülle ayırarak giriniz' && input.value.includes(',')) {
        // Convert comma-separated text to array
        newValue = input.value.split(',').map(item => item.trim()).filter(item => item !== '');
      } else if (inputType === 'number') {
        // Convert number input to actual number
        newValue = input.value === '' ? null : Number(input.value);
      }
      
      // Add promise to update this field
      updatePromises.push(
        updateFacilityField(facilityId, input.name, newValue)
          .then(result => {
            if (result && result.success) {
              // Update display value
              const displayElement = document.getElementById(`${input.name}-display`);
              if (displayElement) {
                if (Array.isArray(newValue)) {
                  displayElement.textContent = newValue.join(', ') || 'Belirtilmemiş';
                } else {
                  displayElement.textContent = newValue || 'Belirtilmemiş';
                }
                
                if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
                  displayElement.classList.add('text-gray-500');
                } else {
                  displayElement.classList.remove('text-gray-500');
                }
              }
              
              // Update in facilities array
              const facilityIndex = facilities.findIndex(f => 
                f._id === facilityId || 
                f.id === facilityId || 
                f.applicationId === facilityId
              );
              
              if (facilityIndex !== -1) {
                facilities[facilityIndex][input.name] = newValue;
              }
              
              // Update in table if visible
              updateFacilityInTable(facilityId, input.name, newValue);
              
              // Update original value attribute
              if (Array.isArray(newValue)) {
                input.setAttribute('data-original-value', newValue.join(', '));
              } else {
                input.setAttribute('data-original-value', newValue || '');
              }
              
              return true;
            }
            return false;
          })
          .catch(error => {
            console.error(`Error updating ${input.name}:`, error);
            showNotification(`${input.name} güncellenirken hata: ${error.message}`, 'error');
            return false;
          })
      );
    });
    
    // Wait for all updates to complete
    try {
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        showNotification(`${successCount} alan başarıyla güncellendi`, 'success');
      }
      
      // Toggle back to display mode
      toggleSectionEditMode(sectionId, facility);
    } catch (error) {
      console.error('Error updating section:', error);
      showNotification('Bölüm güncellenirken hata oluştu', 'error');
    } finally {
      // Restore save button
      saveButton.disabled = false;
      saveButton.innerHTML = originalSaveText;
    }
  }

  // Load form structure from server or localStorage
  function loadFormStructure() {
    showFormLoadingState(true);
    
    // Clear any potentially corrupted form data
    try {
      if (localStorage.getItem('formStructure')) {
        const cachedForm = JSON.parse(localStorage.getItem('formStructure'));
        if (!cachedForm.formId || cachedForm.formId === 'Default') {
          console.warn('Removing invalid cached form with Default ID');
          localStorage.removeItem('formStructure');
        }
      }
    } catch (e) {
      console.error('Error checking localStorage form:', e);
      localStorage.removeItem('formStructure');
    }
    
    // Get admin client ID for tracking
    const adminClientId = localStorage.getItem('adminClientId') || generateClientId();
    localStorage.setItem('adminClientId', adminClientId);
    
    // Always try to fetch from server first
    fetch(`/api/form-structure?clientId=${adminClientId}&clientType=admin&timestamp=${Date.now()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        if (result && result.success && result.data) {
          // Check for valid form ID
          if (!result.data.formId || result.data.formId === 'Default') {
            console.warn('Server returned form with invalid ID, creating new form');
            initializeDefaultFormStructure();
            saveFormStructure();
            return;
          }
          
          // Store the new form structure
          formStructure = result.data;
          console.log('Form structure loaded successfully from server');
          
          // Ensure form has lastModified property
          if (!formStructure.lastModified) {
            formStructure.lastModified = new Date().toISOString();
          }
          
          // Store in localStorage
          try {
            localStorage.setItem('formStructure', JSON.stringify(formStructure));
          } catch (e) {
            console.warn('Failed to save form to localStorage:', e);
          }
          
          // Initialize the form editor
          renderSectionsList();
          renderFieldsList();
          renderFormPreview();
          
          showFormLoadingState(false);
        } else {
          throw new Error('Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error loading form structure from server:', error);
        
        // Try to load from localStorage as fallback
        try {
          const cachedStructure = localStorage.getItem('formStructure');
          if (cachedStructure) {
            formStructure = JSON.parse(cachedStructure);
            
            if (!formStructure.formId || formStructure.formId === 'Default') {
              console.warn('Local storage contains form with invalid ID, creating new form');
              initializeDefaultFormStructure();
            } else {
              console.log('Using cached form structure from localStorage');
            }
          } else {
            console.log('No cached form structure found, initializing default');
            initializeDefaultFormStructure();
          }
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
          initializeDefaultFormStructure();
        }
        
        // Update UI
        renderSectionsList();
        renderFieldsList();
        renderFormPreview();
        showFormLoadingState(false);
      });
  }

  function showFormLoadingState(isLoading) {
    const formEditor = document.getElementById('form-editor');
    const loadingIndicator = document.getElementById('form-loading-indicator') || 
      createLoadingIndicator();
    
    if (isLoading) {
      if (formEditor) formEditor.classList.add('opacity-50', 'pointer-events-none');
      loadingIndicator.style.display = 'flex';
    } else {
      if (formEditor) formEditor.classList.remove('opacity-50', 'pointer-events-none');
      loadingIndicator.style.display = 'none';
    }
  }

  function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'form-loading-indicator';
    indicator.className = 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50';
    indicator.innerHTML = `
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-blue-600 font-medium">Form Yükleniyor...</p>
      </div>
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  // Setup listener for form structure changes in other admin windows
  function setupFormStructureListener() {
    // Listen for custom events from other admin tabs
    window.addEventListener('formStructureUpdated', function(event) {
      // Check if the update is from a different admin client
      const updatedClientId = event.detail?.clientId;
      const currentClientId = localStorage.getItem('adminClientId');
      
      if (updatedClientId !== currentClientId) {
        console.log('Form structure updated in another admin window, reloading...');
        loadFormStructure();
      }
    });
    
    // Listen for localStorage changes
    window.addEventListener('storage', function(event) {
      if (event.key === 'formStructure') {
        console.log('Form structure changed in localStorage, checking if reload needed...');
        
        try {
          const newStructure = JSON.parse(event.newValue);
          const currentClientId = localStorage.getItem('adminClientId');
          
          // If this update was triggered by a different client, reload
          if (newStructure && newStructure.updatedBy !== currentClientId) {
            formStructure = newStructure;
            
            // Update UI components
            renderSectionsList();
            renderFieldsList();
            updateSectionFilter();
            renderFormPreview();
            
            showNotification('Form yapısı başka bir admin tarafından güncellendi', 'info');
          }
        } catch (error) {
          console.error('Error processing form structure change:', error);
        }
      }
    });
    
    // Start heartbeat to maintain admin client registration
    startAdminHeartbeat();
  }

  // Send periodic heartbeats to server to maintain active admin status
  function startAdminHeartbeat() {
    const adminClientId = localStorage.getItem('adminClientId') || generateClientId();
    localStorage.setItem('adminClientId', adminClientId);
    
    console.log('Starting admin heartbeat with ID:', adminClientId);
    
    // Send first heartbeat immediately
    sendAdminHeartbeat(adminClientId);
    
    // Then every minute
    setInterval(() => {
      sendAdminHeartbeat(adminClientId);
    }, 60 * 1000);
  }

  // Send a heartbeat to the server
  function sendAdminHeartbeat(clientId) {
    fetch('/api/client-heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        clientId: clientId,
        clientType: 'admin',
        lastKnownUpdate: formStructure?.lastModified,
        checkForUpdates: true
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.hasUpdates) {
        console.log('Server indicates form structure updates are available, reloading...');
        loadFormStructure();
      }
    })
    .catch(error => {
      console.error('Error sending admin heartbeat:', error);
    });
  }

  // Reset form structure to default
  function resetFormStructure() {
    if (!confirm('Form yapısını sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    // Clear localStorage
    localStorage.removeItem('formStructure');
    
    // Initialize default structure
    initializeDefaultFormStructure();
    
    // Save to server
    saveFormChanges();
    
    // Show notification
    showNotification('Form yapısı başarıyla sıfırlandı.', 'success');
  }

  // Save all form changes and sync to the server
  function saveFormChanges() {
    // Show loading indicator
    const saveBtn = document.getElementById('save-form-changes');
    const originalBtnText = saveBtn ? saveBtn.textContent : 'Değişiklikleri Kaydet';
    
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...';
    }
    
    // Add timestamp and form ID to form structure to track changes
    formStructure.lastModified = new Date().toISOString();
    
    // Ensure we have a unique form ID for tracking
    if (!formStructure.formId) {
      formStructure.formId = 'form_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
    
    // Get client ID for tracking
    const adminClientId = localStorage.getItem('adminClientId') || generateClientId();
    localStorage.setItem('adminClientId', adminClientId);
    
    // Add updatedBy information to form structure
    formStructure.updatedBy = adminClientId;
    
    // Save to localStorage for user interface access
    try {
      // Save to adminFormStructure specifically for the user interface to access
      localStorage.setItem('adminFormStructure', JSON.stringify(formStructure));
      // Also update the regular formStructure
      localStorage.setItem('formStructure', JSON.stringify(formStructure));
      console.log('Form structure saved to localStorage with ID:', formStructure.formId);
    } catch (e) {
      console.error('Failed to save form to localStorage:', e);
    }
    
    // Save to server
    fetch('/api/form-structure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(formStructure)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Kaydedildi';
          
          // Reset button text after a delay
          setTimeout(() => {
            saveBtn.textContent = originalBtnText;
          }, 2000);
        }
        
        if (result.success) {
          showNotification('Form yapısı başarıyla kaydedildi', 'success');
          
          // Notify other admin windows of the change
          const customEvent = new CustomEvent('formStructureUpdated', { 
            detail: { 
              timestamp: formStructure.lastModified,
              clientId: adminClientId
            } 
          });
          window.dispatchEvent(customEvent);
          
          // Broadcast form update to all clients
          broadcastFormUpdate(adminClientId);
        } else {
          showNotification('Form yapısı kaydedilirken bir hata oluştu: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
      })
      .catch(error => {
        console.error('Error saving form structure:', error);
        
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-times mr-2"></i> Hata';
          
          // Reset button text after a delay
          setTimeout(() => {
            saveBtn.textContent = originalBtnText;
          }, 2000);
        }
        
        showNotification('Form yapısı kaydedilirken bir hata oluştu: ' + error.message, 'error');
      });
  }

  // Broadcast form update to all clients
  function broadcastFormUpdate(adminClientId) {
    fetch('/api/broadcast-form-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        adminClientId: adminClientId,
        timestamp: new Date().toISOString()
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          console.log(`Form update broadcast to ${result.userCount} user(s) and ${result.adminCount} admin(s)`);
        }
      })
      .catch(error => {
        console.error('Error broadcasting form update:', error);
      });
  }

  // Open form editor modal
  function openFormEditor() {
    loadFormStructure();
    
    // Form yapısı yüklendikten sonra hemen bölüm filtresini güncelleyelim
    setTimeout(() => {
      updateSectionFilter(); 
      
      // Bölüm filtresi dolduktan sonra alan listesini güncelleyelim
      setTimeout(() => {
        renderFieldsList();
      }, 100);
    }, 100);
    
    const formEditorModal = document.getElementById('form-editor-modal');
    if (formEditorModal) {
      // Add reset button if it doesn't exist
      const actionButtons = formEditorModal.querySelector('.modal-actions');
      if (actionButtons && !actionButtons.querySelector('#reset-form-structure')) {
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-form-structure';
        resetButton.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600';
        resetButton.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Formu Sıfırla';
        resetButton.onclick = resetFormStructure;
        actionButtons.appendChild(resetButton);
      }
      
      formEditorModal.classList.remove('hidden');
    }
  }

  // Close form editor modal
  function closeFormEditor() {
    const formEditorModal = document.getElementById('form-editor-modal');
    if (formEditorModal) {
      formEditorModal.classList.add('hidden');
    }
  }

  // Switch between form editor tabs
  function switchFormEditorTab(tabId) {
    // Hide all tab contents
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
      pane.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.form-editor-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      tab.classList.remove('border-blue-700');
      tab.classList.add('border-transparent');
      tab.classList.remove('text-blue-700');
      tab.classList.add('text-gray-500');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.classList.remove('hidden');
    }
    
    // Add active class to selected tab
    const activeTab = document.querySelector(`.form-editor-tab[data-tab="${tabId}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.classList.remove('border-transparent');
      activeTab.classList.add('border-blue-700');
      activeTab.classList.remove('text-gray-500');
      activeTab.classList.add('text-blue-700');
    }
  }

  // Render the list of sections in the editor
  function renderSectionsList() {
    const sectionsList = document.getElementById('sections-list');
    if (!sectionsList) return;
    
    sectionsList.innerHTML = '';
    
    if (formStructure.sections.length === 0) {
      sectionsList.innerHTML = '<div class="p-4 text-gray-500 text-center">Henüz hiç bölüm eklenmemiş</div>';
      return;
    }
    
    // Sort sections by order
    const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
    
    sortedSections.forEach(section => {
      const sectionItem = document.createElement('div');
      sectionItem.className = 'p-4 flex items-center justify-between';
      sectionItem.innerHTML = `
        <div>
          <h4 class="font-medium text-gray-800">${section.title}</h4>
          <p class="text-sm text-gray-500">${section.description || 'Açıklama yok'}</p>
          <div class="text-xs text-gray-400 mt-1">ID: ${section.id} | Sıra: ${section.order}</div>
        </div>
        <div class="flex space-x-2">
          <button class="edit-section-btn p-2 text-blue-600 hover:text-blue-800" data-id="${section.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-section-btn p-2 text-red-600 hover:text-red-800" data-id="${section.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      
      sectionsList.appendChild(sectionItem);
      
      // Add event listeners
      const editBtn = sectionItem.querySelector('.edit-section-btn');
      const deleteBtn = sectionItem.querySelector('.delete-section-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', function() {
          editSection(section.id);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
          deleteSection(section.id);
        });
      }
    });
  }

  // Render the list of fields in the editor
  function renderFieldsList() {
    const fieldsList = document.getElementById('fields-list');
    if (!fieldsList) return;
    
    fieldsList.innerHTML = '';
    
    // Get selected section filter
    const sectionFilter = document.getElementById('section-filter');
    let selectedSection = sectionFilter ? sectionFilter.value : '';
    
    // Filter fields by section if needed
    let fieldsToRender = formStructure.fields;
    
    console.log('renderFieldsList çağrıldı, selectedSection:', selectedSection);
    
    // If no section is selected, use the one with lowest ID
    if (!selectedSection || selectedSection === 'all') {
      // Sort sections by ID to find the one with lowest ID
      if (formStructure.sections && formStructure.sections.length > 0) {
        const sortedSections = [...formStructure.sections].sort((a, b) => a.id.localeCompare(b.id));
        if (sortedSections.length > 0) {
          selectedSection = sortedSections[0].id;
          // Update dropdown to show the selected section
          if (sectionFilter) {
            sectionFilter.value = selectedSection;
            console.log('Bölüm filtresi güncellendi, şimdi seçili:', selectedSection);
          }
        }
      }
    }
    
    // Now filter fields by the selected section
    if (selectedSection && selectedSection !== 'all') {
      fieldsToRender = formStructure.fields.filter(field => field.section === selectedSection);
      console.log('Filtrelenmiş alan sayısı:', fieldsToRender.length);
    }
    
    if (fieldsToRender.length === 0) {
      fieldsList.innerHTML = '<div class="p-4 text-gray-500 text-center">Bu kriterlere uygun alan bulunamadı</div>';
      return;
    }
    
    // Sort fields by section and order
    const sortedFields = [...fieldsToRender].sort((a, b) => {
      if (a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      return a.order - b.order;
    });
    
    // Pagination setup
    const itemsPerPage = 5; // Sayfa başına gösterilen öğe sayısı 5 olarak ayarlandı
    const currentPage = parseInt(fieldsList.getAttribute('data-current-page') || '1');
    const totalPages = Math.ceil(sortedFields.length / itemsPerPage);
    
    // Calculate items for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedFields.length);
    const currentPageItems = sortedFields.slice(startIndex, endIndex);
    
    // Render fields for current page
    currentPageItems.forEach(field => {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'p-4 flex items-center justify-between';
      
      // Find section name
      const section = formStructure.sections.find(s => s.id === field.section);
      const sectionName = section ? section.title : field.section;
      
      // Determine field type display name
      let fieldTypeName = field.type;
      switch (field.type) {
        case 'text': fieldTypeName = 'Metin'; break;
        case 'email': fieldTypeName = 'E-posta'; break;
        case 'number': fieldTypeName = 'Sayı'; break;
        case 'tel': fieldTypeName = 'Telefon'; break;
        case 'date': fieldTypeName = 'Tarih'; break;
        case 'select': fieldTypeName = 'Açılır Liste'; break;
        case 'checkbox': fieldTypeName = 'Onay Kutusu'; break;
        case 'radio': fieldTypeName = 'Seçenek Düğmesi'; break;
        case 'textarea': fieldTypeName = 'Çok Satırlı Metin'; break;
        case 'file': fieldTypeName = 'Dosya Yükleme'; break;
      }
      
      // Required badge
      const requiredBadge = field.required ? 
        '<span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2">Zorunlu</span>' : 
        '';
      
      fieldItem.innerHTML = `
        <div>
          <h4 class="font-medium text-gray-800">${field.label} ${requiredBadge}</h4>
          <p class="text-sm text-gray-500">Tip: ${fieldTypeName} | Bölüm: ${sectionName}</p>
          <div class="text-xs text-gray-400 mt-1">ID: ${field.id} | Sıra: ${field.order}</div>
        </div>
        <div class="flex space-x-2">
          <button class="edit-field-btn p-2 text-blue-600 hover:text-blue-800" data-id="${field.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-field-btn p-2 text-red-600 hover:text-red-800" data-id="${field.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      
      fieldsList.appendChild(fieldItem);
      
      // Add event listeners
      const editBtn = fieldItem.querySelector('.edit-field-btn');
      const deleteBtn = fieldItem.querySelector('.delete-field-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', function() {
          editField(field.id);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
          deleteField(field.id);
        });
      }
    });
    
    // Add pagination controls if needed
    if (totalPages > 1) {
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'flex justify-center items-center mt-4 p-4 border-t';
      
      // Create pagination HTML
      let paginationHTML = `
        <div class="flex space-x-1">
          <button class="pagination-btn prev-page px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="px-3 py-1 text-gray-700">Sayfa ${currentPage} / ${totalPages}</span>
          <button class="pagination-btn next-page px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      `;
      
      paginationContainer.innerHTML = paginationHTML;
      fieldsList.appendChild(paginationContainer);
      
      // Add event listeners to pagination buttons
      const prevPageBtn = paginationContainer.querySelector('.prev-page');
      const nextPageBtn = paginationContainer.querySelector('.next-page');
      
      if (prevPageBtn && currentPage > 1) {
        prevPageBtn.addEventListener('click', function() {
          fieldsList.setAttribute('data-current-page', currentPage - 1);
          renderFieldsList();
        });
      }
      
      if (nextPageBtn && currentPage < totalPages) {
        nextPageBtn.addEventListener('click', function() {
          fieldsList.setAttribute('data-current-page', currentPage + 1);
          renderFieldsList();
        });
      }
    }
    
    // Store current page in attribute
    fieldsList.setAttribute('data-current-page', currentPage);
  }

  // Update section filter dropdown
  function updateSectionFilter() {
    const sectionFilter = document.getElementById('section-filter');
    const fieldSection = document.getElementById('field-section');
    
    if (!sectionFilter && !fieldSection) return;
    
    // Debug için filtre elementini kontrol edelim
    console.log('updateSectionFilter çağrıldı, sectionFilter:', sectionFilter);
    
    // Eğer formStructure hazır değilse bekleyelim
    if (!formStructure || !formStructure.sections) {
      console.warn('Form yapısı henüz hazır değil, section filter güncelleme atlanıyor');
      return;
    }
    
    // Sort sections by order
    const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
    console.log('Sıralanmış bölümler:', sortedSections);
    
    // Update section filter
    if (sectionFilter) {
      // Save current selection
      const currentValue = sectionFilter.value;
      
      // Clear all options - Remove "Tüm Bölümler" option completely
      sectionFilter.innerHTML = '';
      
      // Add section options
      sortedSections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = section.title;
        sectionFilter.appendChild(option);
      });
      
      // If no value was previously selected or it was "all", select the section with lowest ID
      if (!currentValue || currentValue === 'all' || !sectionFilter.querySelector(`option[value="${currentValue}"]`)) {
        if (sortedSections.length > 0) {
          // ID'si en küçük bölümü bulmak için sıralama yap
          const lowestIdSection = [...sortedSections].sort((a, b) => a.id.localeCompare(b.id))[0];
          sectionFilter.value = lowestIdSection.id;
          console.log('En küçük ID\'li bölüm seçildi:', lowestIdSection.id);
        }
      } else {
        // Restore previous selection if possible
        sectionFilter.value = currentValue;
      }
    }
    
    // Update field section dropdown
    if (fieldSection) {
      // Save current selection
      const currentValue = fieldSection.value;
      
      // Clear all options
      fieldSection.innerHTML = '';
      
      // Add section options
      sortedSections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = section.title;
        fieldSection.appendChild(option);
      });
      
      // Restore selection if possible
      if (currentValue && fieldSection.querySelector(`option[value="${currentValue}"]`)) {
        fieldSection.value = currentValue;
      } else if (sortedSections.length > 0) {
        // Otherwise select first option
        fieldSection.value = sortedSections[0].id;
      }
    }
  }

  // Render form preview
  function renderFormPreview() {
    const previewContainer = document.getElementById('form-preview');
    if (!previewContainer) return;
    
    // Clear existing content
    previewContainer.innerHTML = '';
    
    if (!formStructure || !formStructure.sections || formStructure.sections.length === 0) {
      previewContainer.innerHTML = '<div class="text-gray-500 text-center">Form Hazırlanıyor...</div>';
      return;
    }
    
    // Show form ID information at the top
    let formInfoElement = document.createElement('div');
    formInfoElement.className = 'bg-blue-50 border border-blue-200 p-4 mb-6 rounded-lg';
    formInfoElement.innerHTML = `
      <h3 class="text-lg font-medium text-blue-800 mb-2">Form Bilgileri</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-medium text-gray-700">Form ID</p>
          <p class="text-lg text-blue-800 font-bold">${formStructure.formId || 'Belirtilmemiş'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">Son Güncelleme</p>
          <p class="text-sm text-gray-900">${formStructure.lastModified ? new Date(formStructure.lastModified).toLocaleString('tr-TR') : 'Belirtilmemiş'}</p>
        </div>
      </div>
    `;
    previewContainer.appendChild(formInfoElement);
    
    // Sort sections by order
    const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
    
    // Render each section
    sortedSections.forEach(section => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'mb-6 pb-6 border-b border-gray-200';
      
      sectionElement.innerHTML = `
        <h3 class="text-lg font-medium text-gray-800 mb-2">${section.title}</h3>
        ${section.description ? `<p class="text-sm text-gray-600 mb-4">${section.description}</p>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="preview-section-${section.id}"></div>
      `;
      
      previewContainer.appendChild(sectionElement);
      
      // Get fields for this section and sort by order
      const sectionFields = formStructure.fields
        .filter(field => field.section === section.id)
        .sort((a, b) => a.order - b.order);
      
      const fieldsContainer = sectionElement.querySelector(`#preview-section-${section.id}`);
      
      if (sectionFields.length === 0) {
        fieldsContainer.innerHTML = '<div class="col-span-2 text-gray-500 text-center">Bu bölümde henüz alan yok</div>';
        return;
      }
      
      sectionFields.forEach(field => {
        const fieldElement = document.createElement('div');
        fieldElement.className = field.type === 'textarea' ? 'col-span-2' : '';
        
        const requiredMark = field.required ? ' <span class="text-red-500">*</span>' : '';
        
        let inputElement = '';
        
        switch (field.type) {
          case 'text':
          case 'email':
          case 'number':
          case 'tel':
          case 'date':
            inputElement = `<input type="${field.type}" disabled class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" placeholder="${field.placeholder || ''}">`;
            break;
          case 'textarea':
            inputElement = `<textarea disabled rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100" placeholder="${field.placeholder || ''}"></textarea>`;
            break;
          case 'select':
            let options = '<option value="">Seçiniz</option>';
            if (field.options && field.options.length > 0) {
              options += field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            }
            inputElement = `<select disabled class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100">${options}</select>`;
            break;
          case 'checkbox':
            inputElement = `
              <div class="flex items-center">
                <input type="checkbox" disabled class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                <span class="ml-2 text-sm text-gray-700">${field.label}</span>
              </div>
            `;
            break;
          case 'radio':
            if (field.options && field.options.length > 0) {
              inputElement = '<div class="space-y-2">';
              field.options.forEach(opt => {
                inputElement += `
                  <div class="flex items-center">
                    <input type="radio" disabled class="h-4 w-4 text-blue-600 border-gray-300">
                    <span class="ml-2 text-sm text-gray-700">${opt}</span>
                  </div>
                `;
              });
              inputElement += '</div>';
            }
            break;
          case 'file':
            inputElement = `
              <div class="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-100">
                <div class="text-center">
                  <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path>
                  </svg>
                  <p class="mt-1 text-sm text-gray-500">Dosya seçin</p>
                </div>
              </div>
            `;
            break;
        }
        
        if (field.type !== 'checkbox') {
          fieldElement.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-1">${field.label}${requiredMark}</label>
            ${inputElement}
          `;
        } else {
          fieldElement.innerHTML = inputElement;
        }
        
        fieldsContainer.appendChild(fieldElement);
      });
    });
  }

  // Open add section modal
  function openAddSectionModal() {
    // Reset form
    const form = document.getElementById('add-section-form');
    if (form) form.reset();
    
    // Generate a default ID
    const sectionIdInput = document.getElementById('section-id');
    if (sectionIdInput) {
      sectionIdInput.value = 'section-' + Date.now();
    }
    
    // Set default order to be the last
    const sectionOrderInput = document.getElementById('section-order');
    if (sectionOrderInput) {
      sectionOrderInput.value = formStructure.sections.length + 1;
    }
    
    // Show modal
    const modal = document.getElementById('add-section-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Close add section modal
  function closeAddSectionModal() {
    const modal = document.getElementById('add-section-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Edit a section
  function editSection(sectionId) {
    const section = formStructure.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Fill form
    const sectionIdInput = document.getElementById('section-id');
    const sectionTitleInput = document.getElementById('section-title');
    const sectionDescriptionInput = document.getElementById('section-description');
    const sectionOrderInput = document.getElementById('section-order');
    
    if (sectionIdInput) sectionIdInput.value = section.id;
    if (sectionTitleInput) sectionTitleInput.value = section.title;
    if (sectionDescriptionInput) sectionDescriptionInput.value = section.description || '';
    if (sectionOrderInput) sectionOrderInput.value = section.order;
    
    // Show modal
    const modal = document.getElementById('add-section-modal');
    if (modal) {
      // Change title
      const modalTitle = modal.querySelector('h2');
      if (modalTitle) modalTitle.textContent = 'Bölüm Düzenle';
      
      // Change button text
      const saveButton = document.getElementById('save-new-section');
      if (saveButton) saveButton.textContent = 'Değişiklikleri Kaydet';
      
      modal.classList.remove('hidden');
    }
  }

  // Delete a section
  function deleteSection(sectionId) {
    // Check if there are fields in this section
    const fieldsInSection = formStructure.fields.filter(field => field.section === sectionId);
    
    if (fieldsInSection.length > 0) {
      if (!confirm(`Bu bölümde ${fieldsInSection.length} alan bulunuyor. Bölümü ve içindeki tüm alanları silmek istediğinize emin misiniz?`)) {
        return;
      }
    } else {
      if (!confirm('Bu bölümü silmek istediğinize emin misiniz?')) {
        return;
      }
    }
    
    // Remove section
    formStructure.sections = formStructure.sections.filter(section => section.id !== sectionId);
    
    // Remove fields in this section
    formStructure.fields = formStructure.fields.filter(field => field.section !== sectionId);
    
    // Save changes locally
    saveFormStructure();
    
    // Update UI
    renderSectionsList();
    renderFieldsList();
    updateSectionFilter();
    renderFormPreview();
    
    // Save to server immediately
    saveFormChanges();
    
    showNotification('Bölüm başarıyla silindi', 'success');
  }

  // Save new section
  function saveNewSection() {
    // Validate form
    const sectionIdInput = document.getElementById('section-id');
    const sectionTitleInput = document.getElementById('section-title');
    const sectionDescriptionInput = document.getElementById('section-description');
    const sectionOrderInput = document.getElementById('section-order');
    
    if (!sectionIdInput || !sectionTitleInput || !sectionOrderInput) return;
    
    const sectionId = sectionIdInput.value.trim();
    const sectionTitle = sectionTitleInput.value.trim();
    const sectionDescription = sectionDescriptionInput ? sectionDescriptionInput.value.trim() : '';
    const sectionOrder = parseInt(sectionOrderInput.value) || 1;
    
    if (!sectionId) {
      alert('Bölüm ID alanı zorunludur');
      return;
    }
    
    if (!sectionTitle) {
      alert('Bölüm Başlığı alanı zorunludur');
      return;
    }
    
    // Validate section ID format (only letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(sectionId)) {
      alert('Bölüm ID sadece küçük harfler, sayılar ve tire içerebilir');
      return;
    }
    
    // Check if we're editing an existing section
    const existingSection = formStructure.sections.find(s => s.id === sectionId);
    
    if (existingSection) {
      // Update existing section
      existingSection.title = sectionTitle;
      existingSection.description = sectionDescription;
      existingSection.order = sectionOrder;
      
      showNotification('Bölüm başarıyla güncellendi', 'success');
    } else {
      // Check if ID is already used
      const isDuplicate = formStructure.sections.some(s => s.id === sectionId);
      
      if (isDuplicate) {
        alert('Bu Bölüm ID zaten kullanılıyor. Lütfen başka bir ID seçin.');
        return;
      }
      
      // Add new section
      formStructure.sections.push({
        id: sectionId,
        title: sectionTitle,
        description: sectionDescription,
        order: sectionOrder
      });
      
      showNotification('Yeni bölüm başarıyla eklendi', 'success');
    }
    
    // Close modal
    closeAddSectionModal();
    
    // Update UI before server save
    renderSectionsList();
    updateSectionFilter();
    renderFormPreview();
    
    // Immediately save to server to reflect changes in the form
    saveFormChanges();
  }

  // Save form structure to localStorage
  function saveFormStructure() {
    localStorage.setItem('formStructure', JSON.stringify(formStructure));
  }

  // Open add field modal
  function openAddFieldModal() {
    // Check if there are any sections
    if (formStructure.sections.length === 0) {
      alert('Alan eklemeden önce en az bir bölüm eklemelisiniz.');
      return;
    }
    
    // Reset form
    const form = document.getElementById('add-field-form');
    if (form) form.reset();
    
    // Generate a default ID
    const fieldIdInput = document.getElementById('field-id');
    if (fieldIdInput) {
      fieldIdInput.value = 'field-' + Date.now();
    }
    
    // Set default order
    const fieldOrderInput = document.getElementById('field-order');
    if (fieldOrderInput) {
      fieldOrderInput.value = formStructure.fields.length + 1;
    }
    
    // Reset field type
    const fieldTypeSelect = document.getElementById('field-type');
    if (fieldTypeSelect) {
      fieldTypeSelect.value = 'text';
      toggleFieldOptionsContainer();
    }
    
    // Pre-select the section based on current filter
    const sectionFilter = document.getElementById('section-filter');
    const fieldSectionSelect = document.getElementById('field-section');
    if (sectionFilter && fieldSectionSelect && sectionFilter.value !== 'all') {
      // If a specific section is selected in the filter, use that
      fieldSectionSelect.value = sectionFilter.value;
    } else if (fieldSectionSelect && formStructure.sections.length > 0) {
      // Otherwise select the first section
      fieldSectionSelect.value = formStructure.sections.sort((a, b) => a.order - b.order)[0].id;
    }
    
    // Ensure section dropdown is properly populated
    updateSectionFilter();
    
    // Show modal
    const modal = document.getElementById('add-field-modal');
    if (modal) {
      // Reset title to "Add Field"
      const modalTitle = modal.querySelector('h2');
      if (modalTitle) modalTitle.textContent = 'Yeni Alan Ekle';
      
      // Reset button text
      const saveButton = document.getElementById('save-new-field');
      if (saveButton) saveButton.textContent = 'Alan Ekle';
      
      modal.classList.remove('hidden');
    }
  }

  // Close add field modal
  function closeAddFieldModal() {
    const modal = document.getElementById('add-field-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Toggle field options container based on field type
  function toggleFieldOptionsContainer() {
    const fieldTypeSelect = document.getElementById('field-type');
    const fieldOptionsContainer = document.getElementById('field-options-container');
    
    if (!fieldTypeSelect || !fieldOptionsContainer) return;
    
    const fieldType = fieldTypeSelect.value;
    
    if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
      fieldOptionsContainer.classList.remove('hidden');
    } else {
      fieldOptionsContainer.classList.add('hidden');
    }
  }

  // Edit a field
  function editField(fieldId) {
    const field = formStructure.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Fill form
    const fieldIdInput = document.getElementById('field-id');
    const fieldLabelInput = document.getElementById('field-label');
    const fieldTypeSelect = document.getElementById('field-type');
    const fieldSectionSelect = document.getElementById('field-section');
    const fieldPlaceholderInput = document.getElementById('field-placeholder');
    const fieldOrderInput = document.getElementById('field-order');
    const fieldRequiredCheckbox = document.getElementById('field-required');
    const fieldOptionsTextarea = document.getElementById('field-options');
    
    if (fieldIdInput) fieldIdInput.value = field.id;
    if (fieldLabelInput) fieldLabelInput.value = field.label;
    if (fieldTypeSelect) fieldTypeSelect.value = field.type;
    if (fieldSectionSelect) fieldSectionSelect.value = field.section;
    if (fieldPlaceholderInput) fieldPlaceholderInput.value = field.placeholder || '';
    if (fieldOrderInput) fieldOrderInput.value = field.order;
    if (fieldRequiredCheckbox) fieldRequiredCheckbox.checked = field.required;
    
    // Set options if available
    if (fieldOptionsTextarea && field.options) {
      fieldOptionsTextarea.value = field.options.join('\n');
    }
    
    // Toggle options visibility
    toggleFieldOptionsContainer();
    
    // Show modal
    const modal = document.getElementById('add-field-modal');
    if (modal) {
      // Change title
      const modalTitle = modal.querySelector('h2');
      if (modalTitle) modalTitle.textContent = 'Alan Düzenle';
      
      // Change button text
      const saveButton = document.getElementById('save-new-field');
      if (saveButton) saveButton.textContent = 'Değişiklikleri Kaydet';
      
      modal.classList.remove('hidden');
    }
  }

  // Delete a field
  function deleteField(fieldId) {
    if (!confirm('Bu alanı silmek istediğinize emin misiniz?')) {
      return;
    }
    
    // Remove field
    formStructure.fields = formStructure.fields.filter(field => field.id !== fieldId);
    
    // Save changes locally
    saveFormStructure();
    
    // Update UI
    renderFieldsList();
    renderFormPreview();
    
    // Save to server immediately
    saveFormChanges();
    
    showNotification('Alan başarıyla silindi', 'success');
  }

  // Save new field
  function saveNewField() {
    // Validate form
    const fieldIdInput = document.getElementById('field-id');
    const fieldLabelInput = document.getElementById('field-label');
    const fieldTypeSelect = document.getElementById('field-type');
    const fieldSectionSelect = document.getElementById('field-section');
    const fieldPlaceholderInput = document.getElementById('field-placeholder');
    const fieldOrderInput = document.getElementById('field-order');
    const fieldRequiredCheckbox = document.getElementById('field-required');
    const fieldOptionsTextarea = document.getElementById('field-options');
    
    if (!fieldIdInput || !fieldLabelInput || !fieldTypeSelect || !fieldSectionSelect || !fieldOrderInput) {
      showNotification('Form alanları bulunamadı', 'error');
      return;
    }
    
    const fieldId = fieldIdInput.value.trim();
    const fieldLabel = fieldLabelInput.value.trim();
    const fieldType = fieldTypeSelect.value;
    const fieldSection = fieldSectionSelect.value;
    const fieldPlaceholder = fieldPlaceholderInput ? fieldPlaceholderInput.value.trim() : '';
    const fieldOrder = parseInt(fieldOrderInput.value) || 1;
    const fieldRequired = fieldRequiredCheckbox ? fieldRequiredCheckbox.checked : false;
    
    // Parse options if needed
    let fieldOptions = [];
    if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
      if (fieldOptionsTextarea) {
        fieldOptions = fieldOptionsTextarea.value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    }
    
    if (!fieldId) {
      showNotification('Alan ID alanı zorunludur', 'error');
      return;
    }
    
    if (!fieldLabel) {
      showNotification('Alan Etiketi alanı zorunludur', 'error');
      return;
    }
    
    if (!fieldSection) {
      showNotification('Bölüm seçimi zorunludur', 'error');
      return;
    }
    
    // Validate field ID format (only letters, numbers, and hyphens)
    if (!/^[a-z0-9-_]+$/.test(fieldId)) {
      showNotification('Alan ID sadece küçük harfler, sayılar, tire ve alt çizgi içerebilir', 'error');
      return;
    }
    
    // Verify that the selected section exists
    const selectedSection = formStructure.sections.find(s => s.id === fieldSection);
    if (!selectedSection) {
      showNotification('Seçilen bölüm bulunamadı. Lütfen geçerli bir bölüm seçin.', 'error');
      return;
    }
    
    // Add debug log if in debug mode
    if (isDebugMode) {
      addDebugLog(`Bölüm seçildi: ${fieldSection} (${selectedSection.title})`, 'info');
    }
    
    // Check if we're editing an existing field
    const existingFieldIndex = formStructure.fields.findIndex(f => f.id === fieldId);
    
    if (existingFieldIndex !== -1) {
      // Update existing field
      const existingField = formStructure.fields[existingFieldIndex];
      const oldSection = existingField.section;
      
      // Update field properties
      existingField.label = fieldLabel;
      existingField.type = fieldType;
      existingField.section = fieldSection;
      existingField.placeholder = fieldPlaceholder;
      existingField.order = fieldOrder;
      existingField.required = fieldRequired;
      
      // Update options if needed
      if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
        existingField.options = fieldOptions;
      } else {
        // Remove options property if field type doesn't need it
        delete existingField.options;
      }
      
      // Additional properties based on field type
      if (fieldType === 'file') {
        existingField.accept = determineFileAcceptType(fieldId);
      }
      
      // Log section change if it happened
      if (oldSection !== fieldSection && isDebugMode) {
        addDebugLog(`Alan bölümü değiştirildi: ${oldSection} -> ${fieldSection}`, 'info');
      }
      
      showNotification('Alan başarıyla güncellendi', 'success');
    } else {
      // Check if ID is already used
      const isDuplicate = formStructure.fields.some(f => f.id === fieldId);
      
      if (isDuplicate) {
        showNotification('Bu Alan ID zaten kullanılıyor. Lütfen başka bir ID seçin.', 'error');
        return;
      }
      
      // Create new field
      const newField = {
        id: fieldId,
        label: fieldLabel,
        type: fieldType,
        section: fieldSection,
        placeholder: fieldPlaceholder,
        order: fieldOrder,
        required: fieldRequired
      };
      
      // Add options if needed
      if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
        newField.options = fieldOptions;
      }
      
      // Add additional properties based on field type
      if (fieldType === 'file') {
        newField.accept = determineFileAcceptType(fieldId);
      }
      
      // Add new field
      formStructure.fields.push(newField);
      
      if (isDebugMode) {
        addDebugLog(`Yeni alan eklendi: ${fieldId} (${fieldSection} bölümüne)`, 'success');
      }
      
      showNotification('Yeni alan başarıyla eklendi', 'success');
    }
    
    // Add timestamp for synchronization
    formStructure.lastModified = new Date().toISOString();
    
    // Log form structure for debugging
    if (isDebugMode) {
      console.log('Updated form structure:', JSON.stringify(formStructure, null, 2));
      addDebugLog(`Form yapısı güncellendi. Toplam alan sayısı: ${formStructure.fields.length}`, 'info');
    }
    
    // Save changes
    saveFormStructure();
    
    // Close modal
    closeAddFieldModal();
    
    // Update UI
    renderFieldsList();
    renderFormPreview();
    updateSectionFilter();
    
    // Immediately save to server to reflect changes in the form
    saveFormChanges();
  }
  
  // Determine file accept attribute based on field ID/purpose
  function determineFileAcceptType(fieldId) {
    const lowerFieldId = fieldId.toLowerCase();
    
    if (lowerFieldId.includes('image') || lowerFieldId.includes('photo') || 
        lowerFieldId.includes('logo') || lowerFieldId.includes('gallery')) {
      return "image/*";
    } else if (lowerFieldId.includes('document') || lowerFieldId.includes('license') || 
             lowerFieldId.includes('certificate') || lowerFieldId.includes('pdf')) {
      return "application/pdf";
    } else {
      return ".pdf,.doc,.docx,image/*";
    }
  }
  
  // Generate a unique client ID
  function generateClientId() {
    return 'admin_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Initialize default form structure if none exists
  function initializeDefaultFormStructure() {
    // Generate a unique form ID
    const formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    formStructure = {
      lastModified: new Date().toISOString(),
      formId: formId,
      sections: [
        {
          id: "section-1746855813780",
          title: "Genel Bilgiler",
          description: "",
          order: 1
        },
        {
          id: "section-1746856011653",
          title: "Doktorlar",
          description: "",
          order: 2
        },
        {
          id: "section-1746856698467",
          title: "3",
          description: "",
          order: 3
        },
        {
          id: "section-1746856704438",
          title: "4",
          description: "",
          order: 4
        }
      ],
      fields: [
        {
          id: "field-1746855819428",
          label: "Sağlık Tesis Adı",
          type: "text",
          section: "section-1746855813780",
          placeholder: "Örn: Özel Özdemir Muayenehanesi",
          order: 1,
          required: true
        },
        {
          id: "field-ckyscode",
          label: "ÇKYS Kodu",
          type: "text",
          section: "section-1746855813780",
          placeholder: "Örn: 123456",
          order: 2,
          required: true
        },
        {
          id: "field-kurum_tipi",
          label: "Kurum Tipi",
          type: "select",
          section: "section-1746855813780",
          options: ["Özel", "Kamu", "Üniversite"],
          placeholder: "Kurum tipini seçiniz",
          order: 3,
          required: true
        },
        {
          id: "field-group",
          label: "Grup",
          type: "select",
          section: "section-1746855813780",
          options: ["Hastane", "Muayenehane", "Poliklinik", "Tıp Merkezi", "Ağız ve Diş Sağlığı Merkezi", "Laboratuvar", "Görüntüleme Merkezi", "Fizik Tedavi Merkezi", "Diğer"],
          placeholder: "Grup seçiniz",
          order: 4,
          required: true
        },
        {
          id: "field-city",
          label: "Şehir",
          type: "select",
          section: "section-1746855813780",
          options: ["Adana", "Adıyaman", "Afyon", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İçel (Mersin)", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"],
          placeholder: "Şehir seçiniz",
          order: 5,
          required: true
        },
        {
          id: "field-district",
          label: "İlçe",
          type: "text",
          section: "section-1746855813780",
          placeholder: "İlçe adı",
          order: 6,
          required: true
        },
        {
          id: "field-address",
          label: "Adres",
          type: "textarea",
          section: "section-1746855813780",
          placeholder: "Tam adres bilgisi",
          order: 7,
          required: true
        },
        {
          id: "field-postal_code",
          label: "Posta Kodu",
          type: "text",
          section: "section-1746855813780",
          placeholder: "Örn: 61050",
          order: 8,
          required: false
        },
        {
          id: "field-coordinates",
          label: "Koordinatlar",
          type: "text",
          section: "section-1746855813780",
          placeholder: "Örn: 41.035725, 28.984897",
          order: 9,
          required: false
        },
        {
          id: "field-website",
          label: "Web Site URL",
          type: "url",
          section: "section-1746855813780",
          placeholder: "Örn: https://www.sitenizinadresi.com",
          order: 10,
          required: false
        },
        {
          id: "field-email",
          label: "E-posta",
          type: "email",
          section: "section-1746855813780",
          placeholder: "Örn: info@saglikmerkeziniz.com",
          order: 11,
          required: true
        },
        {
          id: "field-phone",
          label: "Telefon",
          type: "tel",
          section: "section-1746855813780",
          placeholder: "Örn: +90 212 123 45 67",
          order: 12,
          required: true
        },
        {
          id: "field-staff_count",
          label: "Personel Sayısı",
          type: "number",
          section: "section-1746855813780",
          placeholder: "Toplam personel sayısı",
          order: 13,
          required: false
        },
        {
          id: "field-foundation_year",
          label: "Kuruluş Yılı",
          type: "number",
          section: "section-1746855813780",
          placeholder: "Örn: 2022",
          order: 14,
          required: false
        },
        {
          id: "field-certifications",
          label: "Sertifikalar",
          type: "checkbox",
          section: "section-1746855813780",
          options: ["JCI", "ISO", "TÜV", "Bakanlık Onayı", "Diğer"],
          order: 15,
          required: false
        },
        {
          id: "field-1746856125435",
          label: "test",
          type: "email",
          section: "section-1746856011653",
          placeholder: "test",
          order: 16,
          required: false
        },
        {
          id: "field-1746856722510",
          label: "Yetki Belgesi",
          type: "file",
          section: "section-1746856698467",
          placeholder: "test",
          order: 17,
          required: false,
          accept: ".pdf,.doc,.docx,image/*"
        },
        {
          id: "field-1746856743924",
          label: "2",
          type: "file",
          section: "section-1746856698467",
          placeholder: "",
          order: 18,
          required: false,
          accept: ".pdf,.doc,.docx,image/*"
        }
      ]
    };
    
    // Save to localStorage
    localStorage.setItem('formStructure', JSON.stringify(formStructure));
  }
  
  // Setup listener for form structure changes
  function setupFormStructureListener() {
    // Listen for custom events from other admin tabs
    window.addEventListener('formStructureUpdated', function(event) {
      // Check if the update is from a different admin client
      const updatedClientId = event.detail?.clientId;
      const currentClientId = localStorage.getItem('adminClientId');
      
      if (updatedClientId !== currentClientId) {
        console.log('Form structure updated in another admin window, reloading...');
        loadFormStructure();
      }
    });
    
    // Listen for localStorage changes
    window.addEventListener('storage', function(event) {
      if (event.key === 'formStructure') {
        console.log('Form structure changed in localStorage, checking if reload needed...');
        
        try {
          const newStructure = JSON.parse(event.newValue);
          const currentClientId = localStorage.getItem('adminClientId');
          
          // If this update was triggered by a different client, reload
          if (newStructure && newStructure.updatedBy !== currentClientId) {
            formStructure = newStructure;
            
            // Update UI components
            renderSectionsList();
            renderFieldsList();
            updateSectionFilter();
            renderFormPreview();
            
            showNotification('Form yapısı başka bir admin tarafından güncellendi', 'info');
          }
        } catch (error) {
          console.error('Error processing form structure change:', error);
        }
      }
    });
    
    // Start heartbeat to maintain admin client registration
    startAdminHeartbeat();
  }
  
  // Send periodic heartbeats to server to maintain active admin status
  function startAdminHeartbeat() {
    const adminClientId = localStorage.getItem('adminClientId') || generateClientId();
    localStorage.setItem('adminClientId', adminClientId);
    
    console.log('Starting admin heartbeat with ID:', adminClientId);
    
    // Send first heartbeat immediately
    sendAdminHeartbeat(adminClientId);
    
    // Then every minute
    setInterval(() => {
      sendAdminHeartbeat(adminClientId);
    }, 60 * 1000);
  }
  
  // Send a heartbeat to the server
  function sendAdminHeartbeat(clientId) {
    fetch('/api/client-heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        clientId: clientId,
        clientType: 'admin',
        lastKnownUpdate: formStructure?.lastModified,
        checkForUpdates: true
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.hasUpdates) {
        console.log('Server indicates form structure updates are available, reloading...');
        loadFormStructure();
      }
    })
    .catch(error => {
      console.error('Error sending admin heartbeat:', error);
    });
  }

  // Reset form structure to default
  function resetFormStructure() {
    if (!confirm('Form yapısını sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    // Clear localStorage
    localStorage.removeItem('formStructure');
    
    // Initialize default structure
    initializeDefaultFormStructure();
    
    // Save to server
    saveFormChanges();
    
    // Show notification
    showNotification('Form yapısı başarıyla sıfırlandı.', 'success');
  }
}); 