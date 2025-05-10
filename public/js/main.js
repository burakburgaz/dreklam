// Main JavaScript for Facility Registration Form

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const facilityForm = document.getElementById('facility-form');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const fileUploadAreas = document.querySelectorAll('.file-upload-area');
  const galleryUploadArea = document.querySelector('.gallery-upload-area');
  const galleryUploadInput = document.getElementById('gallery-upload');
  const galleryPreview = document.getElementById('gallery-preview');
  const citySelect = document.getElementById('city');
  const districtSelect = document.getElementById('district');
  const autoFillBtn = document.getElementById('auto-fill-btn');
  const nextToServicesBtn = document.getElementById('next-to-services-btn');
  const nextToGalleryBtn = document.getElementById('next-to-gallery-btn');
  const backToGeneralBtn = document.getElementById('back-to-general-btn');
  const backToServicesBtn = document.getElementById('back-to-services-btn');
  const formProgressBar = document.getElementById('form-progress-bar');
  
  // Status Bar Elements
  const statusFormStep = document.getElementById('status-form-step');
  const statusCompletedFields = document.getElementById('status-completed-fields');
  const statusSessionTime = document.getElementById('status-session-time');
  const statusDate = document.getElementById('status-date');
  
  // Form structure variable
  let formStructure = null;
  
  // Load form structure from server
  function loadFormStructure() {
    // Always fetch from server first to ensure we have the latest form
    fetchFormStructureFromServer();
    
    // Setup listener for real-time form structure updates
    setupFormStructureListener();
  }
  
  // Setup listener for form structure changes
  function setupFormStructureListener() {
    // Generate a unique client ID for this form session if not already set
    const clientId = localStorage.getItem('formClientId') || generateClientId();
    localStorage.setItem('formClientId', clientId);
    
    // Create a StorageEvent listener to detect changes from admin panel
    window.addEventListener('storage', function(event) {
      // Check if the formStructure in localStorage was changed
      if (event.key === 'formStructure') {
        console.log('Form structure changed in another window, reloading form...');
        try {
          const newStructure = JSON.parse(event.newValue);
          if (validateFormStructure(newStructure)) {
            // Compare if it's actually different
            if (JSON.stringify(formStructure) !== JSON.stringify(newStructure)) {
              formStructure = newStructure;
              // Reinitialize the form with the new structure
              initializeFormFromStructure();
              // Show notification to the user
              showNotification('Form yapısı güncellendi', 'info', 3000);
            }
          }
        } catch (error) {
          console.error('Error processing updated form structure:', error);
        }
      }
    });
    
    // Start client heartbeat to maintain registration with server
    startClientHeartbeat(clientId, 'user');
    
    // Also periodically check for updates directly (backup for browser compatibility)
    const checkInterval = 10000; // 10 seconds
    setInterval(function() {
      try {
        const currentStructureStr = localStorage.getItem('formStructure');
        if (currentStructureStr) {
          const currentStructure = JSON.parse(currentStructureStr);
          
          // Compare with current form structure using deep comparison
          if (JSON.stringify(formStructure) !== JSON.stringify(currentStructure)) {
            console.log('Form structure changed, reloading form...');
            if (validateFormStructure(currentStructure)) {
              formStructure = currentStructure;
              // Reinitialize the form with the new structure
              initializeFormFromStructure();
              // Show notification to the user
              showNotification('Form yapısı güncellendi', 'info', 3000);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for form structure updates:', error);
      }
    }, checkInterval);
  }
  
  // Client heartbeat to maintain active status with server
  function startClientHeartbeat(clientId, clientType = 'user') {
    console.log('Starting client heartbeat with ID:', clientId);
    
    // Send heartbeat every 60 seconds
    const heartbeatInterval = 60 * 1000; // 1 minute
    
    // Store last known update time
    let lastKnownUpdate = formStructure?.lastModified;
    
    // Initial heartbeat
    sendHeartbeat(clientId, clientType, lastKnownUpdate);
    
    // Set up regular heartbeat
    setInterval(() => {
      // Update last known update time
      lastKnownUpdate = formStructure?.lastModified;
      sendHeartbeat(clientId, clientType, lastKnownUpdate);
    }, heartbeatInterval);
  }
  
  // Send heartbeat to server
  function sendHeartbeat(clientId, clientType, lastKnownUpdate) {
    fetch('/api/client-heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        clientId: clientId,
        clientType: clientType,
        lastKnownUpdate: lastKnownUpdate,
        checkForUpdates: true
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.hasUpdates) {
        console.log('Server indicates form updates are available, fetching...');
        fetchFormStructureFromServer();
      }
    })
    .catch(error => {
      console.error('Error sending heartbeat:', error);
    });
  }

  // Generate a unique client ID
  function generateClientId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Fetch form structure from server API
  function fetchFormStructureFromServer() {
    console.log('Fetching form structure from server');
    showLoadingOverlay('Form yapısı yükleniyor...');
    
    // Clear any existing form data in localStorage first
    localStorage.removeItem('formStructure');
    localStorage.removeItem('lastFormUpdate');
    
    // Get client ID
    const clientId = localStorage.getItem('formClientId') || generateClientId();
    localStorage.setItem('formClientId', clientId);
    
    fetch(`/api/form-structure?clientId=${clientId}&clientType=user&timestamp=${new Date().getTime()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        if (result && result.success && result.data) {
          console.log('Form structure loaded from server successfully');
          
          // Check if the form has a valid ID
          if (!result.data.formId || result.data.formId === 'Default') {
            console.warn('Form does not have a valid ID, requesting new form');
            return fetch('/api/form-structure?forceRefresh=true&clientId=' + clientId);
          }
          
          // Store form structure in global variable
          formStructure = result.data;
          
          // Store in localStorage with timestamp
          try {
            localStorage.setItem('formStructure', JSON.stringify(formStructure));
            localStorage.setItem('lastFormUpdate', new Date().toISOString());
            console.log('Form structure saved to localStorage');
          } catch (storageError) {
            console.warn('Failed to save form structure to localStorage:', storageError);
          }
          
          // Initialize form with the structure
          initializeFormFromStructure();
        } else {
          console.error('Invalid form structure data from server:', result);
          useDefaultFormStructure();
        }
      })
      .catch(error => {
        console.error('Error fetching form structure:', error);
        
        // Show custom error message with retry button
        hideLoadingOverlay();
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
          formContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-6">
              <h3 class="font-medium text-lg mb-2">Form Yüklenemiyor</h3>
              <p class="mb-4">Form yapısı sunucudan yüklenemedi. Lütfen internet bağlantınızı kontrol edin ve yeniden deneyin.</p>
              <div class="flex items-center space-x-3">
                <button id="retry-load-form" class="bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded">
                  Yeniden Dene
                </button>
                <button id="use-default-form" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded">
                  Basit Form Kullan
                </button>
              </div>
            </div>
          `;
          
          // Add event listeners for buttons
          document.getElementById('retry-load-form')?.addEventListener('click', () => {
            fetchFormStructureFromServer();
          });
          
          document.getElementById('use-default-form')?.addEventListener('click', () => {
            useDefaultFormStructure();
          });
          
          return;
        }
        
        // If we can't show the custom error, use default structure
        useDefaultFormStructure();
      })
      .finally(() => {
        hideLoadingOverlay();
      });
  }
  
  // Use default form structure if server fails
  function useDefaultFormStructure() {
    console.warn('Using fallback form structure');
    
    // First try to get any form from localStorage
    try {
      const adminFormStructure = localStorage.getItem('adminFormStructure');
      if (adminFormStructure) {
        const parsedForm = JSON.parse(adminFormStructure);
        if (parsedForm && parsedForm.sections && parsedForm.sections.length > 0) {
          console.log('Using admin form structure from localStorage');
          formStructure = parsedForm;
          return;
        }
      }
    } catch (e) {
      console.error('Error reading admin form from localStorage:', e);
    }
    
    // If no admin form is found, use a minimal structure
    formStructure = {
      sections: [
        {
          id: "general-info",
          title: "Genel Bilgiler",
          description: "Sağlık tesisi temel bilgileri",
          order: 1
        }
      ],
      fields: [
        {
          id: "facilityName",
          label: "Sağlık Tesis Adı",
          type: "text",
          section: "general-info",
          required: true,
          placeholder: "Örn: Özel Özdemir Muayenehanesi",
          order: 1
        }
      ],
      formId: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      lastModified: new Date().toISOString()
    };
    
    // Show error message to user
    showErrorMessage('Form yapısı yüklenemedi. Lütfen sayfayı yenileyin veya yönetici ile iletişime geçin.');
  }

  // Validate the form structure
  function validateFormStructure(structure) {
    // Check if structure has necessary properties
    if (!structure || typeof structure !== 'object') {
      console.error('Invalid form structure: not an object');
      return false;
    }
    
    if (!Array.isArray(structure.sections) || !Array.isArray(structure.fields)) {
      console.error('Invalid form structure: sections or fields not found');
      return false;
    }
    
    // Check if sections have required properties
    for (const section of structure.sections) {
      if (!section.id || !section.title || section.order === undefined) {
        console.error('Invalid section structure:', section);
        return false;
      }
    }
    
    // Check if fields have required properties
    for (const field of structure.fields) {
      if (!field.id || !field.label || !field.type || !field.section) {
        console.error('Invalid field structure:', field);
        return false;
      }
      
      // Check if field references a valid section
      const sectionExists = structure.sections.some(section => section.id === field.section);
      if (!sectionExists) {
        console.error(`Field ${field.id} references non-existent section ${field.section}`);
        return false;
      }
    }
    
    return true;
  }
  
  // Create dynamic form based on loaded structure
  function initializeFormFromStructure() {
    if (!formStructure) {
      console.error('Form structure is not available');
      return;
    }
    
    // Display form ID and source file path in the status bar
    const formNameDisplay = document.getElementById('form-name-display');
    if (formNameDisplay) {
      const formPath = 'src/data/form-structure.json';
      const formDetails = {
        path: formPath,
        sections: formStructure.sections ? formStructure.sections.length : 0,
        fields: formStructure.fields ? formStructure.fields.length : 0,
        lastModified: formStructure.lastModified || 'Bilinmiyor',
        formId: formStructure.formId || 'Default'
      };
      
      // Format date for better display
      const formattedDate = formDetails.lastModified !== 'Bilinmiyor' 
        ? new Date(formDetails.lastModified).toLocaleString('tr-TR')
        : 'Bilinmiyor';
        
      // Show form ID more prominently with special formatting
      formNameDisplay.innerHTML = `
        <span style="color: #ff0000; font-weight: bold;">Form ID: ${formDetails.formId}</span> | 
        <span style="color: #333;">Dosya: ${formDetails.path}</span> | 
        <span style="color: #333;">Tarih: ${formattedDate}</span> | 
        <span style="color: #333;">Bölümler: ${formDetails.sections}</span> | 
        <span style="color: #333;">Alanlar: ${formDetails.fields}</span>
      `;
    }
    
    // Create tabs for each section
    const tabsContainer = document.querySelector('.flex.border-b');
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      
      // Sort sections by order
      const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
      
      // Create tab buttons
      sortedSections.forEach((section, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = `tab-button px-4 py-2 text-gray-600 font-medium ${index === 0 ? 'active' : ''}`;
        tabButton.setAttribute('data-tab', section.id);
        tabButton.textContent = section.title;
        
        tabsContainer.appendChild(tabButton);
        
        // Add event listener
        tabButton.addEventListener('click', function() {
          activateTab(section.id);
        });
      });
    }
    
    // Update tab contents
    const tabContentsContainer = document.querySelector('.tab-contents');
    if (tabContentsContainer) {
      tabContentsContainer.innerHTML = '';
      
      // Sort sections by order
      const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
      
      // Create each tab content
      sortedSections.forEach((section, index) => {
        // Create container
        const tabContent = document.createElement('div');
        tabContent.className = `tab-content ${index === 0 ? 'active' : 'hidden'}`;
        tabContent.id = section.id;
        
        // Add header with description (if it's not the first tab or first tab has a description)
        const header = document.createElement('div');
        header.className = 'mb-6';
        
        // Only show the section title heading if it's not the first tab or if we have a description
        if (index !== 0 || section.description) {
          header.innerHTML = `
            <h2 class="text-2xl font-bold mb-2">${section.title}</h2>
            <p class="text-gray-600">${section.description || ''}</p>
          `;
          tabContent.appendChild(header);
        }
        
        // Add fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8';
        tabContent.appendChild(fieldsContainer);
        
        // Filter fields that belong to this section
        const sectionFields = formStructure.fields
          .filter(field => field.section === section.id)
          .sort((a, b) => a.order - b.order);
        
        console.log(`Section ${section.id} has ${sectionFields.length} fields`);
        
        // Create fields in this section
        sectionFields.forEach(field => {
          // Create field container
          const fieldContainer = document.createElement('div');
          fieldContainer.className = field.type === 'textarea' ? 'col-span-2' : '';
          fieldContainer.id = `field-container-${field.id}`;
          
          // Required mark for label
          const requiredMark = field.required ? ' <span class="text-red-500">*</span>' : '';
          
          // Create label
          let labelHTML = '';
          if (field.type !== 'checkbox') {
            labelHTML = `<label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}${requiredMark}</label>`;
          }
          
          // Create input element based on type
          let inputHTML = '';
          switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
            case 'number':
              inputHTML = `
                <input 
                  type="${field.type}" 
                  id="${field.id}" 
                  name="${field.id}" 
                  placeholder="${field.placeholder || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ${field.required ? 'required' : ''}
                >
              `;
              break;
            case 'textarea':
              inputHTML = `
                <textarea 
                  id="${field.id}" 
                  name="${field.id}" 
                  placeholder="${field.placeholder || ''}" 
                  rows="4" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ${field.required ? 'required' : ''}
                ></textarea>
              `;
              break;
            case 'select':
              let options = '<option value="">Seçiniz</option>';
              if (field.options && field.options.length > 0) {
                field.options.forEach(opt => {
                  options += `<option value="${opt}">${opt}</option>`;
                });
              }
              inputHTML = `
                <select 
                  id="${field.id}" 
                  name="${field.id}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ${field.required ? 'required' : ''}
                >
                  ${options}
                </select>
              `;
              break;
            case 'checkbox':
              // If options are provided, create multiple checkboxes
              if (field.options && field.options.length > 0) {
                inputHTML = '<div class="space-y-2">';
                field.options.forEach((opt, i) => {
                  inputHTML += `
                    <div class="flex items-center">
                      <input 
                        type="checkbox" 
                        id="${field.id}_${i}" 
                        name="${field.id}" 
                        value="${opt}"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        data-group="${field.id}"
                      >
                      <label for="${field.id}_${i}" class="ml-2 block text-sm text-gray-700">${opt}</label>
                    </div>
                  `;
                });
                inputHTML += '</div>';
              } else {
                // Single checkbox
                inputHTML = `
                  <div class="flex items-center h-full">
                    <input 
                      type="checkbox" 
                      id="${field.id}" 
                      name="${field.id}" 
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      ${field.required ? 'required' : ''}
                    >
                    <label for="${field.id}" class="ml-2 block text-sm text-gray-700">${field.label}${requiredMark}</label>
                  </div>
                `;
                // Remove label since it's included with the checkbox
                labelHTML = '';
              }
              break;
            case 'radio':
              if (field.options && field.options.length > 0) {
                inputHTML = '<div class="space-y-2">';
                field.options.forEach((opt, i) => {
                  inputHTML += `
                    <div class="flex items-center">
                      <input 
                        type="radio" 
                        id="${field.id}_${i}" 
                        name="${field.id}" 
                        value="${opt}"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        ${field.required && i === 0 ? 'required' : ''}
                      >
                      <label for="${field.id}_${i}" class="ml-2 block text-sm text-gray-700">${opt}</label>
                    </div>
                  `;
                });
                inputHTML += '</div>';
              }
              break;
            case 'date':
              inputHTML = `
                <input 
                  type="date" 
                  id="${field.id}" 
                  name="${field.id}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ${field.required ? 'required' : ''}
                >
              `;
              break;
            case 'file':
              inputHTML = `
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div class="space-y-1 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M3 16h28v20a4 4 0 01-4 4H7a4 4 0 01-4-4V16z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-gray-600">
                      <label for="${field.id}" class="cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Dosya seçin</span>
                        <input id="${field.id}" name="${field.id}" type="file" class="sr-only" ${field.required ? 'required' : ''}>
                      </label>
                      <p class="pl-1">ya da sürükleyip bırakın</p>
                    </div>
                    <p class="text-xs text-gray-500">PNG, JPG, PDF (max 10MB)</p>
                  </div>
                </div>
              `;
              break;
          }
          
          // Assemble the field
          fieldContainer.innerHTML = `
            ${labelHTML}
            ${inputHTML}
          `;
          
          // Add to the fields container
          fieldsContainer.appendChild(fieldContainer);
        });
        
        // Add navigation buttons container
        const navContainer = document.createElement('div');
        navContainer.className = 'flex justify-between mt-8';
        
        // Previous button (hide on first tab)
        if (index > 0) {
          const prevButton = document.createElement('button');
          prevButton.type = 'button';
          prevButton.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
          prevButton.textContent = 'Önceki';
          prevButton.onclick = () => {
            const prevSection = sortedSections[index - 1];
            if (prevSection) {
              activateTab(prevSection.id);
            }
          };
          navContainer.appendChild(prevButton);
        } else {
          // Empty div for spacing
          navContainer.appendChild(document.createElement('div'));
        }
        
        // Next/Submit button
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        
        // Last tab has submit button, others have next button
        if (index === sortedSections.length - 1) {
          nextButton.className = 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700';
          nextButton.textContent = 'Başvuruyu Onayla';
          nextButton.onclick = () => {
            // Validate all required fields before submission
            if (validateRequiredFields()) {
              submitForm();
            }
          };
        } else {
          nextButton.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700';
          nextButton.textContent = 'İleri';
          nextButton.onclick = () => {
            // Validate current tab before moving to next
            if (isCurrentStepValid(index)) {
              const nextSection = sortedSections[index + 1];
              if (nextSection) {
                activateTab(nextSection.id);
              }
            }
          };
        }
        
        navContainer.appendChild(nextButton);
        tabContent.appendChild(navContainer);
        
        // Add the tab content to the container
        tabContentsContainer.appendChild(tabContent);
      });
      
      // Initialize
      updateRequiredFieldsList();
      updateCompletedFieldsCounter();
    }
    
    // Update progress bar labels and functionality
    updateProgressBarWithSections();
  }
  
  // Update progress bar based on sections
  function updateProgressBarWithSections() {
    const progressBar = document.getElementById('form-progress-bar');
    const progressLabels = document.getElementById('form-progress-labels');
    
    if (!progressBar || !progressLabels || !formStructure || !formStructure.sections) {
      return;
    }
    
    // Clear existing labels
    progressLabels.innerHTML = '';
    
    // Get sorted sections
    const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
    const totalSections = sortedSections.length;
    
    // Add section labels
    sortedSections.forEach((section, index) => {
      const label = document.createElement('span');
      label.textContent = section.title;
      label.setAttribute('data-section-id', section.id);
      label.className = 'text-xs';
      
      // Calculate position for label
      const position = index === 0 ? 0 : (index / (totalSections - 1)) * 100;
      label.style.left = `${position}%`;
      label.style.transform = 'translateX(-50%)';
      label.style.position = 'absolute';
      
      progressLabels.appendChild(label);
    });
    
    // Update progress when a tab is activated
    const updateProgressOnTabChange = (tabId) => {
      const sectionIndex = sortedSections.findIndex(section => section.id === tabId);
      if (sectionIndex === -1) return;
      
      const progress = totalSections > 1 ? (sectionIndex / (totalSections - 1)) * 100 : 0;
      progressBar.style.width = `${progress}%`;
      
      // Update section labels for visual feedback
      progressLabels.querySelectorAll('span').forEach((label, index) => {
        if (index <= sectionIndex) {
          label.classList.add('text-blue-700', 'font-bold');
        } else {
          label.classList.remove('text-blue-700', 'font-bold');
        }
      });
    };
    
    // Initial update of progress bar
    const activeTabContent = document.querySelector('.tab-content.active');
    if (activeTabContent) {
      updateProgressOnTabChange(activeTabContent.id);
    }
    
    // Override activateTab function to update progress bar
    const originalActivateTab = activateTab;
    activateTab = function(tabId) {
      originalActivateTab(tabId);
      updateProgressOnTabChange(tabId);
    };
  }
  
  // Helper function to activate a tab
  function activateTab(tabId) {
    console.log(`Activating tab with ID: ${tabId}`);
    
    // Find all tab contents and hide them
    const allTabContents = document.querySelectorAll('.tab-content');
    allTabContents.forEach(tab => {
      tab.classList.remove('active');
      tab.classList.add('hidden');
    });
    
    // Find the tab content matching the ID and show it
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.classList.remove('hidden');
      targetTab.classList.add('active');
      console.log(`Activated tab content with ID: ${tabId}`);
    } else {
      console.error(`Tab content with ID ${tabId} not found`);
    }
    
    // Update tab buttons
    const allTabButtons = document.querySelectorAll('.tab-button');
    allTabButtons.forEach(button => {
      const buttonTabId = button.getAttribute('data-tab');
      if (buttonTabId === tabId) {
        // Active tab
        button.classList.add('active');
        button.classList.add('border-b-2');
        button.classList.add('border-blue-700');
        button.classList.add('text-blue-700');
        button.classList.remove('text-gray-600');
      } else {
        // Inactive tab
        button.classList.remove('active');
        button.classList.remove('border-b-2');
        button.classList.remove('border-blue-700');
        button.classList.remove('text-blue-700');
        button.classList.add('text-gray-600');
      }
    });
    
    // Update current step if needed
    const sections = [...formStructure.sections].sort((a, b) => a.order - b.order);
    const currentIndex = sections.findIndex(section => section.id === tabId);
    
    if (currentIndex !== -1) {
      currentStep = currentIndex;
      updateProgressBar();
    }
    
    // Update the counter of completed fields
    updateCompletedFieldsCounter();
  }
  
  // Helper function to validate current step
  function isCurrentStepValid(stepIndex) {
    // Get current section
    const sections = formStructure.sections.sort((a, b) => a.order - b.order);
    if (stepIndex < 0 || stepIndex >= sections.length) return false;
    
    const currentSection = sections[stepIndex];
    
    // Get required fields for this section
    const requiredFields = formStructure.fields
      .filter(field => field.section === currentSection.id && field.required);
    
    let isValid = true;
    let errorMessages = [];
    
    // Check each required field
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element || !element.value.trim()) {
        isValid = false;
        errorMessages.push(`${field.label} alanı zorunludur.`);
        if (element) {
          element.classList.add('border-red-500');
          element.addEventListener('input', function() {
            if (this.value.trim()) {
              this.classList.remove('border-red-500');
            }
          });
        }
      }
    });
    
    if (!isValid) {
      showNotification(errorMessages.join('<br>'), 'error', 5000);
    }
    
    return isValid;
  }
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  // Update the list of required fields for validation
  function updateRequiredFieldsList() {
    requiredFields = formStructure.fields
      .filter(field => field.required)
      .map(field => ({ id: field.id, name: field.label }));
  }
  
  // Setup tab functionality
  function setupTabFunctionality() {
    // Find updated tab buttons
    const updatedTabButtons = document.querySelectorAll('.tab-btn');
    
    // Add click handlers
    updatedTabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Find section index
        const sectionIndex = formStructure.sections.findIndex(section => section.id === tabId);
        if (sectionIndex !== -1) {
          if (validateRequiredFields()) {
            goToStep(sectionIndex);
          }
        }
      });
    });
  }
  
  // Call the function to load form structure when page loads
  loadFormStructure();
  
  // Initialize tabs - show first tab, hide others
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach((content, index) => {
    if (index === 0) {
      content.classList.add('active');
      content.classList.remove('hidden');
    } else {
      content.classList.remove('active');
      content.classList.add('hidden');
    }
  });
  
  // Status Bar - Set current date
  if (statusDate) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    statusDate.textContent = now.toLocaleDateString('tr-TR', options);
  }
  
  // Status Bar - Session timer
  let sessionSeconds = 0;
  const sessionTimer = setInterval(function() {
    sessionSeconds++;
    if (statusSessionTime) {
      const minutes = Math.floor(sessionSeconds / 60);
      const seconds = sessionSeconds % 60;
      statusSessionTime.textContent = `Oturum: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
  
  // Step navigation and progress tracking
  let currentStep = 0;
  const totalSteps = 3; // Now 3 steps: General, Services, Gallery
  const stepNames = ['Genel Bilgiler', 'Branş ve Hizmetler', 'Galeri'];
  
  // Required fields for validation
  const requiredFields = [];
  
  // Update completed fields counter in status bar
  function updateCompletedFieldsCounter() {
    if (statusCompletedFields) {
      let completedCount = 0;
      requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element && element.value.trim()) {
          completedCount++;
        }
      });
      statusCompletedFields.textContent = `${completedCount}/${requiredFields.length} alan dolduruldu`;
    }
  }
  
  // Initialize completed fields counter
  updateCompletedFieldsCounter();
  
  // Add input event listeners to update the counter
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      element.addEventListener('input', updateCompletedFieldsCounter);
      element.addEventListener('change', updateCompletedFieldsCounter);
    }
  });
  
  // Step navigation functions
  if (nextToServicesBtn) {
    nextToServicesBtn.addEventListener('click', function() {
      // Validate required fields before proceeding
      if (validateRequiredFields()) {
        goToStep(1); // Go to services step
      }
    });
  }
  
  if (nextToGalleryBtn) {
    nextToGalleryBtn.addEventListener('click', function() {
      goToStep(2); // Go to gallery step
    });
  }
  
  if (backToGeneralBtn) {
    backToGeneralBtn.addEventListener('click', function() {
      goToStep(0); // Go back to general info step
    });
  }
  
  if (backToServicesBtn) {
    backToServicesBtn.addEventListener('click', function() {
      goToStep(1); // Go back to services step
    });
  }

  // Add submit event listener to form
  if (facilityForm) {
    facilityForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm();
    });
  }
  
  // Go to specific step
  function goToStep(stepIndex) {
    currentStep = stepIndex;
    updateProgressBar();
    
    // Update status bar step indicator
    if (statusFormStep) {
      statusFormStep.textContent = stepNames[stepIndex];
    }
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
      tab.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.classList.remove('border-b-2');
      btn.classList.remove('border-blue-800');
      btn.classList.add('hover:border-b-2');
      btn.classList.add('hover:border-blue-800');
      btn.classList.remove('text-blue-800');
      btn.classList.add('text-gray-600');
    });
    
    // Show current step content and activate corresponding tab
    if (stepIndex === 0) {
      document.getElementById('general-info').classList.remove('hidden');
      document.getElementById('general-info').classList.add('active');
      tabButtons[0].classList.add('active');
      tabButtons[0].classList.add('border-b-2');
      tabButtons[0].classList.add('border-blue-800');
      tabButtons[0].classList.add('text-blue-800');
      tabButtons[0].classList.remove('text-gray-600');
    } else if (stepIndex === 1) {
      document.getElementById('services-info').classList.remove('hidden');
      document.getElementById('services-info').classList.add('active');
      tabButtons[1].classList.add('active');
      tabButtons[1].classList.add('border-b-2');
      tabButtons[1].classList.add('border-blue-800');
      tabButtons[1].classList.add('text-blue-800');
      tabButtons[1].classList.remove('text-gray-600');
    } else if (stepIndex === 2) {
      document.getElementById('gallery-info').classList.remove('hidden');
      document.getElementById('gallery-info').classList.add('active');
      tabButtons[2].classList.add('active');
      tabButtons[2].classList.add('border-b-2');
      tabButtons[2].classList.add('border-blue-800');
      tabButtons[2].classList.add('text-blue-800');
      tabButtons[2].classList.remove('text-gray-600');
    }
  }
  
  // Update progress bar
  function updateProgressBar() {
    if (formProgressBar) {
      const progress = (currentStep / (totalSteps - 1)) * 100;
      formProgressBar.style.width = `${progress}%`;
    }
  }
  
  // Validate required fields for first step
  function validateRequiredFields() {
    const requiredFields = [];
    
    let isValid = true;
    let errorMessages = [];
    
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element || !element.value.trim()) {
        isValid = false;
        errorMessages.push(`${field.name} alanı zorunludur.`);
        if (element) {
          element.classList.add('border-red-500');
          element.addEventListener('input', function() {
            if (this.value.trim()) {
              this.classList.remove('border-red-500');
            }
          });
        }
      }
    });
    
    if (!isValid) {
      showNotification(errorMessages.join('<br>'), 'error', 5000);
    }
    
    // Update status bar
    updateCompletedFieldsCounter();
    
    return isValid;
  }
  
  // Helper to get all selected checkboxes by class
  function getSelectedCheckboxValues(className) {
    const checkboxes = document.querySelectorAll(`.${className}:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
  }
  
  // Helper to get all selected checkboxes by name
  function getSelectedCheckboxValuesByName(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
  }
  
  // Store the last submitted application data
  let lastSubmittedApplication = null;

  // Tab button functionality - integrate with step navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      if (tabId === 'general-info') {
        goToStep(0);
      } else if (tabId === 'services-info') {
        if (validateRequiredFields()) {
          goToStep(1);
        }
      } else if (tabId === 'gallery-info') {
        if (validateRequiredFields()) {
          goToStep(2);
        }
      }
    });
  });

  // Clear gallery preview
  function clearGalleryPreview() {
    if (galleryPreview) {
      galleryPreview.innerHTML = '';
    }
  }

  // Show custom notification with HTML content
  function showCustomNotification(title, type = 'info', htmlContent) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
      type === 'success' ? 'bg-green-100 text-green-800' : 
      type === 'error' ? 'bg-red-100 text-red-800' : 
      'bg-blue-100 text-blue-800'
    }`;
    
    // Add title and content
    notification.innerHTML = `
      <div class="font-medium mb-2">${title}</div>
      ${htmlContent}
    `;
    
    // Add notification to document
    document.body.appendChild(notification);
    
    // Remove notification after 10 seconds for success messages
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, type === 'success' ? 10000 : 5000);
  }

  // Auto-fill form function for testing
  if (autoFillBtn) {
    autoFillBtn.addEventListener('click', function() {
      // Show loading indicator
      showLoadingOverlay();
      
      setTimeout(() => {
        try {
          // Helper function to get random item from array
          const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
          
          // Helper function to generate random string
          const getRandomString = (length, prefix = '') => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = prefix;
            for (let i = 0; i < length; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };
          
          // Helper function to generate random number in range
          const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
          
          // Helper function to generate random Turkish phone number
          const getRandomPhone = () => {
            return `+90 ${getRandomNumber(500, 599)} ${getRandomNumber(100, 999)} ${getRandomNumber(10, 99)} ${getRandomNumber(10, 99)}`;
          };
          
          // Helper function to generate random email
          const getRandomEmail = () => {
            const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'example.com'];
            return `${getRandomString(8).toLowerCase()}@${getRandomItem(domains)}`;
          };
          
          // Helper function to generate random URL
          const getRandomURL = () => {
            const domains = ['example.com', 'site.net', 'mysite.org', 'website.com.tr', 'saglik.com'];
            return `https://www.${getRandomString(6).toLowerCase()}.${getRandomItem(domains)}`;
          };
          
          // Helper function for random date in past 20 years
          const getRandomPastDate = () => {
            const today = new Date();
            const pastDate = new Date();
            pastDate.setFullYear(today.getFullYear() - getRandomNumber(1, 20));
            pastDate.setMonth(getRandomNumber(0, 11));
            pastDate.setDate(getRandomNumber(1, 28));
            return pastDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          };
          
          // Turkish cities
          const cities = ["Adana", "Adıyaman", "Afyon", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "İçel (Mersin)", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"];
            
          // Random district names
          const districts = ["Merkez", "Ataşehir", "Beşiktaş", "Karşıyaka", "Çankaya", "Pendik", "Konak", "Kadıköy", "Bağcılar", "Şişli", "Ümraniye", "Bahçelievler", "Üsküdar", "Eyüp", "Fatih"];
            
          // Random facility names/prefixes
          const facilityPrefixes = ["Özel", "Devlet", "Üniversite", "Eğitim ve Araştırma", "Şehir", "Dr. Özdemir", "Medical", "Anadolu", "Memorial", "Hospital", "Tıp Merkezi", "Life", "Sağlık"];
          const facilityTypes = ["Hastanesi", "Tıp Merkezi", "Muayenehanesi", "Sağlık Grubu", "Kliniği", "Poliklinikleri", "Medical Center"];
            
          // Random facility title suffixes
          const titleSuffixes = ["A.Ş.", "Ltd. Şti.", "Holding", "Vakfı", "Sağlık Hizmetleri"];
            
          // Find all form fields to fill - explicitly excluding file inputs
          const allInputs = document.querySelectorAll('input:not([type="file"]):not([type="button"]):not([type="submit"]):not([type="hidden"]), select, textarea');
          const fieldsBySection = {};
          
          // Find all file inputs to notify user about
          const fileInputs = document.querySelectorAll('input[type="file"]');
          const fileInputCount = fileInputs.length;
            
          // Group fields by section for easier handling
          allInputs.forEach(input => {
            // Find the section this input belongs to
            const fieldId = input.id;
            if (!fieldId) return;
            
            let sectionId = null;
            
            // Find field in formStructure to get its section
            if (formStructure && formStructure.fields) {
              const fieldInfo = formStructure.fields.find(f => f.id === fieldId);
              if (fieldInfo) {
                sectionId = fieldInfo.section;
              }
            }
            
            // If we couldn't find section from formStructure, try to find it from DOM
            if (!sectionId) {
              const tabContent = input.closest('.tab-content');
              if (tabContent) {
                sectionId = tabContent.id;
              }
            }
            
            // Default to 'general-info' if we still don't have a section
            sectionId = sectionId || 'general-info';
            
            if (!fieldsBySection[sectionId]) {
              fieldsBySection[sectionId] = [];
            }
            
            fieldsBySection[sectionId].push(input);
          });
            
          // Process each input by section
          Object.keys(fieldsBySection).forEach(sectionId => {
            const sectionInputs = fieldsBySection[sectionId];
            
            sectionInputs.forEach(input => {
              try {
                const inputId = input.id;
                if (!inputId) return;
                
                // Skip buttons and already filled inputs
                if (input.type === 'button' || input.type === 'submit' || input.type === 'hidden') return;
                
                // Check if this is a required field (it might have the required attribute or a class like 'required')
                const isRequired = input.hasAttribute('required') || input.classList.contains('required');
                
                // Process based on input type
                if (input.type === 'checkbox' || input.type === 'radio') {
                  // Handle checkbox and radio separately
                  return;
                } else if (input.tagName === 'SELECT') {
                  // Select a random option
                  if (input.options.length > 1) {
                    const randomIndex = getRandomNumber(1, input.options.length - 1);
                    input.selectedIndex = randomIndex;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                  }
                } else if (input.tagName === 'TEXTAREA') {
                  // Generate random text for textareas
                  input.value = `Bu bir ${getRandomString(8)} test metnidir. ${getRandomString(20)} bu alanda sağlık tesisinin ${getRandomString(6)} özellikleri belirtilmiştir. ${getRandomString(15)} hizmetleri sunulmaktadır.`;
                } else {
                  // Handle specific fields by ID or use general random data
                  switch (inputId) {
                    // General info
                    case 'facilityName':
                      input.value = `${getRandomItem(facilityPrefixes)} ${getRandomString(4)} ${getRandomItem(facilityTypes)}`;
                      break;
                    case 'facilityTitle':
                      input.value = `${getRandomItem(facilityPrefixes)} ${getRandomString(6)} ${getRandomItem(titleSuffixes)}`;
                      break;
                    case 'ckyscode':
                      input.value = getRandomNumber(100000, 999999).toString();
                      break;
                    case 'institutionType':
                    case 'kurum_tipi':
                      input.value = getRandomItem(["Özel", "Kamu", "Üniversite"]);
                      break;
                    case 'group':
                      input.value = getRandomItem(["A", "B", "C", "D"]);
                      break;
                    case 'foundation_year':
                    case 'foundationYear':
                      input.value = getRandomNumber(1950, 2023).toString();
                      break;
                    case 'staff_count':
                    case 'staffCount':
                      input.value = getRandomNumber(10, 500).toString();
                      break;
                    
                    // Location
                    case 'city':
                      input.value = getRandomItem(cities);
                      // Trigger change event to populate district
                      const event = new Event('change', { bubbles: true });
                      input.dispatchEvent(event);
                      break;
                    case 'district':
                      // Will be set after city change event
                      setTimeout(() => {
                        if (input.options && input.options.length > 1) {
                          const randomIndex = getRandomNumber(1, input.options.length - 1);
                          input.selectedIndex = randomIndex;
                        } else {
                          input.value = getRandomItem(districts);
                        }
                      }, 100);
                      break;
                    case 'address':
                      input.value = `${getRandomString(8)} Mah. ${getRandomString(6)} Sk. Borda İşhanı No:${getRandomNumber(1, 100)}, Kat:${getRandomNumber(1, 10)} ${getRandomNumber(10000, 99999)} ${getRandomItem(cities)}/Türkiye`;
                      break;
                    case 'postal_code':
                    case 'postalCode':
                      input.value = getRandomNumber(10000, 99999).toString();
                      break;
                    case 'enlem':
                      input.value = (Math.random() * (42 - 36) + 36).toFixed(6);
                      break;
                    case 'boylam':
                      input.value = (Math.random() * (45 - 26) + 26).toFixed(6);
                      break;
                    
                    // Contact info
                    case 'website':
                      input.value = getRandomURL();
                      break;
                    case 'contact_phone':
                    case 'phone':
                    case 'authorizedPhone':
                      input.value = getRandomPhone();
                      break;
                    case 'whatsapp':
                      input.value = getRandomPhone();
                      break;
                    case 'email':
                      input.value = getRandomEmail();
                      break;
                    case 'contact_person':
                      input.value = `Dr. ${getRandomString(6)} ${getRandomString(8)}`;
                      break;
                    case 'social_media':
                      input.value = `Instagram: @${getRandomString(8).toLowerCase()}\nFacebook: fb.com/${getRandomString(10).toLowerCase()}\nTwitter: @${getRandomString(7).toLowerCase()}`;
                      break;
                    
                    // Numbers
                    case 'bed_capacity':
                      input.value = getRandomNumber(10, 500).toString();
                      break;
                    case 'operating_rooms':
                      input.value = getRandomNumber(1, 20).toString();
                      break;
                    case 'authorizationNumber':
                      input.value = `AUTH-${getRandomNumber(1000, 9999)}-${getRandomString(3).toUpperCase()}`;
                      break;
                    
                    // Other fields - generic handling based on type
                    default:
                      if (input.type === 'number') {
                        input.value = getRandomNumber(1, 1000).toString();
                      } else if (input.type === 'email') {
                        input.value = getRandomEmail();
                      } else if (input.type === 'tel') {
                        input.value = getRandomPhone();
                      } else if (input.type === 'url') {
                        input.value = getRandomURL();
                      } else if (input.type === 'date') {
                        input.value = getRandomPastDate();
                      } else {
                        // Default text input
                        input.value = getRandomString(8);
                      }
                  }
                }
              } catch (err) {
                console.error(`Error auto-filling field ${input.id}:`, err);
              }
            });
          });
            
          // Handle all checkbox groups
          const checkboxGroups = {};
            
          // Collect all checkboxes and group them by name
          document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const name = checkbox.name || checkbox.getAttribute('data-group') || checkbox.id || 'uncategorized';
            if (!checkboxGroups[name]) {
              checkboxGroups[name] = [];
            }
            checkboxGroups[name].push(checkbox);
          });
            
          // Fill each checkbox group
          Object.keys(checkboxGroups).forEach(groupName => {
            // Select random number of checkboxes from the group
            const checkboxes = checkboxGroups[groupName];
            const groupSize = checkboxes.length;
            if (groupSize === 0) return;
            
            // For single checkbox (like switches), 70% chance to check
            if (groupSize === 1) {
              checkboxes[0].checked = Math.random() < 0.7;
              return;
            }
            
            // For normal groups, select 30-70% of options
            const percentToSelect = getRandomNumber(30, 70) / 100;
            const numToSelect = Math.max(1, Math.floor(groupSize * percentToSelect));
            
            // Uncheck all first
            checkboxes.forEach(cb => cb.checked = false);
            
            // Select random checkboxes
            const shuffled = [...checkboxes].sort(() => 0.5 - Math.random());
            shuffled.slice(0, numToSelect).forEach(cb => cb.checked = true);
          });
            
          // Handle radio groups
          const radioGroups = {};
            
          // Collect all radio buttons and group them by name
          document.querySelectorAll('input[type="radio"]').forEach(radio => {
            const name = radio.name || 'uncategorized';
            if (!radioGroups[name]) {
              radioGroups[name] = [];
            }
            radioGroups[name].push(radio);
          });
            
          // Select one radio button from each group
          Object.keys(radioGroups).forEach(groupName => {
            const radios = radioGroups[groupName];
            if (radios.length === 0) return;
            
            // Select a random radio button
            const randomIndex = Math.floor(Math.random() * radios.length);
            radios[randomIndex].checked = true;
          });
            
          // Make sure required fields are all filled
          if (formStructure && formStructure.fields) {
            const requiredFields = formStructure.fields.filter(f => f.required);
            
            requiredFields.forEach(field => {
              const element = document.getElementById(field.id);
              if (!element) return;
              
              // Skip file inputs completely
              if (element.type === 'file') return;
              
              // Skip already filled fields
              if ((element.type === 'checkbox' || element.type === 'radio') && element.checked) return;
              if (element.value && element.value.trim() !== '') return;
              
              // Fill with appropriate random value based on field type
              if (element.type === 'checkbox') {
                element.checked = true;
              } else if (element.type === 'radio') {
                element.checked = true;
              } else if (element.tagName === 'SELECT') {
                if (element.options.length > 1) {
                  element.selectedIndex = getRandomNumber(1, element.options.length - 1);
                }
              } else if (element.tagName === 'TEXTAREA') {
                element.value = `Bu zorunlu bir ${field.label} alanıdır. Test için otomatik doldurulmuştur.`;
              } else {
                // Handle specific field types
                switch (field.type) {
                  case 'number':
                    element.value = getRandomNumber(1, 1000).toString();
                    break;
                  case 'email':
                    element.value = getRandomEmail();
                    break;
                  case 'tel':
                    element.value = getRandomPhone();
                    break;
                  case 'url':
                    element.value = getRandomURL();
                    break;
                  case 'date':
                    element.value = getRandomPastDate();
                    break;
                  default:
                    element.value = getRandomString(8);
                    break;
                }
              }
            });
          }
            
          // Hide loading overlay
          hideLoadingOverlay();
            
          // Validate form after filling
          if (typeof validateFormFields === 'function') {
            validateFormFields();
          }
            
          // Show success notification
          showSuccessMessage('Form alanları rastgele değerlerle dolduruldu');
            
          // Show notification about file inputs if there are any
          if (fileInputCount > 0) {
            setTimeout(() => {
              showNotification('Güvenlik nedeniyle dosya alanları otomatik doldurulamadı. Lütfen gerekli dosyaları manuel olarak seçiniz.', 'info', 6000);
            }, 1000);
          }
            
          console.log('Form has been auto-filled with random data for testing');
        } catch (error) {
          console.error('Error in auto-fill function:', error);
          hideLoadingOverlay();
          showErrorMessage('Otomatik doldurma sırasında bir hata oluştu: ' + error.message);
        }
      }, 300); // Small timeout to ensure UI updates
    });
  }

  // Turkey Districts Data
  const turkeyDistricts = {
    "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
    "Adıyaman": ["Adıyaman Merkez", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Samsat", "Sincik", "Tut"],
    "Afyonkarahisar": ["Afyonkarahisar Merkez", "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Sandıklı", "Sinanpaşa", "Şuhut", "Sultandağı"],
    "Ağrı": ["Ağrı Merkez", "Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Patnos", "Taşlıçay", "Tutak"],
    "Amasya": ["Amasya Merkez", "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merzifon", "Suluova", "Taşova"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
    "Artvin": ["Ardanuç", "Arhavi", "Artvin Merkez", "Borçka", "Hopa", "Murgul", "Şavşat", "Yusufeli"],
    "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
    "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
    "Bilecik": ["Bilecik Merkez", "Bozüyük", "Gölpazarı", "İnhisar", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
    "Bingöl": ["Adaklı", "Bingöl Merkez", "Genç", "Karlıova", "Kiğı", "Solhan", "Yayladere", "Yedisu"],
    "Bitlis": ["Adilcevaz", "Ahlat", "Bitlis Merkez", "Güroymak", "Hizan", "Mutki", "Tatvan"],
    "Bolu": ["Bolu Merkez", "Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Mudurnu", "Seben", "Yeniçağa"],
    "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Burdur Merkez", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Tefenni", "Yeşilova"],
    "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
    "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Çanakkale Merkez", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Yenice"],
    "Çankırı": ["Atkaracalar", "Bayramören", "Çankırı Merkez", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Orta", "Şabanözü", "Yapraklı"],
    "Çorum": ["Alaca", "Bayat", "Boğazkale", "Çorum Merkez", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
    "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
    "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
    "Edirne": ["Edirne Merkez", "Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Süloğlu", "Uzunköprü"],
    "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Elazığ Merkez", "Karakoçan", "Keban", "Kovancılar", "Maden", "Palu", "Sivrice"],
    "Erzincan": ["Çayırlı", "Erzincan Merkez", "İliç", "Kemah", "Kemaliye", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
    "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
    // Add more cities and their districts as needed
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
  };

  // City-District selection
  citySelect.addEventListener('change', function() {
    const selectedCity = this.value;
    // Clear the district dropdown
    districtSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Seçiniz';
    districtSelect.appendChild(defaultOption);
    
    // If a city is selected and it exists in our data
    if (selectedCity && turkeyDistricts[selectedCity]) {
      // Add districts for selected city
      turkeyDistricts[selectedCity].forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.text = district;
        districtSelect.appendChild(option);
      });
      // Enable district select
      districtSelect.disabled = false;
    } else {
      // Disable district select if no city selected
      districtSelect.disabled = true;
      defaultOption.text = 'Önce şehir seçiniz';
    }
  });

  // Initial district state should be disabled until a city is selected
  districtSelect.disabled = true;

  // File upload functionality
  fileUploadAreas.forEach(area => {
    const container = area.closest('.file-upload-container');
    const input = container.querySelector('input[type="file"]');
    const preview = container.querySelector('.file-preview');
    const removeButton = preview ? preview.querySelector('.remove-file') : null;
    
    // Trigger file input when clicking on the upload area
    area.addEventListener('click', () => {
      input.click();
    });
    
    // Handle file selection
    input.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        
        // Show preview
        if (preview) {
          preview.classList.remove('hidden');
          area.classList.add('hidden');
          
          // If it's an image, show image preview
          if (file.type.startsWith('image/')) {
            const img = preview.querySelector('img');
            if (img) {
              const reader = new FileReader();
              reader.onload = function(e) {
                img.src = e.target.result;
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    });
    
    // Remove file
    if (removeButton) {
      removeButton.addEventListener('click', function(e) {
        e.preventDefault();
        input.value = '';
        preview.classList.add('hidden');
        area.classList.remove('hidden');
        const img = preview.querySelector('img');
        if (img) img.src = '';
      });
    }
    
    // File drop functionality
    area.addEventListener('dragover', function(e) {
      e.preventDefault();
      area.classList.add('border-blue-500');
    });
    
    area.addEventListener('dragleave', function() {
      area.classList.remove('border-blue-500');
    });
    
    area.addEventListener('drop', function(e) {
      e.preventDefault();
      area.classList.remove('border-blue-500');
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        input.files = e.dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  });

  // Gallery functionality
  if (galleryUploadArea && galleryUploadInput) {
    galleryUploadArea.addEventListener('click', () => {
      galleryUploadInput.click();
    });
    
    galleryUploadInput.addEventListener('change', function() {
      handleGalleryFiles(this.files);
    });
    
    // Gallery file drop functionality
    galleryUploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      galleryUploadArea.classList.add('border-blue-500');
    });
    
    galleryUploadArea.addEventListener('dragleave', function() {
      galleryUploadArea.classList.remove('border-blue-500');
    });
    
    galleryUploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      galleryUploadArea.classList.remove('border-blue-500');
      
      if (e.dataTransfer.files.length > 0) {
        handleGalleryFiles(e.dataTransfer.files);
      }
    });
  }
  
  function handleGalleryFiles(files) {
    if (!files || files.length === 0) return;
    
    // Check if too many files (max 20)
    if (galleryPreview.children.length + files.length > 20) {
      showNotification('En fazla 20 fotoğraf yükleyebilirsiniz.', 'error');
      return;
    }
    
    // Process each file
    Array.from(files).forEach(file => {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        showNotification('Lütfen sadece resim dosyaları yükleyin.', 'error');
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showNotification('Dosya boyutu 50MB\'dan büyük olamaz.', 'error');
        return;
      }
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = function(e) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'w-full h-32 object-cover rounded';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center -mt-2 -mr-2';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', function() {
          imgContainer.remove();
        });
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(removeBtn);
        galleryPreview.appendChild(imgContainer);
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Submit form data
  async function submitForm() {
    showLoadingOverlay();
    console.log('Form gönderimi başladı');
    
    try {
      // Farklı yöntemlerle form elementini bulmayı dene
      let form = document.getElementById('facility-form');
      
      // İlk deneme başarısız olduysa, querySelector ile deneyelim
      if (!form) {
        console.warn('getElementById ile form bulunamadı, querySelector ile deneniyor...');
        form = document.querySelector('form');
      }
      
      // Hala bulunamadıysa, tüm form elementlerinden ilkini alalım
      if (!form) {
        console.warn('querySelector ile form bulunamadı, tüm formları kontrol ediyor...');
        const allForms = document.getElementsByTagName('form');
        if (allForms && allForms.length > 0) {
          form = allForms[0];
        }
      }
      
      // Form verilerini manuel olarak oluştur
      let formData = new FormData();
      
      // Form yapısından dinamik olarak veri topla
      if (formStructure && formStructure.fields) {
        console.log(`Form yapısı mevcut. ${formStructure.fields.length} alan üzerinden veri toplanıyor...`);
        
        // Form yapısındaki her alanı işle
        formStructure.fields.forEach(field => {
          // Alanı bul
          const element = document.getElementById(field.id);
          
          // Alan yoksa atla
          if (!element) {
            console.warn(`Alan bulunamadı: ${field.id}`);
            return;
          }
          
          // Alan türüne göre değeri al
          let value;
          
          switch (field.type) {
            case 'checkbox':
              // Checkbox grubu mu tekil checkbox mu?
              if (field.options && field.options.length > 0) {
                // Grup - tüm seçili değerleri topla
                const selected = [];
                field.options.forEach((option, index) => {
                  const checkbox = document.getElementById(`${field.id}_${index}`);
                  if (checkbox && checkbox.checked) {
                    selected.push(option);
                  }
                });
                value = selected.join(',');
              } else {
                // Tekil checkbox
                value = element.checked;
              }
              break;
              
            case 'radio':
              // Tüm radio butonlarını kontrol et
              if (field.options && field.options.length > 0) {
                for (let i = 0; i < field.options.length; i++) {
                  const radio = document.getElementById(`${field.id}_${i}`);
                  if (radio && radio.checked) {
                    value = field.options[i];
                    break;
                  }
                }
              }
              break;
              
            case 'file':
              // Dosya alanları özel işlenir
              if (element.files && element.files.length > 0) {
                for (let i = 0; i < element.files.length; i++) {
                  formData.append(field.id, element.files[i]);
                }
                // Dosya alanları aşağıdaki value atamasını kullanmaz
                value = undefined; // Value'yu undefined olarak işaretle
              }
              break;
              
            default:
              // Metin, sayı, e-posta vb. için doğrudan değeri al
              value = element.value;
          }
          
          // Değeri formData'ya ekle
          if (value !== undefined) {
            formData.append(field.id, value);
          }
        });
      } else {
        console.warn('Form yapısı bulunamadı. Sayfadaki tüm form alanları kullanılacak.');
        
        // Son çare - doğrudan document üzerinden veri toplayalım
        console.log('Form dışı modda devam ediliyor...');
        
        // Sayfadaki tüm form elemanlarını topla
        const allInputs = document.querySelectorAll('input, select, textarea');
        if (allInputs.length === 0) {
          hideLoadingOverlay();
          showErrorMessage('Form elementleri bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
          return;
        }
        
        console.log(`Form bulunamadı ama ${allInputs.length} form elementi bulundu. İşleme devam ediliyor...`);
        
        // Tüm input elementlerinden veri topla
        allInputs.forEach(element => {
          // Checkbox veya radio butonları sadece işaretliyse ekle
          if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
            return;
          }
          
          // Dosya input'ları için tüm dosyaları ekle
          if (element.type === 'file' && element.files && element.files.length > 0) {
            for (let i = 0; i < element.files.length; i++) {
              formData.append(element.name || element.id, element.files[i]);
            }
          } 
          // Diğer elementler için değeri ekle
          else if (element.name || element.id) {
            formData.append(element.name || element.id, element.value);
          }
        });
      }
      
      // Debug için form verilerini logla
      try {
        console.log('Form verileri hazırlanıyor:', Object.fromEntries(formData));
      } catch (err) {
        console.warn('Form verilerini log edemedik:', err);
      }
      
      // Form verilerini işleyip gönder
      processFormSubmission(formData, form);
      
    } catch (error) {
      console.error('Form gönderim hatası:', error);
      hideLoadingOverlay();
      showErrorMessage(`Form gönderilirken bir hata oluştu: ${error.message}`);
    }
  }
  
  // Form verilerini işleyip sunucuya gönderen yardımcı fonksiyon
  async function processFormSubmission(formData, form) {
    console.log('Form verileri işleniyor...');
    
    try {
      // Debug: Tüm form verilerini konsola yazdır
      console.log('Form verileri kontrol ediliyor:');
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Debug: Tüm zorunlu alanları logla
      if (formStructure && formStructure.fields) {
        const requiredFields = formStructure.fields.filter(field => field.required);
        console.log('Zorunlu alanlar:', requiredFields.map(f => f.id));
      
        // Eksik alanları kontrol et
        let missingFields = [];
        
        for (const field of requiredFields) {
          const value = formData.get(field.id);
          console.log(`Kontrol: Alan ${field.id}, Değer: ${value}, Tip: ${typeof value}`);
          
          if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(field);
            console.error(`Eksik alan: ${field.id} (${field.label})`);
          }
        }
        
        if (missingFields.length > 0) {
          // Kullanıcıya eksik alanları göster
          let errorMessage = 'Lütfen aşağıdaki zorunlu alanları doldurun: <br>';
          missingFields.forEach(field => {
            errorMessage += `- ${field.label}<br>`;
            
            // İlgili form alanını vurgula
            const fieldElement = document.getElementById(field.id);
            if (fieldElement) {
              fieldElement.classList.add('border-red-500');
              fieldElement.classList.add('bg-red-50');
              
              // Focus ilk eksik alana
              if (fieldElement === missingFields[0].id) {
                fieldElement.focus();
              }
            }
          });
          
          hideLoadingOverlay();
          showErrorMessage(errorMessage);
          return;
        }
      }
      
      // Form verilerini sunucuya gönder
      console.log('Form verileri sunucuya gönderiliyor...');
      
      // Seçili branşları, hizmetleri ve özellikleri ekle
      try {
        // Get values by name attribute instead of class
        const branches = getSelectedCheckboxValuesByName('medicalBranches');
        formData.set('medicalBranches', branches.join(','));
        
        const treatments = getSelectedCheckboxValuesByName('specializedTreatments');
        formData.set('specializedTreatments', treatments.join(','));
        
        const amenities = getSelectedCheckboxValuesByName('facilityAmenities');
        formData.set('facilityAmenities', amenities.join(','));
        
        const supportServices = getSelectedCheckboxValuesByName('supportServices');
        formData.set('supportServices', supportServices.join(','));
        
        const languages = getSelectedCheckboxValuesByName('serviceLanguages');
        formData.set('serviceLanguages', languages.join(','));
        
        // For payment methods, we need to collect individual checkbox values
        const paymentMethods = [];
        ['cash', 'eft', 'wire', 'visa', 'mastercard', 'amex', 'visaElectron', 'debitCard', 'maestroDebitCard'].forEach(method => {
          const checkbox = document.getElementById(method);
          if (checkbox && checkbox.checked) {
            paymentMethods.push(checkbox.nextElementSibling.textContent.trim());
          }
        });
        formData.set('paymentMethods', paymentMethods.join(','));
        
        // For services in the general info tab
        const services = [];
        document.querySelectorAll('input[name="healthServices"]:checked').forEach(checkbox => {
          services.push(checkbox.value);
        });
        formData.set('services', services.join(','));
        
        // Log collected data for debugging
        console.log('Collected form data:');
        console.log('- Medical Branches:', branches);
        console.log('- Specialized Treatments:', treatments);
        console.log('- Facility Amenities:', amenities);
        console.log('- Support Services:', supportServices);
        console.log('- Service Languages:', languages);
        console.log('- Payment Methods:', paymentMethods);
        console.log('- Services:', services);
      } catch (checkboxError) {
        console.error('Checkbox değerleri alınırken hata:', checkboxError);
        // Devam et, bu kritik bir hata değil
      }
      
      console.log('Tüm veriler formData nesnesine eklendi, gönderiliyor...');
      
      // Form verilerini sunucuya gönder
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`Yeniden deneme ${retryCount}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
          
          response = await fetch('/submit-application', {
            method: 'POST',
            body: formData
          });
          
          break; // If fetch succeeds, exit the loop
        } catch (fetchError) {
          console.error(`Fetch hatası (deneme ${retryCount + 1}/${maxRetries + 1}):`, fetchError);
          retryCount++;
          
          if (retryCount > maxRetries) {
            hideLoadingOverlay();
            showErrorMessage('Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
            return;
          }
        }
      }
      
      // Try to get response data
      let result;
      try {
        result = await response.json();
        console.log('Sunucu yanıtı:', result);
      } catch (jsonError) {
        console.error('JSON ayrıştırma hatası:', jsonError);
        hideLoadingOverlay();
        showErrorMessage('Sunucu yanıtı işlenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        return;
      }
      
      // Check response status
      if (!response.ok) {
        hideLoadingOverlay();
        const errorMessage = result?.message || `Sunucu hatası: ${response.status} ${response.statusText}`;
        
        // Show a more detailed error message for 500 errors
        if (response.status === 500) {
          console.error('500 hata detayları:', result);
          const detailedError = result?.error ? `Detay: ${result.error}` : 'Sunucu kayıt işlemi başarısız oldu.';
          showErrorMessage(`Sunucu işlem hatası (500). ${detailedError} Lütfen daha sonra tekrar deneyiniz veya yardım için yöneticinize başvurunuz.`);
        } else {
          showErrorMessage(errorMessage);
        }
        return;
      }
      
      // Başvuru numarasını al
      let applicationId = null;
      
      // Farklı seçenekleri kontrol et
      if (result && typeof result.applicationId === 'string') {
        applicationId = result.applicationId;
        console.log('Başvuru ID direkt alındı:', applicationId);
      } 
      else if (result && result.data && typeof result.data.applicationId === 'string') {
        applicationId = result.data.applicationId;
        console.log('Başvuru ID data nesnesi içinden alındı:', applicationId);
      }
      
      if (!applicationId) {
        console.error('Başvuru numarası bulunamadı:', result);
        hideLoadingOverlay();
        showErrorMessage('Başvuru numarası alınamadı. Lütfen yöneticiye başvurun.');
        return;
      }
      
      // Yükleme ekranını kapat
      hideLoadingOverlay();
      
      // Son gönderilen başvuruyu kaydet
      lastSubmittedApplication = {
        facilityName: form && form.elements && form.elements.facilityName ? form.elements.facilityName.value : 'Form Bilgisi',
        applicationId: applicationId,
        dateSubmitted: new Date().toLocaleString('tr-TR'),
        formData: {}
      };
      
      // Form verilerini çık
      for (let [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          lastSubmittedApplication.formData[key] = value;
        }
      }
      
      // Başvuru başarı modülünü göster
      showApplicationSuccessModal(applicationId);
      
      // Form alanlarını temizle
      if (form) {
        try {
          form.reset();
        } catch (e) {
          console.warn('Form reset hatası:', e);
        }
      }
      clearFileUploads();
      clearGalleryPreview();
      
      // Başarı durumunu durum çubuğuna yansıt
      if (statusFormStep) {
        statusFormStep.textContent = 'Başvuru Tamamlandı';
      }
      if (statusCompletedFields) {
        statusCompletedFields.textContent = '5/5 alan dolduruldu';
        statusCompletedFields.classList.add('text-green-600');
      }
    } catch (error) {
      console.error('Form gönderim hatası:', error);
      hideLoadingOverlay();
      showErrorMessage(`Form gönderilirken beklenmeyen bir hata oluştu: ${error.message}`);
    }
  }

  // Yeni başarı modalı fonksiyonu
  function showApplicationSuccessModal(applicationId) {
    console.log('Başarı modalı gösteriliyor, başvuru numarası:', applicationId);
    
    // Modal overlay oluştur
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center';
    
    // Modal içeriği oluştur
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 mx-4';
    
    // Modal header başarı ikonu
    const modalHeader = document.createElement('div');
    modalHeader.className = 'text-center mb-6';
    modalHeader.innerHTML = `
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-5">
        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">Başvurunuz Alınmıştır</h2>
    `;
    
    // Başvuru numarası bölümü
    const applicationIdSection = document.createElement('div');
    applicationIdSection.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center';
    applicationIdSection.innerHTML = `
      <p class="text-blue-800 mb-2">Başvuru numaranızı lütfen kayıt ediniz:</p>
      <div class="flex items-center justify-center">
        <span id="application-id-display" class="font-mono text-xl font-bold text-blue-900 mr-2">${applicationId}</span>
        <button id="copy-application-id" class="p-1 text-blue-700 hover:text-blue-900" title="Kopyala">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
          </svg>
        </button>
      </div>
    `;
    
    // İşlem butonları
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-3';
    actionButtons.innerHTML = `
      <button id="view-application-btn" class="w-full sm:w-auto px-5 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        Başvuruyu Görüntüle
      </button>
      <button id="download-pdf-btn" class="w-full sm:w-auto px-5 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        PDF Olarak İndir
      </button>
    `;
    
    // Zamanlayıcı bilgisi
    const timerInfo = document.createElement('div');
    timerInfo.className = 'mt-6 text-center text-gray-600';
    timerInfo.innerHTML = `
      <p class="text-sm">
        <span id="countdown">15</span> saniye içinde form sayfasına yönlendirileceksiniz.
      </p>
    `;
    
    // DOM'a ekle
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(applicationIdSection);
    modalContent.appendChild(actionButtons);
    modalContent.appendChild(timerInfo);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Kopyalama işlevselliği
    document.getElementById('copy-application-id').addEventListener('click', function() {
      const applicationIdText = document.getElementById('application-id-display').textContent;
      navigator.clipboard.writeText(applicationIdText)
        .then(() => {
          // Kopyalama başarılı olduğunda bir feedback göster
          const copyButton = document.getElementById('copy-application-id');
          const originalHTML = copyButton.innerHTML;
          copyButton.innerHTML = `
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `;
          
          setTimeout(() => {
            copyButton.innerHTML = originalHTML;
          }, 2000);
        })
        .catch(err => {
          console.error('Kopyalama başarısız:', err);
        });
    });
    
    // Buton işlevselliği
    document.getElementById('view-application-btn').addEventListener('click', function() {
      document.body.removeChild(modalOverlay);
      viewApplication();
    });
    
    document.getElementById('download-pdf-btn').addEventListener('click', function() {
      generatePDF();
    });
    
    // Geri sayım sayacı
    let countdown = 15;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
      countdown -= 1;
      countdownElement.textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        document.body.removeChild(modalOverlay);
        window.location.href = '/';
      }
    }, 1000);
  }
  
  // Başvuru detaylarını görüntüleme fonksiyonu
  function viewApplication() {
    if (!lastSubmittedApplication) {
      showNotification('Başvuru bilgileri bulunamadı.', 'error');
      return;
    }
    
    showLoadingOverlay();
    
    setTimeout(() => {
      // Yükleme ekranını kaldır
      hideLoadingOverlay();
      
      // Modal overlay oluştur
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto';
      
      // Formdan verileri al
      const appData = lastSubmittedApplication.formData;
      
      // Tüm sekmeleri ve alanları dinamik olarak oluştur
      let sectionsHTML = '';
      
      // Başvuru Bilgileri section - her zaman gösterilir
      sectionsHTML += `
        <section class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Başvuru Bilgileri</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-700">Başvuru Numarası</p>
              <p class="text-sm text-gray-900">${lastSubmittedApplication.applicationId || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Başvuru Tarihi</p>
              <p class="text-sm text-gray-900">${lastSubmittedApplication.dateSubmitted || 'Belirtilmemiş'}</p>
            </div>
          </div>
        </section>
      `;
      
      // Form yapısından bölümleri al ve oluştur
      if (formStructure && formStructure.sections) {
        // Bölümleri sırala
        const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
        
        // Her bölüm için bir section oluştur
        sortedSections.forEach(section => {
          sectionsHTML += `
            <section class="mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">${section.title}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          `;
          
          // Bu bölüme ait alanları bul
          const sectionFields = formStructure.fields
            .filter(field => field.section === section.id)
            .sort((a, b) => a.order - b.order);
          
          // Her alan için veri görüntüleme alanı ekle
          sectionFields.forEach(field => {
            const fieldValue = appData[field.id] || 'Belirtilmemiş';
            let displayValue = fieldValue;
            
            // Alan türüne göre değeri formatla
            if (field.type === 'checkbox' && field.options && field.options.length > 0) {
              // Checkbox grubu - seçili değerleri virgülle ayır
              if (Array.isArray(fieldValue)) {
                displayValue = fieldValue.join(', ');
              } else if (typeof fieldValue === 'string' && fieldValue.includes(',')) {
                displayValue = fieldValue;
              } else if (fieldValue === true || fieldValue === 'true') {
                displayValue = 'Evet';
              } else if (fieldValue === false || fieldValue === 'false') {
                displayValue = 'Hayır';
              }
            }
            
            // Alan için HTML ekle - uzun alanlar 2 sütun kaplar
            const spanClass = (field.type === 'textarea' || field.type === 'file') ? 'md:col-span-2' : '';
            
            sectionsHTML += `
              <div class="${spanClass}">
                <p class="text-sm font-medium text-gray-700">${field.label}</p>
                <p class="text-sm text-gray-900">${displayValue}</p>
              </div>
            `;
          });
          
          sectionsHTML += `
              </div>
            </section>
          `;
        });
      } else {
        // Form yapısı yoksa, tüm form verilerini düz bir liste olarak göster
        sectionsHTML += `
          <section class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Form Verileri</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        
        // Form verilerini key-value çiftleri olarak göster
        for (const [key, value] of Object.entries(appData)) {
          if (key.startsWith('file') || key === 'gallery') continue; // Dosya alanlarını atla
          
          sectionsHTML += `
            <div>
              <p class="text-sm font-medium text-gray-700">${key}</p>
              <p class="text-sm text-gray-900">${value || 'Belirtilmemiş'}</p>
            </div>
          `;
        }
        
        sectionsHTML += `
            </div>
          </section>
        `;
      }
      
      // Dosya ve galeri bölümü
      let fileSection = `
        <section class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Dosya ve Fotoğraflar</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      `;
      
      // Tesis görseli
      if (appData.facilityImageName) {
        const imgPath = appData.facilityImagePath || `/uploads/${appData.facilityImageName}`;
        fileSection += `
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Tesis Görseli</p>
            <img src="${imgPath}" alt="Tesis Görseli" class="h-48 w-auto object-cover rounded">
          </div>
        `;
      }
      
      // Tesis logosu
      if (appData.facilityLogoName) {
        const logoPath = appData.facilityLogoPath || `/uploads/${appData.facilityLogoName}`;
        fileSection += `
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Tesis Logosu</p>
            <img src="${logoPath}" alt="Tesis Logosu" class="h-32 w-auto object-contain rounded">
          </div>
        `;
      }
      
      // Diğer dosya alanlarını bul ve göster
      formStructure.fields.forEach(field => {
        if (field.type === 'file' && appData[field.id + 'Name']) {
          const filePath = appData[field.id + 'Path'] || `/uploads/${appData[field.id + 'Name']}`;
          
          // Resim mi, belge mi kontrol et
          const fileExt = appData[field.id + 'Name'].split('.').pop().toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);
          
          if (isImage) {
            fileSection += `
              <div>
                <p class="text-sm font-medium text-gray-700">${field.label}</p>
                <img src="${filePath}" alt="${field.label}" class="h-48 w-auto object-cover rounded">
              </div>
            `;
          } else {
            fileSection += `
              <div>
                <p class="text-sm font-medium text-gray-700">${field.label}</p>
                <a href="${filePath}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Belgeyi görüntüle
                </a>
              </div>
            `;
          }
        }
      });
      
      // Galeri bölümü
      const gallery = appData.gallery ? 
        (typeof appData.gallery === 'string' ? JSON.parse(appData.gallery) : appData.gallery) : 
        [];
      
      if (gallery && gallery.length > 0) {
        fileSection += `
          <div class="md:col-span-2 mt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Tesis Galerisi</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        `;
        
        gallery.forEach(img => {
          // Determine image path (could be a full path or just the filename)
          const imgPath = img.startsWith('/') || img.startsWith('http') ? 
            img : 
            `/uploads/${img}`;
          
          fileSection += `
            <div class="aspect-w-4 aspect-h-3">
              <img src="${imgPath}" alt="Galeri Görseli" class="object-cover rounded">
            </div>
          `;
        });
        
        fileSection += `
            </div>
          </div>
        `;
      }
      
      fileSection += `
          </div>
        </section>
      `;
      
      // PDF indirme butonu
      const pdfButton = `
        <div class="mt-6 text-center">
          <button id="download-pdf-btn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            PDF İndir
          </button>
        </div>
      `;
      
      // Modal içeriği
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full p-8 m-4 overflow-y-auto max-h-screen';
      modalContent.innerHTML = `
        <div class="flex justify-between items-start">
          <h2 class="text-xl font-bold text-gray-900 mr-8">Başvuru Detayları</h2>
          <button id="close-modal-btn" class="text-gray-400 hover:text-gray-500 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="mt-4">
          ${sectionsHTML}
          ${fileSection}
          ${pdfButton}
        </div>
      `;
      
      // Modalı ekle
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
      
      // Kapat butonunu etkinleştir
      document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
      });
      
      // PDF indirme butonunu etkinleştir
      document.getElementById('download-pdf-btn').addEventListener('click', () => {
        generatePDF();
      });
      
      // Esc tuşu ile modalı kapat
      window.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape' && document.body.contains(modalOverlay)) {
          document.body.removeChild(modalOverlay);
          window.removeEventListener('keydown', closeOnEsc);
        }
      });
    }, 500);
  }

  // Show loading overlay with progress bar
  function showLoadingOverlay() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center';
    
    const loadingContent = document.createElement('div');
    loadingContent.className = 'bg-white rounded-lg p-8 max-w-md w-full flex flex-col items-center';
    
    loadingContent.innerHTML = `
      <svg class="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">İşleminiz yapılıyor</h3>
      <p class="text-sm text-gray-500 mb-4">Lütfen bekleyiniz...</p>
      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div id="progress-bar" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
      </div>
      <p id="progress-text" class="text-sm text-gray-500">0%</p>
    `;
    
    loadingOverlay.appendChild(loadingContent);
    document.body.appendChild(loadingOverlay);
    
    // Simulate progress for better UX
    simulateProgress();
  }
  
  // Hide loading overlay
  function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      document.body.removeChild(loadingOverlay);
    }
  }
  
  // Simulate progress
  function simulateProgress() {
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    const interval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(interval);
        return;
      }
      
      // Faster at first, then slow down
      const increment = progress < 60 ? 5 : progress < 80 ? 3 : progress < 90 ? 1 : 0.5;
      progress = Math.min(progress + increment, 100);
      
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `${Math.round(progress)}%`;
    }, 100);
  }

  // Helper function to reset file uploads
  function resetFileUploads() {
    fileUploadAreas.forEach(area => {
      const container = area.closest('.file-upload-container');
      const preview = container.querySelector('.file-preview');
      
      if (preview) {
        preview.classList.add('hidden');
        area.classList.remove('hidden');
        const img = preview.querySelector('img');
        if (img) img.src = '';
      }
    });
  }

  // Helper function to show notifications with extended duration option
  function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
      type === 'success' ? 'bg-green-100 text-green-800' : 
      type === 'error' ? 'bg-red-100 text-red-800' : 
      'bg-blue-100 text-blue-800'
    }`;
    notification.innerHTML = message;
    
    // Add notification to document
    document.body.appendChild(notification);
    
    // Remove notification after specified duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, duration);
  }

  // Başarı mesajını göster
  function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5 saniye sonra mesajı kaldır
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }

  // Hata mesajını göster
  function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5 saniye sonra mesajı kaldır
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }

  // PDF oluşturma fonksiyonu
  function generatePDF() {
    if (!lastSubmittedApplication) {
      showNotification('Başvuru bilgileri bulunamadı.', 'error');
      return;
    }
    
    // Yükleme ekranını göster
    showLoadingOverlay();
    
    // PDF oluşturmak için gerekli kütüphaneyi yükle
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    
    // Gerekli kütüphanenin yüklenmesini bekle
    jspdfScript.onload = function() {
      // Kütüphane yüklendi, PDF oluşturmaya başla
      createPDFContent();
    };
    
    // Hata durumu için
    jspdfScript.onerror = function() {
      hideLoadingOverlay();
      showNotification('PDF oluşturmak için gereken kütüphaneler yüklenemedi.', 'error');
    };
    
    // Kütüphaneyi yüklemeye başla
    document.body.appendChild(jspdfScript);
    
    // Başvuru verileriyle PDF içeriği oluştur
    function createPDFContent() {
      try {
        // Başvuru verilerini al
        const appData = lastSubmittedApplication.formData;
        
        // Format data arrays - tüm verileri işle
        const medicalBranches = appData.medicalBranches ? appData.medicalBranches.split(',') : [];
        const specializedTreatments = appData.specializedTreatments ? appData.specializedTreatments.split(',') : []; 
        const facilityAmenities = appData.facilityAmenities ? appData.facilityAmenities.split(',') : [];
        const supportServices = appData.supportServices ? appData.supportServices.split(',') : [];
        const serviceLanguages = appData.serviceLanguages ? appData.serviceLanguages.split(',') : [];
        const paymentMethods = appData.paymentMethods ? appData.paymentMethods.split(',') : [];
        const services = appData.services ? appData.services.split(',') : [];
        
        // PDF oluştur - A4 formatında, portrait
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Türkçe karakter sorunları için encoding kullan
        function turkishText(text) {
          if (!text) return 'Belirtilmemis';
          if (typeof text !== 'string') {
            try {
              text = String(text);
            } catch (e) {
              return 'Belirtilmemis';
            }
          }
          
          // Türkçe karakterler için encode et
          return text
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'C')
            .replace(/ğ/g, 'g')
            .replace(/Ğ/g, 'G')
            .replace(/ı/g, 'i')
            .replace(/İ/g, 'I')
            .replace(/ö/g, 'o')
            .replace(/Ö/g, 'O')
            .replace(/ş/g, 's')
            .replace(/Ş/g, 'S')
            .replace(/ü/g, 'u')
            .replace(/Ü/g, 'U');
        }
        
        // Başlık ve Logo Alanı
        doc.setFillColor(0, 51, 153); // Lacivert Başlık alanı rengi
        doc.rect(0, 0, 210, 18, 'F');
        
        doc.setTextColor(255, 255, 255); // Beyaz renk
        doc.setFontSize(14); // Başlık fontunu küçült (16'dan 14'e)
        doc.setFont(undefined, 'bold');
        doc.text('SAGLIK TESISI BASVURU FORMU', 105, 10, { align: 'center' });
        
        // Başlık altı bilgiler
        doc.setTextColor(0, 0, 0); // Siyah renk
        doc.setFontSize(9); // Başlık altı bilgilerin fontunu küçült (11'den 9'a)
        doc.setFont(undefined, 'normal');
        doc.text(`Basvuru No: ${lastSubmittedApplication.applicationId}`, 15, 25);
        doc.text(`Tarih: ${lastSubmittedApplication.dateSubmitted}`, 15, 30);
        
        // Ayraç çizgisi
        doc.setDrawColor(0, 51, 153);
        doc.setLineWidth(0.5);
        doc.line(15, 33, 195, 33);
        
        // İçeriği oluştur
        let y = 40;
        const rowHeight = 6; // Satır yüksekliğini azalt (7'den 6'ya)
        
        // Form yapısından bölümleri işle
        if (formStructure && formStructure.sections) {
          // Bölümleri sırala
          const sortedSections = [...formStructure.sections].sort((a, b) => a.order - b.order);
          
          // Her bölüm için
          for (const section of sortedSections) {
            // Bölüm başlığı
            doc.setFontSize(12); // Bölüm başlık fontunu küçült (14'ten 12'ye)
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 51, 153);
            doc.text(turkishText(section.title).toUpperCase(), 15, y);
            y += 7; // Başlıktan sonraki boşluğu azalt (8'den 7'ye)
            
            // Üstbilgi çizgisi
            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(240, 240, 240);
            doc.rect(15, y-5, 180, 6, 'F');
            
            // Bu bölüme ait alanları bul
            const sectionFields = formStructure.fields
              .filter(field => field.section === section.id)
              .sort((a, b) => a.order - b.order);
            
            if (sectionFields.length === 0) {
              doc.setFontSize(9); // Boş bölüm mesajı fontunu küçült (10'dan 9'a)
              doc.setFont(undefined, 'normal');
              doc.setTextColor(0, 0, 0);
              doc.text('Bu bölümde veri bulunmamaktadır.', 15, y);
              y += rowHeight + 4; // Boşluğu azalt (5'ten 4'e)
              continue;
            }
            
            // Her iki alanı yan yana göster (grid yapısı)
            for (let i = 0; i < sectionFields.length; i += 2) {
              // Sayfa sınırını kontrol et
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
              
              const field1 = sectionFields[i];
              const field2 = i + 1 < sectionFields.length ? sectionFields[i + 1] : null;
              
              // İlk alan değerini al
              let value1 = appData[field1.id] || 'Belirtilmemis';
              if (field1.type === 'checkbox' && field1.options && field1.options.length > 0) {
                if (Array.isArray(value1)) {
                  value1 = value1.join(', ');
                } else if (typeof value1 === 'string' && value1.includes(',')) {
                  // değer zaten string
                } else if (value1 === true || value1 === 'true') {
                  value1 = 'Evet';
                } else if (value1 === false || value1 === 'false') {
                  value1 = 'Hayır';
                }
              }
              
              // İkinci alan değerini al (varsa)
              let value2 = '';
              if (field2) {
                value2 = appData[field2.id] || 'Belirtilmemis';
                if (field2.type === 'checkbox' && field2.options && field2.options.length > 0) {
                  if (Array.isArray(value2)) {
                    value2 = value2.join(', ');
                  } else if (typeof value2 === 'string' && value2.includes(',')) {
                    // değer zaten string
                  } else if (value2 === true || value2 === 'true') {
                    value2 = 'Evet';
                  } else if (value2 === false || value2 === 'false') {
                    value2 = 'Hayır';
                  }
                }
              }
              
              // Genişletilmiş alanlar için (textarea)
              if (field1.type === 'textarea') {
                doc.setFontSize(9); // Textarea alan başlık fontunu küçült (10'dan 9'a)
                doc.setFont(undefined, 'bold');
                doc.text(turkishText(field1.label) + ':', 15, y);
                doc.setFont(undefined, 'normal');
                
                const textLines = doc.splitTextToSize(turkishText(value1), 180);
                y += rowHeight - 1; // Boşluğu azalt
                doc.text(textLines, 15, y);
                y += (textLines.length * 4) + 2; // Satır aralığını azalt (5'ten 4'e)
                
                // İkinci alan varsa
                if (field2) {
                  // Sayfa sınırını kontrol et
                  if (y > 270) {
                    doc.addPage();
                    y = 20;
                  }
                  
                  doc.setFont(undefined, 'bold');
                  doc.text(turkishText(field2.label) + ':', 15, y);
                  doc.setFont(undefined, 'normal');
                  
                  const textLines2 = doc.splitTextToSize(turkishText(value2), 180);
                  y += rowHeight - 1; // Boşluğu azalt
                  doc.text(textLines2, 15, y);
                  y += (textLines2.length * 4) + 2; // Satır aralığını azalt (5'ten 4'e)
                }
              } 
              // Normal alanlar için iki sütun kullan
              else {
                // Alan fontlarını küçült
                doc.setFontSize(8); // Metin fontunu 10'dan 8'e küçült
                y = addInfoRow(
                  doc, 
                  turkishText(field1.label) + ':', 
                  turkishText(value1), 
                  field2 ? turkishText(field2.label) + ':' : '', 
                  field2 ? turkishText(value2) : '', 
                  15, 65, 115, 165, y
                );
              }
            }
            
            // Bölümler arası boşluk
            y += 4; // Boşluğu azalt (5'ten 4'e)
          }
        } 
        // Form yapısı yoksa varsayılan görünüm
        else {
          // Temel bilgileri göster
          doc.setFontSize(12); // Başlık fontunu küçült (14'ten 12'ye)
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 51, 153);
          doc.text('TESIS BILGILERI', 15, y);
          y += 7; // Boşluğu azalt (8'den 7'ye)
          
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(240, 240, 240);
          doc.rect(15, y-5, 180, 6, 'F');
          
          // Tüm verileri dolaş ve göster
          doc.setFontSize(8); // Veri fontunu küçült (10'dan 8'e)
          doc.setTextColor(0, 0, 0);
          
          // İkili sütunlar halinde bilgileri listeleme
          const keys = Object.keys(appData);
          for (let i = 0; i < keys.length; i += 2) {
            // Sayfa sınırını kontrol et
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            
            const key1 = keys[i];
            const key2 = i + 1 < keys.length ? keys[i + 1] : null;
            
            // Dosya ve galeri alanlarını atla
            if (key1.startsWith('file') || key1 === 'gallery') continue;
            if (key2 && (key2.startsWith('file') || key2 === 'gallery')) continue;
            
            y = addInfoRow(
              doc, 
              turkishText(key1) + ':', 
              turkishText(appData[key1]), 
              key2 ? turkishText(key2) + ':' : '', 
              key2 ? turkishText(appData[key2]) : '', 
              15, 65, 115, 165, y
            );
          }
        }
        
        // Altbilgi - Tüm sayfalara
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Footer bilgisi
          doc.setDrawColor(0, 51, 153);
          doc.setLineWidth(0.5);
          doc.line(15, 280, 195, 280);
          
          doc.setFontSize(7); // Altbilgi fontunu küçült (8'den 7'ye)
          doc.setTextColor(100, 100, 100);
          doc.text(`Saglik Tesisi Kayit Basvurusu - ${lastSubmittedApplication.applicationId}`, 105, 287, { align: 'center' });
          doc.text(`Sayfa ${i} / ${pageCount}`, 195, 287, { align: 'right' });
        }
        
        // PDF dosya adı oluştur
        const pdfFileName = `Saglik_Tesisi_Basvuru_${lastSubmittedApplication.applicationId || 'Form'}.pdf`;
        
        try {
          // PDF'i indir
          doc.save(pdfFileName);
          
          // Yükleme ekranını kapat
          hideLoadingOverlay();
          
          // Başarı mesajı göster
          showNotification('PDF başarıyla oluşturuldu ve indirildi.', 'success');
        } catch (saveError) {
          console.error('PDF kaydedilirken hata oluştu:', saveError);
          hideLoadingOverlay();
          showNotification('PDF kaydedilirken bir hata oluştu: ' + saveError.message, 'error');
        }
        
        return pdfFileName;
      } catch (error) {
        console.error('PDF oluşturulurken hata oluştu:', error);
        hideLoadingOverlay();
        showNotification('PDF oluşturulurken bir hata oluştu: ' + error.message, 'error');
        return null;
      }
    }
    
    // Yardımcı fonksiyon - PDF'e iki sütun halinde bilgi satırı ekler
    function addInfoRow(doc, label1, value1, label2, value2, x1, x2, x3, x4, y) {
      // Etiket için kalın yazı
      doc.setFont(undefined, 'bold');
      doc.text(label1, x1, y);
      
      // Değer için normal yazı
      doc.setFont(undefined, 'normal');
      // value1 zaten turkishText fonksiyonundan geçmiş olmalı
      doc.text(value1, x2, y);
      
      // İkinci sütun boş değilse ekle
      if (label2 && label2.trim() !== '') {
        doc.setFont(undefined, 'bold');
        doc.text(label2, x3, y);
        
        doc.setFont(undefined, 'normal');
        // value2 zaten turkishText fonksiyonundan geçmiş olmalı
        doc.text(value2, x4, y);
      }
      
      return y + 6; // Sonraki satırın y konumunu döndür, satır aralığını azalt (7'den 6'ya)
    }
    
    // turkishText helper fonksiyonu - addInfoRow içinde kullanılıyor
    function turkishText(text) {
      if (!text) return 'Belirtilmemis';
      
      // Türkçe karakterler için encode et
      return text
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U');
    }
  }

  // Helper function to clear file uploads
  function clearFileUploads() {
    try {
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        input.value = '';
      });
      
      // Reset file preview areas
      fileUploadAreas.forEach(area => {
        const container = area.closest('.file-upload-container');
        if (container) {
          const preview = container.querySelector('.file-preview');
          if (preview) {
            preview.classList.add('hidden');
            area.classList.remove('hidden');
            const img = preview.querySelector('img');
            if (img) img.src = '';
          }
        }
      });
      
      console.log('File uploads cleared');
    } catch (error) {
      console.error('Error clearing file uploads:', error);
      // Non-critical error, continue
    }
  }

  // Show loading overlay with custom message
  function showLoadingOverlay(message = 'Yükleniyor...') {
    const loadingOverlay = document.getElementById('loading-overlay') || createLoadingOverlay();
    const messageElement = loadingOverlay.querySelector('.loading-message');
    
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
  }

  // Create loading overlay if it doesn't exist
  function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed top-0 left-0 w-full h-full bg-white bg-opacity-80 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-blue-600 font-semibold loading-message">Yükleniyor...</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // Hide loading overlay
  function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}); 