// Form validation utilities

const validators = {
    required: (value) => {
        return value.trim() !== '';
    },

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },

    minLength: (value, length) => {
        return value.length >= length;
    },

    maxLength: (value, length) => {
        return value.length <= length;
    },

    match: (value, matchValue) => {
        return value === matchValue;
    },
};

const validateField = (field, rules) => {
    const value = field.value;
    const errors = [];

    for (const rule of rules) {
        switch (rule.type) {
            case 'required':
                if (!validators.required(value)) {
                    errors.push(rule.message || 'This field is required');
                }
                break;
            case 'email':
                if (value && !validators.email(value)) {
                    errors.push(rule.message || 'Please enter a valid email');
                }
                break;
            case 'minLength':
                if (value && !validators.minLength(value, rule.value)) {
                    errors.push(rule.message || `Minimum length is ${rule.value} characters`);
                }
                break;
            case 'maxLength':
                if (value && !validators.maxLength(value, rule.value)) {
                    errors.push(rule.message || `Maximum length is ${rule.value} characters`);
                }
                break;
            case 'match':
                const matchField = document.getElementById(rule.field);
                if (matchField && !validators.match(value, matchField.value)) {
                    errors.push(rule.message || 'Fields do not match');
                }
                break;
        }
    }

    return errors;
};

const showFieldError = (field, errors) => {
    const errorContainer = field.parentElement.querySelector('.form-error');

    if (errors.length > 0) {
        field.classList.add('error');
        if (errorContainer) {
            errorContainer.textContent = errors[0];
            errorContainer.style.display = 'block';
        }
        return false;
    } else {
        field.classList.remove('error');
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
        return true;
    }
};

const validateForm = (formId, validationRules) => {
    const form = document.getElementById(formId);
    if (!form) return false;

    let isValid = true;

    for (const [fieldId, rules] of Object.entries(validationRules)) {
        const field = document.getElementById(fieldId);
        if (!field) continue;

        const errors = validateField(field, rules);
        const fieldValid = showFieldError(field, errors);

        if (!fieldValid) {
            isValid = false;
        }
    }

    return isValid;
};

const setupFormValidation = (formId, validationRules, onSubmit) => {
    const form = document.getElementById(formId);
    if (!form) return;

    // Add error containers if they don't exist
    for (const fieldId of Object.keys(validationRules)) {
        const field = document.getElementById(fieldId);
        if (!field) continue;

        const formGroup = field.parentElement;
        if (!formGroup.querySelector('.form-error')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.display = 'none';
            formGroup.appendChild(errorDiv);
        }

        // Real-time validation on blur
        field.addEventListener('blur', () => {
            const errors = validateField(field, validationRules[fieldId]);
            showFieldError(field, errors);
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (validateForm(formId, validationRules)) {
            await onSubmit(e);
        }
    });
};

// Show alert message
const showAlert = (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} slide-up`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
};

// Show loading overlay
const showLoading = () => {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
};

const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
};

// Export validation utilities
window.Validation = {
    validateField,
    showFieldError,
    validateForm,
    setupFormValidation,
    showAlert,
    showLoading,
    hideLoading,
};
