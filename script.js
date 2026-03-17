$(document).ready(function() {
    // File Picker UI - Click to upload
    $('#fileZone').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('filePicker').click();
    });

    // Handle file selection via click
    $('#filePicker').on('change', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            $('#fileName').html(`Selected: <strong>${fileName}</strong>`);
            $('#fileZone').css('border-color', 'var(--cobalt)');
        } else {
            $('#fileName').text("Select file to upload");
            $('#fileZone').css('border-color', 'var(--gray-200)');
        }
    });

    // Upload button functionality
    $('#uploadBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const fileInput = document.getElementById('filePicker');
        const folderId = $('#folderId').val();
        const isFolderIdTab = $('#tabFolderId').hasClass('active');
        
        // Check if user is connected to Drive
        if (!$('.drive-badge').hasClass('connected')) {
            alert('Please connect to Google Drive first');
            return;
        }
        
        // Check if file is selected
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Please select a file to upload');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Show uploading status
        const originalText = $('#uploadBtn').html();
        $('#uploadBtn').html('<i class="fas fa-spinner fa-spin"></i> Uploading...').prop('disabled', true);
        
        // Here you would add the actual Google Drive upload code
        // For now, we'll simulate an upload
        setTimeout(() => {
            alert(`File "${file.name}" uploaded successfully to ${isFolderIdTab ? 'folder' : 'My Drive'}!`);
            $('#fileName').text("Select file to upload");
            $('#fileZone').css('border-color', 'var(--gray-200)');
            $('#filePicker').val(''); // Clear the file input
            $('#uploadBtn').html('<i class="fas fa-upload"></i> Upload').prop('disabled', false);
        }, 2000);
    });

    // Drag & Drop functionality
    const fileZone = document.getElementById('fileZone');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        fileZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        fileZone.classList.add('highlight');
        fileZone.style.borderColor = 'var(--cobalt)';
        fileZone.style.background = 'rgba(0, 71, 171, 0.05)';
    }

    function unhighlight() {
        fileZone.classList.remove('highlight');
        fileZone.style.borderColor = 'var(--gray-200)';
        fileZone.style.background = '';
    }

    // Handle dropped files
    fileZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            // Update the file input with dropped files
            const fileInput = document.getElementById('filePicker');
            fileInput.files = files;
            
            // Manually trigger change event
            const fileName = files[0].name;
            $('#fileName').html(`Selected: <strong>${fileName}</strong>`);
            $('#fileZone').css('border-color', 'var(--cobalt)');
            
            // Trigger change event
            $(fileInput).trigger('change');
        }
    }

    // 1. Add Task Logic
    const addTask = () => {
        const taskName = $('#todo-input').val().trim();
        if (taskName === "") return;

        const taskHtml = `
            <div class="todo-item">
                <div class="todo-content">
                    <i class="fas fa-check-circle todo-check-mark"></i>
                    <span class="todo-name">${taskName}</span>
                </div>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        
        $('#todo-list').prepend(taskHtml);
        $('#todo-input').val('').focus();
    };

    $('#add-btn').on('click', addTask);
    $('#todo-input').on('keypress', (e) => { if (e.which === 13) addTask(); });

    // 2. Toggle Task Status
    $('#todo-list').on('click', '.todo-item', function(e) {
        if (!$(e.target).hasClass('delete-btn')) {
            $(this).toggleClass('completed');
        }
    });

    // 3. Handle Delete
    $('#todo-list').on('click', '.delete-btn', function(e) {
        e.stopPropagation();
        $(this).closest('.todo-item').fadeOut(200, function() { 
            $(this).remove(); 
        });
    });

    // 4. Tab Switching
    $('.option-tab').on('click', function() {
        $('.option-tab').removeClass('active');
        $(this).addClass('active');
        if ($(this).attr('id') === 'tabFolderId') {
            $('#folderIdGroup').addClass('active');
        } else {
            $('#folderIdGroup').removeClass('active');
        }
    });

    // Sample task for demonstration
    const sampleTask = `
        <div class="todo-item">
            <div class="todo-content">
                <i class="fas fa-check-circle todo-check-mark"></i>
                <span class="todo-name">Sample task - click to complete</span>
            </div>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    $('#todo-list').append(sampleTask);
});

// --- Google Drive Integration ---
let tokenClient;
const CLIENT_ID = '676563501230-fkqhj9gfb91ra93kthhhccgq721f1mv8.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDoXGOHXja_gjgwkOAgw_EuNminNMcxjJY';

function gapiLoaded() {
    gapi.load('client', () => gapi.client.init({ 
        apiKey: API_KEY, 
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] 
    }));
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, 
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp) => {
            if (resp.access_token) {
                $('#statusLabel').text('Connected');
                $('.drive-badge').addClass('connected');
            }
        },
    });
}

$('#authBtn').click(() => {
    if (tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        alert('Google Identity Services not loaded yet. Please refresh the page.');
    }
});

// Initialize Google APIs when page loads
window.addEventListener('load', () => { 
    if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        gapiLoaded(); 
        gisLoaded();
    } else {
        console.error('Google APIs failed to load');
    }
});