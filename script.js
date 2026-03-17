// --- APP INITIALIZATION ---
$(document).ready(function() {
    console.log("Thumb Tasks: Ready");

    const $fileZone = $('#fileZone');
    const $filePicker = $('#filePicker');
    const $todoInput = $('#todo-input');
    const $todoList = $('#todo-list');

    // --- 1. FILE UPLOAD & DRAG 'N DROP LOGIC ---

    // Click to open file picker
    $fileZone.on('click', function(e) {
        // Prevents infinite loop if the input itself is the target
        if (e.target !== $filePicker[0]) {
            $filePicker.click();
        }
    });

    // Prevent browser from opening dropped files globally
    $(document).on('dragover dragenter dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    // Hover visual effects
    $fileZone.on('dragover dragenter', function() {
        $(this).addClass('dragover');
    });

    $fileZone.on('dragleave dragend drop', function() {
        $(this).removeClass('dragover');
    });

    // Handle File Drop
    $fileZone.on('drop', function(e) {
        const droppedFiles = e.originalEvent.dataTransfer.files;
        if (droppedFiles.length > 0) {
            $filePicker[0].files = droppedFiles; // Manually assign files to input
            $filePicker.trigger('change'); // Trigger UI update
        }
    });

    // Update UI when file is selected (via click or drop)
    $filePicker.on('change', function() {
        if (this.files && this.files[0]) {
            const fileName = this.files[0].name;
            $('#fileName').html(`Selected: <strong>${fileName}</strong>`);
            $fileZone.css('border-color', '#0047AB');
        }
    });


    // --- 2. TASK MANAGEMENT LOGIC ---

    const addTask = () => {
        const taskName = $todoInput.val().trim();
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
        
        $todoList.prepend(taskHtml);
        $todoInput.val('').focus();
    };

    $('#add-btn').on('click', addTask);
    $todoInput.on('keypress', (e) => { if (e.which === 13) addTask(); });

    // Toggle Task Done
    $todoList.on('click', '.todo-item', function(e) {
        if (!$(e.target).hasClass('delete-btn')) {
            $(this).toggleClass('completed');
        }
    });

    // Delete Task
    $todoList.on('click', '.delete-btn', function(e) {
        e.stopPropagation();
        $(this).closest('.todo-item').fadeOut(200, function() { 
            $(this).remove(); 
        });
    });


    // --- 3. FOLDER TABS LOGIC ---
    $('.option-tab').on('click', function() {
        $('.option-tab').removeClass('active');
        $(this).addClass('active');
        
        if ($(this).attr('id') === 'tabFolderUrl') {
            $('#folderUrlGroup').show().addClass('active');
        } else {
            $('#folderUrlGroup').hide().removeClass('active');
        }
    });


    // --- 4. GOOGLE DRIVE UPLOAD LOGIC ---

    $('#uploadBtn').on('click', async function() {
        const file = $filePicker[0].files[0];
        const $btn = $(this);
        const $statusText = $('#fileName');

        if (!file) {
            $btn.addClass('sync-error').text("No File Selected");
            setTimeout(() => $btn.removeClass('sync-error').html('<i class="fas fa-upload"></i> Sync Now'), 2000);
            return;
        }

        const token = gapi.client.getToken();
        if (!token) return tokenClient.requestAccessToken();

        // UI: Loading State
        $btn.html('<i class="fas fa-spinner fa-spin"></i> Uploading...').prop('disabled', true);
        $statusText.text(`Syncing ${file.name}...`);

        // Determine Folder Destination
        let folderId = 'root';
        if ($('#tabFolderUrl').hasClass('active')) {
            const rawLink = $('#folderUrl').val().trim();
            
            if (rawLink) {

                const match = rawLink.match(/\/folders\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    folderId = match[1];
                } else {

                    folderId = rawLink;
                }
            }
        }
        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        try {
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + token.access_token }),
                body: form
            });

            if (response.ok) {
                // UI: Success State
                $btn.addClass('sync-success').html('<i class="fas fa-check"></i> Successfully Uploaded');
                $statusText.addClass('upload-complete').html(`<i class="fas fa-check-circle"></i> ${file.name} is now on Drive`);
                
                // Clean up after 3 seconds
                setTimeout(() => {
                    $btn.removeClass('sync-success').html('<i class="fas fa-upload"></i> Upload Now').prop('disabled', false);
                    $statusText.removeClass('upload-complete').text("Select file to upload");
                    $filePicker.val(''); // Clear the actual file input
                    $fileZone.css('border-color', '');
                }, 3000);

            } else {
                throw new Error("Upload Failed");
            }
        } catch (err) {
            // UI: Error State
            $btn.addClass('sync-error').html('<i class="fas fa-times"></i> Upload Failed');
            $statusText.text("Try again or check connection.");
            
            setTimeout(() => {
                $btn.removeClass('sync-error').html('<i class="fas fa-upload"></i> Upload Now').prop('disabled', false);
            }, 3000);
        }
    });
});


// --- 5. GOOGLE API AUTHENTICATION ---

let tokenClient;
const CLIENT_ID = '676563501230-fkqhj9gfb91ra93kthhhccgq721f1mv8.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDoXGOHXja_gjgwkOAgw_EuNminNMcxjJY';

function gapiLoaded() {
    gapi.load('client', () => {
        gapi.client.init({ 
            apiKey: API_KEY, 
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] 
        });
    });
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

// Attach auth trigger to badge
$(document).on('click', '#authBtn', function() {
    tokenClient.requestAccessToken();
});

// Initialize on window load
window.onload = () => { gapiLoaded(); gisLoaded(); };