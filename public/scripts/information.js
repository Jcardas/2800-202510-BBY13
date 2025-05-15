document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const bodyInput = document.getElementById('body');
    const form = document.getElementById('pageForm');
    const submitBtn = document.getElementById('submitBtn');
    const contentError = document.getElementById('contentError');
    const slugInput = document.getElementById('slug');
    let slugManuallyEdited = false;


    // Initialize editor content
    if (!editor.textContent.trim()) {
        editor.innerHTML = '';
    }
    bodyInput.value = editor.innerHTML;

    // Slug generation logic
    document.getElementById('title').addEventListener('input', function() {
        if (!slugManuallyEdited) {
            slugInput.value = this.value.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
        }
    });

    slugInput.addEventListener('input', () => {
        slugManuallyEdited = true;
    });

    // Rich text editor functionality
    document.querySelectorAll('#editorToolbar button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            
            if (command === 'createLink') {
                const url = prompt('Enter the URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'h2' || command === 'h3') {
                document.execCommand('formatBlock', false, command);
            } else {
                document.execCommand(command, false, null);
            }
            
            editor.focus();
            updateBodyValue();
        });
    });

    // Update hidden textarea on editor changes
    editor.addEventListener('input', updateBodyValue);
    editor.addEventListener('blur', updateBodyValue);

    function updateBodyValue() {
        let content = editor.innerHTML;
        // Clean empty paragraphs
        content = content.replace(/<p><br><\/p>/g, '');
        content = content.trim() || '';
        
        bodyInput.value = content;
        validateContent();
    }

    function validateContent() {
        const hasContent = editor.textContent.trim().length > 0;
        contentError.classList.toggle('hidden', hasContent);
        return hasContent;
    }

    // Image preview
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('previewImg').src = event.target.result;
                document.getElementById('imagePreview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submission handling
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Final validation
        updateBodyValue();
        const isContentValid = validateContent();
        const isFormValid = form.checkValidity() && isContentValid;
        
        if (!isFormValid) {
            if (!isContentValid) {
                editor.focus();
            }
            return;
        }
        
        // Prepare for submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
        
        try {
            // Use Fetch API for better error handling
            const formData = new FormData(form);
            
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });
            
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                const result = await response.json();
                showMessage(result.message || 'Action completed', result.type || 'success');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Save Page';
            }
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('Failed to save: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Page';
        }
    });
    
    function showMessage(text, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-4 mb-4 text-sm rounded-lg ${
            type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`;
        messageDiv.textContent = text;
        
        // Insert after the h1 heading
        const h1 = document.querySelector('main h1');
        if (h1) {
            h1.insertAdjacentElement('afterend', messageDiv);
        }
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});
// Client-side validation
function validateForm() {
const description = document.getElementById('description');
const descriptionError = document.getElementById('descriptionError');
let isValid = true;

// Validate description length
if (description.value.length < 10 || description.value.length > 200) {
    descriptionError.classList.remove('hidden');
    description.classList.add('border-red-500');
    isValid = false;
} else {
    descriptionError.classList.add('hidden');
    description.classList.remove('border-red-500');
}

return isValid;
}

// Form submission handler
document.getElementById('pageForm').addEventListener('submit', function(e) {
if (!validateForm()) {
    e.preventDefault();
    // Scroll to the first error
    const firstError = document.querySelector('.border-red-500');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
});

// Real-time validation
document.getElementById('description').addEventListener('input', function() {
const errorElement = document.getElementById('descriptionError');
if (this.value.length < 10 || this.value.length > 200) {
    this.classList.add('border-red-500');
    errorElement.classList.remove('hidden');
} else {
    this.classList.remove('border-red-500');
    errorElement.classList.add('hidden');
}
});