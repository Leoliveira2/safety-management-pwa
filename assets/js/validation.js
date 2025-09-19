// Form validation utilities
class FormValidator {
    constructor() {
        this.rules = CONFIG.VALIDATION;
        this.errors = {};
    }

    // Validate single field
    validateField(fieldId, value, customRules = {}) {
        const errors = [];
        const field = document.getElementById(fieldId);
        const rules = { ...this.rules, ...customRules };

        // Required validation
        if (rules.required && rules.required.includes(fieldId)) {
            if (!value || value.trim() === '') {
                errors.push('Este campo é obrigatório');
            }
        }

        // Max length validation
        if (rules.maxLength && rules.maxLength[fieldId]) {
            if (value && value.length > rules.maxLength[fieldId]) {
                errors.push(`Máximo de ${rules.maxLength[fieldId]} caracteres`);
            }
        }

        // Min value validation
        if (rules.minValues && rules.minValues[fieldId] !== undefined) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue < rules.minValues[fieldId]) {
                errors.push(`Valor mínimo: ${rules.minValues[fieldId]}`);
            }
        }

        // Email validation
        if (fieldId.includes('email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push('Email inválido');
            }
        }

        // Date validation
        if (field && field.type === 'date' && value) {
            const date = new Date(value);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            
            if (date > today) {
                errors.push('Data não pode ser futura');
            }
            
            // Check if date is too old (more than 10 years)
            const tenYearsAgo = new Date();
            tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
            if (date < tenYearsAgo) {
                errors.push('Data muito antiga');
            }
        }

        // Time validation
        if (field && field.type === 'time' && value) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
                errors.push('Formato de hora inválido');
            }
        }

        // Number validation
        if (field && field.type === 'number' && value) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                errors.push('Valor numérico inválido');
            }
            
            if (field.min && numValue < parseFloat(field.min)) {
                errors.push(`Valor mínimo: ${field.min}`);
            }
            
            if (field.max && numValue > parseFloat(field.max)) {
                errors.push(`Valor máximo: ${field.max}`);
            }
        }

        // Custom validations
        if (fieldId === 'occurrenceLocation') {
            if (value && value.length < 3) {
                errors.push('Localização deve ter pelo menos 3 caracteres');
            }
        }

        if (fieldId === 'occurrenceResponsibleManagement') {
            if (value && value.length < 2) {
                errors.push('Gerência deve ter pelo menos 2 caracteres');
            }
        }

        if (fieldId === 'occurrenceWorkHours') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 24) {
                errors.push('Horas de trabalho não podem exceder 24h');
            }
        }

        return errors;
    }

    // Validate entire form
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        this.errors = {};
        let isValid = true;

        // Get all form fields
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            const fieldErrors = this.validateField(field.id, field.value);
            
            if (fieldErrors.length > 0) {
                this.errors[field.id] = fieldErrors;
                isValid = false;
            }
            
            this.displayFieldErrors(field.id, fieldErrors);
        });

        // Cross-field validations
        const crossFieldErrors = this.validateCrossFields(form);
        if (crossFieldErrors.length > 0) {
            isValid = false;
        }

        return isValid;
    }

    // Cross-field validations
    validateCrossFields(form) {
        const errors = [];
        
        // Check if high potential and fatal accident are both selected
        const highPotential = form.querySelector('#occurrenceHighPotential');
        const fatalAccident = form.querySelector('#occurrenceFatalAccident');
        
        if (highPotential && fatalAccident && 
            highPotential.checked && fatalAccident.checked) {
            errors.push('Um acidente fatal não pode ser apenas de alto potencial');
            this.displayGeneralError('Acidente fatal não pode ser apenas de alto potencial');
        }

        // Check if incident is marked as fatal
        const type = form.querySelector('#occurrenceType');
        if (type && fatalAccident && 
            type.value === 'Incidente' && fatalAccident.checked) {
            errors.push('Incidentes não podem ser fatais');
            this.displayGeneralError('Incidentes não podem ser fatais');
        }

        // Check if date and time combination is logical
        const date = form.querySelector('#occurrenceDate');
        const time = form.querySelector('#occurrenceTime');
        
        if (date && time && date.value && time.value) {
            const occurrenceDateTime = new Date(`${date.value}T${time.value}`);
            const now = new Date();
            
            if (occurrenceDateTime > now) {
                errors.push('Data e hora não podem ser futuras');
                this.displayGeneralError('Data e hora não podem ser futuras');
            }
        }

        return errors;
    }

    // Display field errors
    displayFieldErrors(fieldId, errors) {
        const errorContainer = document.getElementById(`${fieldId.replace('occurrence', '').toLowerCase()}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorContainer) {
            errorContainer.textContent = errors.length > 0 ? errors[0] : '';
            errorContainer.setAttribute('aria-live', 'polite');
        }
        
        if (field) {
            if (errors.length > 0) {
                field.classList.add('error');
                field.setAttribute('aria-invalid', 'true');
                field.setAttribute('aria-describedby', `${fieldId.replace('occurrence', '').toLowerCase()}-error`);
            } else {
                field.classList.remove('error');
                field.setAttribute('aria-invalid', 'false');
                field.removeAttribute('aria-describedby');
            }
        }
    }

    // Display general form errors
    displayGeneralError(message) {
        Utils.showNotification(message, 'error');
    }

    // Clear all errors
    clearErrors() {
        this.errors = {};
        
        // Clear field errors
        const errorContainers = document.querySelectorAll('.error-message');
        errorContainers.forEach(container => {
            container.textContent = '';
        });
        
        // Remove error classes
        const fields = document.querySelectorAll('.error');
        fields.forEach(field => {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
            field.removeAttribute('aria-describedby');
        });
    }

    // Real-time validation setup
    setupRealTimeValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Debounced validation on input
            const debouncedValidation = Utils.debounce(() => {
                const errors = this.validateField(field.id, field.value);
                this.displayFieldErrors(field.id, errors);
            }, CONFIG.PERFORMANCE.debounceDelay);
            
            field.addEventListener('input', debouncedValidation);
            field.addEventListener('blur', debouncedValidation);
            
            // Immediate validation on change for select elements
            if (field.tagName === 'SELECT') {
                field.addEventListener('change', () => {
                    const errors = this.validateField(field.id, field.value);
                    this.displayFieldErrors(field.id, errors);
                });
            }
        });
    }

    // Get validation summary
    getValidationSummary() {
        const errorCount = Object.keys(this.errors).length;
        const totalErrors = Object.values(this.errors).reduce((sum, errors) => sum + errors.length, 0);
        
        return {
            isValid: errorCount === 0,
            errorCount,
            totalErrors,
            errors: this.errors
        };
    }

    // Sanitize input data
    sanitizeData(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // Remove HTML tags and trim whitespace
                sanitized[key] = Utils.sanitizeHTML(value.trim());
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // Validate file upload
    validateFile(file, allowedTypes = ['.csv', '.xlsx', '.json'], maxSize = 5 * 1024 * 1024) {
        const errors = [];
        
        if (!file) {
            errors.push('Nenhum arquivo selecionado');
            return errors;
        }
        
        // Check file size
        if (file.size > maxSize) {
            errors.push(`Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`);
        }
        
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
        }
        
        return errors;
    }

    // Validate data before save
    validateOccurrenceData(data) {
        const errors = [];
        
        // Required fields
        const requiredFields = ['date', 'time', 'location', 'category', 'severity', 'type', 'responsibleManagement'];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`Campo obrigatório: ${field}`);
            }
        });
        
        // Data type validations
        if (data.date && !dayjs(data.date).isValid()) {
            errors.push('Data inválida');
        }
        
        if (data.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
            errors.push('Hora inválida');
        }
        
        if (data.involvedPeople && (isNaN(data.involvedPeople) || data.involvedPeople < 1)) {
            errors.push('Número de pessoas envolvidas deve ser pelo menos 1');
        }
        
        if (data.workHours && (isNaN(data.workHours) || data.workHours < 0 || data.workHours > 24)) {
            errors.push('Horas de trabalho devem estar entre 0 e 24');
        }
        
        return errors;
    }
}

// Custom validation rules
const CustomValidations = {
    // Brazilian CPF validation
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        
        return remainder === parseInt(cpf.charAt(10));
    },
    
    // Brazilian CNPJ validation
    validateCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]/g, '');
        
        if (cnpj.length !== 14) return false;
        
        // Check for known invalid CNPJs
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        let length = cnpj.length - 2;
        let numbers = cnpj.substring(0, length);
        let digits = cnpj.substring(length);
        let sum = 0;
        let pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;
        
        length = length + 1;
        numbers = cnpj.substring(0, length);
        sum = 0;
        pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        
        return result === parseInt(digits.charAt(1));
    },
    
    // Phone number validation (Brazilian format)
    validatePhone(phone) {
        phone = phone.replace(/[^\d]/g, '');
        return /^(\d{10,11})$/.test(phone);
    },
    
    // CEP validation (Brazilian postal code)
    validateCEP(cep) {
        cep = cep.replace(/[^\d]/g, '');
        return /^(\d{8})$/.test(cep);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, CustomValidations };
}

