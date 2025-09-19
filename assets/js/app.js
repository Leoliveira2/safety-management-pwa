// Main application class
class OccurrenceManager {
    constructor() {
        this.occurrences = [];
        this.settings = DEFAULT_SETTINGS;
        this.chartManager = new ChartManager();
        this.validator = new FormValidator();
        
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            Utils.showLoading('Inicializando sistema...');
            
            // Load data from storage
            this.loadOccurrences();
            this.loadSettings();
            
            // Initialize components
            this.initializeForm();
            this.initializeFilters();
            this.initializeCharts();
            this.initializeEventListeners();
            
            // Update UI
            this.updateFiltersOptions();
            this.updateDashboards();
            this.checkAlerts();
            
            // Setup auto-save
            if (this.settings.autoSave) {
                this.setupAutoSave();
            }
            
            Utils.hideLoading();
            Utils.showNotification('Sistema carregado com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Application initialization');
            Utils.hideLoading();
        }
    }

    // Initialize form
    initializeForm() {
        const form = document.getElementById('occurrenceForm');
        if (!form) return;

        // Set up form validation
        this.validator.setupRealTimeValidation('occurrenceForm');
        
        // Generate new ID
        this.generateNewId();
        
        // Set default date and time
        const now = new Date();
        document.getElementById('occurrenceDate').value = dayjs(now).format('YYYY-MM-DD');
        document.getElementById('occurrenceTime').value = dayjs(now).format('HH:mm');
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    // Initialize filters
    initializeFilters() {
        const applyButton = document.getElementById('applyFilters');
        const clearButton = document.getElementById('clearFilters');
        
        if (applyButton) {
            applyButton.addEventListener('click', () => this.updateDashboards());
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearFilters());
        }

        // Export period change handler
        const exportPeriod = document.getElementById('exportPeriod');
        if (exportPeriod) {
            exportPeriod.addEventListener('change', (e) => {
                const customPeriod = document.getElementById('customPeriod');
                if (customPeriod) {
                    customPeriod.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
        }
    }

    // Initialize charts
    initializeCharts() {
        this.chartManager.initializeCharts();
        
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.chartManager.resizeCharts();
        }, 250));
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Modal close handlers
        window.addEventListener('click', (event) => {
            const modals = document.getElementsByClassName('modal');
            for (let modal of modals) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                }
            }
        });

        // Keyboard navigation for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal[style*="block"]');
                openModals.forEach(modal => {
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                });
            }
        });

        // Auto-save on data change
        if (this.settings.autoSave) {
            document.addEventListener('change', Utils.debounce(() => {
                this.saveOccurrences();
            }, 1000));
        }
    }

    // Setup auto-save
    setupAutoSave() {
        setInterval(() => {
            this.saveOccurrences();
        }, 30000); // Auto-save every 30 seconds
    }

    // Generate new occurrence ID
    generateNewId() {
        const nextId = this.occurrences.length > 0 
            ? Math.max(...this.occurrences.map(o => o.id || 0)) + 1 
            : 1;
        
        document.getElementById('occurrenceId').value = `SST-${String(nextId).padStart(4, '0')}`;
    }

    // Handle form submission
    async handleFormSubmit() {
        try {
            // Validate form
            if (!this.validator.validateForm('occurrenceForm')) {
                Utils.showNotification('Por favor, corrija os erros no formulário', 'error');
                return;
            }

            // Collect form data
            const formData = this.collectFormData();
            
            // Validate occurrence data
            const dataErrors = this.validator.validateOccurrenceData(formData);
            if (dataErrors.length > 0) {
                Utils.showNotification(dataErrors[0], 'error');
                return;
            }

            // Sanitize data
            const sanitizedData = this.validator.sanitizeData(formData);
            
            // Create occurrence object
            const occurrence = this.createOccurrenceObject(sanitizedData);
            
            // Add to occurrences
            this.occurrences.push(occurrence);
            
            // Save and update UI
            this.saveOccurrences();
            this.updateFiltersOptions();
            this.updateDashboards();
            this.checkAlerts();
            
            // Reset form
            this.resetForm();
            
            Utils.showNotification('Ocorrência registrada com sucesso!', 'success');
            Utils.announceToScreenReader('Nova ocorrência registrada');
            
        } catch (error) {
            Utils.handleError(error, 'Form submission');
        }
    }

    // Collect form data
    collectFormData() {
        const form = document.getElementById('occurrenceForm');
        const formData = new FormData(form);
        const data = {};
        
        // Get all form fields
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (field.type === 'checkbox') {
                data[field.id] = field.checked;
            } else {
                data[field.id] = field.value;
            }
        });
        
        return data;
    }

    // Create occurrence object
    createOccurrenceObject(formData) {
        const date = dayjs(formData.occurrenceDate);
        
        return {
            id: this.occurrences.length + 1,
            date: formData.occurrenceDate,
            month: date.month() + 1,
            year: date.year(),
            time: formData.occurrenceTime,
            location: formData.occurrenceLocation,
            category: formData.occurrenceCategory,
            severity: formData.occurrenceSeverity,
            type: formData.occurrenceType,
            highPotential: formData.occurrenceHighPotential || false,
            fatalAccident: formData.occurrenceFatalAccident || false,
            bodyPart: formData.occurrenceBodyPart || '',
            description: formData.occurrenceDescription || '',
            responsibleManagement: formData.occurrenceResponsibleManagement,
            involvedPeople: parseInt(formData.occurrenceInvolvedPeople) || 1,
            workHours: parseFloat(formData.occurrenceWorkHours) || 8,
            createdAt: new Date().toISOString()
        };
    }

    // Reset form
    resetForm() {
        const form = document.getElementById('occurrenceForm');
        if (!form) return;
        
        form.reset();
        this.validator.clearErrors();
        this.generateNewId();
        
        // Reset date and time to current
        const now = new Date();
        document.getElementById('occurrenceDate').value = dayjs(now).format('YYYY-MM-DD');
        document.getElementById('occurrenceTime').value = dayjs(now).format('HH:mm');
        
        // Focus first field
        const firstField = form.querySelector('input:not([readonly]), select, textarea');
        if (firstField) {
            firstField.focus();
        }
    }

    // Generate sample data
    generateSampleData() {
        try {
            Utils.showLoading('Gerando dados de exemplo...');
            
            const categories = ['Queda', 'Choque', 'Desvio', 'Corte', 'Fratura', 'Queimadura', 'Intoxicação', 'Outro'];
            const severities = ['Leve', 'Moderada', 'Grave'];
            const types = ['Acidente', 'Incidente'];
            const bodyParts = ['Mão', 'Cabeça', 'Joelho', 'Braço', 'Perna', 'Tronco', 'Olho', 'Pé', 'Costas'];
            const locations = ['Área de Produção', 'Escritório', 'Almoxarifado', 'Laboratório', 'Oficina', 'Pátio', 'Cantina', 'Estacionamento'];
            const managements = ['Produção', 'Manutenção', 'RH', 'Qualidade', 'Logística', 'Administração'];

            const sampleOccurrences = [];
            
            for (let i = 0; i < 300; i++) {
                const randomDate = dayjs().subtract(Math.floor(Math.random() * 730), 'day');
                
                const occurrence = {
                    id: i + 1,
                    date: randomDate.format('YYYY-MM-DD'),
                    month: randomDate.month() + 1,
                    year: randomDate.year(),
                    time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    severity: severities[Math.floor(Math.random() * severities.length)],
                    type: types[Math.floor(Math.random() * types.length)],
                    highPotential: Math.random() > 0.88, // 12% chance
                    fatalAccident: Math.random() > 0.995, // 0.5% chance
                    bodyPart: bodyParts[Math.floor(Math.random() * bodyParts.length)],
                    description: 'Descrição de exemplo gerada automaticamente para fins de demonstração.',
                    responsibleManagement: managements[Math.floor(Math.random() * managements.length)],
                    involvedPeople: Math.floor(Math.random() * 3) + 1,
                    workHours: Math.random() * 12 + 4, // 4-16 hours
                    createdAt: randomDate.toISOString()
                };
                sampleOccurrences.push(occurrence);
            }

            this.occurrences = sampleOccurrences;
            this.saveOccurrences();
            this.updateFiltersOptions();
            this.updateDashboards();
            this.checkAlerts();
            
            Utils.hideLoading();
            Utils.showNotification('300 ocorrências de exemplo geradas com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Sample data generation');
            Utils.hideLoading();
        }
    }

    // Update filter options
    updateFiltersOptions() {
        this.updateFilterOptions('filterYear', [...new Set(this.occurrences.map(o => o.year))].sort().reverse());
        this.updateFilterOptions('filterCategory', [...new Set(this.occurrences.map(o => o.category))]);
        this.updateFilterOptions('filterLocation', [...new Set(this.occurrences.map(o => o.location))]);
        this.updateFilterOptions('filterBodyPart', [...new Set(this.occurrences.map(o => o.bodyPart))].filter(x => x));
        this.updateFilterOptions('filterManagement', [...new Set(this.occurrences.map(o => o.responsibleManagement))]);
    }

    // Update single filter options
    updateFilterOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Remove existing options (except first)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // Restore previous value if still valid
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    // Get filtered data
    getFilteredData() {
        const filters = {
            year: document.getElementById('filterYear')?.value,
            month: document.getElementById('filterMonth')?.value,
            type: document.getElementById('filterType')?.value,
            severity: document.getElementById('filterSeverity')?.value,
            category: document.getElementById('filterCategory')?.value,
            location: document.getElementById('filterLocation')?.value,
            bodyPart: document.getElementById('filterBodyPart')?.value,
            management: document.getElementById('filterManagement')?.value
        };

        return this.occurrences.filter(o => 
            (!filters.year || o.year == filters.year) &&
            (!filters.month || o.month == filters.month) &&
            (!filters.type || o.type === filters.type) &&
            (!filters.severity || o.severity === filters.severity) &&
            (!filters.category || o.category === filters.category) &&
            (!filters.location || o.location === filters.location) &&
            (!filters.bodyPart || o.bodyPart === filters.bodyPart) &&
            (!filters.management || o.responsibleManagement === filters.management)
        );
    }

    // Clear filters
    clearFilters() {
        const filterIds = ['filterYear', 'filterMonth', 'filterType', 'filterSeverity', 
                          'filterCategory', 'filterLocation', 'filterBodyPart', 'filterManagement'];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        this.updateDashboards();
        Utils.showNotification('Filtros limpos', 'info');
    }

    // Update dashboards
    updateDashboards() {
        const filteredData = this.getFilteredData();
        this.updateSummary(filteredData);
        this.updateKPIs(filteredData);
        this.chartManager.updateAllCharts(filteredData);
        this.updateHighPotentialDashboard(filteredData);
    }

    // Update summary statistics
    updateSummary(data) {
        const summaryContainer = document.getElementById('statsSummary');
        if (!summaryContainer) return;
        
        summaryContainer.innerHTML = '';

        const stats = [
            { label: 'Total de Ocorrências', value: data.length, class: 'total' },
            { label: 'Acidentes', value: data.filter(o => o.type === 'Acidente').length, class: 'accidents' },
            { label: 'Incidentes', value: data.filter(o => o.type === 'Incidente').length, class: 'incidents' },
            { label: 'Alto Potencial', value: data.filter(o => o.highPotential).length, class: 'high-potential' },
            { label: 'Graves', value: data.filter(o => o.severity === 'Grave').length, class: 'grave' }
        ];

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = `stat-card ${stat.class}`;
            card.innerHTML = `
                <div class="stat-number">${Utils.formatNumber(stat.value)}</div>
                <div class="stat-label">${stat.label}</div>
            `;
            summaryContainer.appendChild(card);
        });
    }

    // Update KPIs
    updateKPIs(data) {
        const kpiContainer = document.getElementById('kpiStats');
        if (!kpiContainer) return;
        
        kpiContainer.innerHTML = '';

        const totalHours = data.reduce((sum, o) => sum + (o.workHours || 8), 0);
        const accidents = data.filter(o => o.type === 'Acidente').length;
        const totalPeople = data.reduce((sum, o) => sum + (o.involvedPeople || 1), 0);
        const graveAccidents = data.filter(o => o.severity === 'Grave').length;

        // Check if we have company data for proper KPI calculation
        const hasCompanyData = this.settings.company.hasWorkHoursData && this.settings.company.hasEmployeeData;
        const companyHours = this.settings.company.totalWorkHoursPerMonth || 0;
        const companyEmployees = this.settings.company.totalEmployees || 0;

        // Calculate KPIs based on available data
        let frequencyRate, incidenceRate, severityRate, highPotentialRate;
        
        if (hasCompanyData && companyHours > 0) {
            // Use company data for accurate calculation
            frequencyRate = (accidents * 1000000) / companyHours;
            incidenceRate = companyEmployees > 0 ? (data.length / companyEmployees) * 100 : 0;
        } else {
            // Use occurrence data as fallback (less accurate)
            frequencyRate = totalHours > 0 ? (accidents * 1000000) / totalHours : 0;
            incidenceRate = totalPeople > 0 ? (data.length / totalPeople) * 100 : 0;
        }
        
        severityRate = data.length > 0 ? (graveAccidents / data.length) * 100 : 0;
        highPotentialRate = data.length > 0 ? (data.filter(o => o.highPotential).length / data.length) * 100 : 0;

        const kpis = [
            { 
                label: 'Taxa de Frequência', 
                value: Utils.formatNumber(frequencyRate, 2), 
                class: hasCompanyData ? 'kpi' : 'kpi kpi-disabled', 
                unit: 'por milhão de horas',
                tooltip: hasCompanyData ? 'Baseado em dados da empresa' : 'Cálculo aproximado - configure dados da empresa'
            },
            { 
                label: 'Taxa de Incidência', 
                value: Utils.formatNumber(incidenceRate, 2), 
                class: hasCompanyData ? 'kpi' : 'kpi kpi-disabled', 
                unit: '%',
                tooltip: hasCompanyData ? 'Baseado em dados da empresa' : 'Cálculo aproximado - configure dados da empresa'
            },
            { 
                label: 'Taxa de Gravidade', 
                value: Utils.formatNumber(severityRate, 1), 
                class: 'kpi', 
                unit: '%',
                tooltip: 'Percentual de acidentes graves'
            },
            { 
                label: 'Taxa Alto Potencial', 
                value: Utils.formatNumber(highPotentialRate, 1), 
                class: 'kpi', 
                unit: '%',
                tooltip: 'Percentual de eventos de alto potencial'
            }
        ];

        kpis.forEach(kpi => {
            const card = document.createElement('div');
            card.className = `stat-card ${kpi.class}`;
            card.title = kpi.tooltip;
            card.innerHTML = `
                <div class="stat-number">${kpi.value}</div>
                <div class="stat-label">${kpi.label}</div>
                <div style="font-size: 0.8rem; color: #7f8c8d;">${kpi.unit}</div>
            `;
            kpiContainer.appendChild(card);
        });

        // Show company info banner if data is incomplete
        this.updateCompanyInfoBanner(hasCompanyData);
    }

    // Update company info banner
    updateCompanyInfoBanner(hasCompanyData) {
        let banner = document.getElementById('companyInfoBanner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'companyInfoBanner';
            banner.className = 'company-info-banner';
            
            // Insert before KPI section
            const kpiSection = document.querySelector('#kpiStats').parentElement;
            kpiSection.parentElement.insertBefore(banner, kpiSection);
        }
        
        if (hasCompanyData) {
            banner.className = 'company-info-banner';
            banner.innerHTML = `
                <h4>✅ Dados da Empresa Configurados</h4>
                <p>KPIs calculados com base em: ${this.settings.company.totalEmployees} funcionários e ${Utils.formatNumber(this.settings.company.totalWorkHoursPerMonth)} horas/mês</p>
                <button class="btn-settings" onclick="occurrenceManager.showSettingsModal()">⚙️ Configurações</button>
            `;
        } else {
            banner.className = 'company-info-banner incomplete';
            banner.innerHTML = `
                <h4>⚠️ Configure os Dados da Empresa</h4>
                <p>Para cálculos precisos de Taxa de Frequência e Incidência, configure o número de funcionários e horas trabalhadas.</p>
                <button class="btn-settings" onclick="occurrenceManager.showSettingsModal()">⚙️ Configurar Agora</button>
            `;
        }
    }

    // Show settings modal
    showSettingsModal() {
        let modal = document.getElementById('settingsModal');
        
        if (!modal) {
            modal = this.createSettingsModal();
            document.body.appendChild(modal);
        }
        
        // Populate current values
        document.getElementById('companyName').value = this.settings.company.name || '';
        document.getElementById('totalEmployees').value = this.settings.company.totalEmployees || '';
        document.getElementById('totalWorkHours').value = this.settings.company.totalWorkHoursPerMonth || '';
        
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        Utils.trapFocus(modal);
    }

    // Create settings modal
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'modal settings-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'settingsModalTitle');
        
        modal.innerHTML = `
            <div class="settings-modal-content">
                <div class="modal-header">
                    <h2 id="settingsModalTitle">⚙️ Configurações da Empresa</h2>
                    <button class="close" onclick="occurrenceManager.closeModal('settingsModal')" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h3>📊 Dados para Cálculo de KPIs</h3>
                        <p>Configure os dados da sua empresa para cálculos precisos de Taxa de Frequência e Taxa de Incidência.</p>
                        
                        <div class="settings-grid">
                            <div class="form-group">
                                <label for="companyName">Nome da Empresa</label>
                                <input type="text" id="companyName" placeholder="Ex: Empresa ABC Ltda">
                            </div>
                            
                            <div class="form-group">
                                <label for="totalEmployees">Total de Funcionários <span class="required">*</span></label>
                                <input type="number" id="totalEmployees" min="1" placeholder="Ex: 150" required>
                                <small>Número total de funcionários da empresa</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="totalWorkHours">Horas Trabalhadas/Mês <span class="required">*</span></label>
                                <input type="number" id="totalWorkHours" min="1" placeholder="Ex: 26400" required>
                                <small>Total de horas trabalhadas por mês (funcionários × horas/dia × dias úteis)</small>
                            </div>
                        </div>
                        
                        <div style="margin-top: 1rem; padding: 1rem; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #3498db;">
                            <strong>💡 Exemplo de Cálculo:</strong><br>
                            150 funcionários × 8 horas/dia × 22 dias úteis = 26.400 horas/mês
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="occurrenceManager.closeModal('settingsModal')">Cancelar</button>
                    <button class="btn btn-primary" onclick="occurrenceManager.saveCompanySettings()">💾 Salvar Configurações</button>
                </div>
            </div>
        `;
        
        return modal;
    }

    // Save company settings
    saveCompanySettings() {
        try {
            const companyName = document.getElementById('companyName').value.trim();
            const totalEmployees = parseInt(document.getElementById('totalEmployees').value);
            const totalWorkHours = parseInt(document.getElementById('totalWorkHours').value);
            
            // Validate required fields
            if (!totalEmployees || totalEmployees < 1) {
                Utils.showNotification('Por favor, informe o número total de funcionários', 'error');
                return;
            }
            
            if (!totalWorkHours || totalWorkHours < 1) {
                Utils.showNotification('Por favor, informe o total de horas trabalhadas por mês', 'error');
                return;
            }
            
            // Update settings
            this.settings.company = {
                name: companyName || 'Empresa',
                totalEmployees: totalEmployees,
                totalWorkHoursPerMonth: totalWorkHours,
                hasWorkHoursData: true,
                hasEmployeeData: true
            };
            
            // Save and update UI
            this.saveSettings();
            this.updateDashboards();
            
            this.closeModal('settingsModal');
            Utils.showNotification('Configurações salvas com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Company settings save');
        }
    }

    // Update high potential dashboard
    updateHighPotentialDashboard(data) {
        this.updateHighPotentialStats(data);
    }

    // Update high potential statistics
    updateHighPotentialStats(data) {
        const statsContainer = document.getElementById('highPotentialStats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = '';

        const highPotentialData = data.filter(o => o.highPotential);
        const normalData = data.filter(o => !o.highPotential);
        const highPotentialPercentage = data.length > 0 ? (highPotentialData.length / data.length) * 100 : 0;
        const targetMet = highPotentialPercentage < 5;

        const stats = [
            { label: 'Total Alto Potencial', value: highPotentialData.length, class: 'high-potential' },
            { label: 'Total Demais Eventos', value: normalData.length, class: 'total' },
            { label: '% Alto Potencial', value: `${Utils.formatNumber(highPotentialPercentage, 1)}%`, class: 'grave' },
            { label: 'Meta (< 5%)', value: targetMet ? '✓ Atingida' : '✗ Acima', class: targetMet ? 'incidents' : 'accidents' }
        ];

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = `stat-card ${stat.class}`;
            card.innerHTML = `
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            `;
            statsContainer.appendChild(card);
        });
    }

    // Check alerts
    checkAlerts() {
        const alerts = [];
        const data = this.getFilteredData();
        
        // Check high potential percentage
        const highPotentialCount = data.filter(o => o.highPotential).length;
        const highPotentialPercentage = data.length > 0 ? (highPotentialCount / data.length) * 100 : 0;
        
        if (highPotentialPercentage > this.settings.alertThresholds.highPotentialPercentage) {
            alerts.push({
                type: 'warning',
                message: `Atenção: ${Utils.formatNumber(highPotentialPercentage, 1)}% dos eventos são de alto potencial (meta: <${this.settings.alertThresholds.highPotentialPercentage}%)`
            });
        }

        // Check fatal accidents
        const fatalAccidents = data.filter(o => o.fatalAccident).length;
        if (fatalAccidents > 0) {
            alerts.push({
                type: 'danger',
                message: `ALERTA CRÍTICO: ${fatalAccidents} acidente(s) fatal(is) registrado(s)!`
            });
        }

        this.displayAlerts(alerts);
    }

    // Display alerts
    displayAlerts(alerts) {
        const container = document.getElementById('alertsContainer');
        if (!container) return;
        
        container.innerHTML = '';

        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${alert.type}`;
            alertDiv.setAttribute('role', 'alert');
            alertDiv.innerHTML = `
                <strong>${alert.type === 'danger' ? '🚨' : '⚠️'}</strong> ${Utils.sanitizeHTML(alert.message)}
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;" aria-label="Fechar alerta">&times;</button>
            `;
            container.appendChild(alertDiv);
        });
    }

    // Modal management
    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        
        // Set default dates
        document.getElementById('exportEndDate').value = dayjs().format('YYYY-MM-DD');
        document.getElementById('exportStartDate').value = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
        
        // Focus first element
        Utils.trapFocus(modal);
    }

    showBackupModal() {
        const modal = document.getElementById('backupModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        this.updateBackupInfo();
        
        Utils.trapFocus(modal);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }

    // Update backup info
    updateBackupInfo() {
        const backupInfo = document.getElementById('backupInfo');
        const lastBackup = document.getElementById('lastBackup');
        
        if (backupInfo) {
            backupInfo.textContent = this.occurrences.length;
        }
        
        if (lastBackup) {
            lastBackup.textContent = this.settings.lastBackup 
                ? Utils.formatDate(this.settings.lastBackup, 'DD/MM/YYYY HH:mm')
                : 'Nunca';
        }
    }

    // Export functionality
    exportData() {
        try {
            const format = document.getElementById('exportFormat')?.value || 'csv';
            const period = document.getElementById('exportPeriod')?.value || 'all';
            
            const data = this.getExportData(period);
            
            switch(format) {
                case 'csv':
                    this.exportToCSV(data);
                    break;
                case 'json':
                    this.exportToJSON(data);
                    break;
                default:
                    Utils.showNotification('Formato de exportação não suportado', 'error');
                    return;
            }
            
            this.closeModal('exportModal');
            Utils.showNotification('Dados exportados com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Data export');
        }
    }

    // Get export data based on period
    getExportData(period) {
        let data = this.occurrences;
        const now = dayjs();
        
        switch(period) {
            case 'lastMonth':
                data = data.filter(o => dayjs(o.date).isAfter(now.subtract(1, 'month')));
                break;
            case 'last3Months':
                data = data.filter(o => dayjs(o.date).isAfter(now.subtract(3, 'month')));
                break;
            case 'lastYear':
                data = data.filter(o => dayjs(o.date).isAfter(now.subtract(1, 'year')));
                break;
            case 'custom':
                const startDate = document.getElementById('exportStartDate')?.value;
                const endDate = document.getElementById('exportEndDate')?.value;
                if (startDate && endDate) {
                    data = data.filter(o => dayjs(o.date).isBetween(startDate, endDate, null, '[]'));
                }
                break;
        }
        
        return data;
    }

    // Export to CSV
    exportToCSV(data) {
        const headers = CONFIG.EXPORT_FORMATS.csv.headers;
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.id,
                row.date,
                row.time,
                `"${row.location}"`,
                row.category,
                row.severity,
                row.type,
                row.highPotential ? 'Sim' : 'Não',
                row.bodyPart || '',
                `"${row.responsibleManagement}"`,
                `"${(row.description || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const filename = `relatorio-sst-${dayjs().format('YYYY-MM-DD')}.csv`;
        Utils.downloadFile(csvContent, filename, CONFIG.EXPORT_FORMATS.csv.mimeType);
    }

    // Export to JSON
    exportToJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        const filename = `dados-sst-${dayjs().format('YYYY-MM-DD')}.json`;
        Utils.downloadFile(jsonContent, filename, CONFIG.EXPORT_FORMATS.json.mimeType);
    }

    // Backup functionality
    createBackup() {
        try {
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: this.occurrences,
                settings: this.settings
            };
            
            const backupContent = JSON.stringify(backup, null, 2);
            const filename = `backup-sst-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
            
            Utils.downloadFile(backupContent, filename, 'application/json');
            
            // Update last backup time
            this.settings.lastBackup = new Date().toISOString();
            this.saveSettings();
            this.updateBackupInfo();
            
            Utils.showNotification('Backup criado com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Backup creation');
        }
    }

    // Restore backup
    restoreBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileErrors = this.validator.validateFile(file, ['.json']);
        if (fileErrors.length > 0) {
            Utils.showNotification(fileErrors[0], 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (!backup.data || !Array.isArray(backup.data)) {
                    throw new Error('Formato de backup inválido');
                }
                
                this.occurrences = backup.data;
                if (backup.settings) {
                    this.settings = { ...DEFAULT_SETTINGS, ...backup.settings };
                }
                
                this.saveOccurrences();
                this.saveSettings();
                this.updateFiltersOptions();
                this.updateDashboards();
                this.checkAlerts();
                
                this.closeModal('backupModal');
                Utils.showNotification('Backup restaurado com sucesso!', 'success');
                
            } catch (error) {
                Utils.handleError(error, 'Backup restoration');
            }
        };
        
        reader.readAsText(file);
    }

    // Import data
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileErrors = this.validator.validateFile(file, ['.csv', '.xlsx']);
        if (fileErrors.length > 0) {
            Utils.showNotification(fileErrors[0], 'error');
            return;
        }
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            this.importCSV(file);
        } else {
            Utils.showNotification('Formato de arquivo não suportado. Use CSV.', 'error');
        }
    }

    // Import CSV
    importCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                
                if (lines.length > 1) {
                    Utils.showNotification(`Tentativa de importar ${lines.length - 1} registros. Funcionalidade em desenvolvimento.`, 'warning');
                }
            } catch (error) {
                Utils.handleError(error, 'CSV import');
            }
        };
        reader.readAsText(file);
    }

    // Generate automatic report
    generateAutomaticReport() {
        try {
            const data = this.getFilteredData();
            
            const reportContent = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Relatório SST Automático</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            margin: 40px; 
                            line-height: 1.6;
                            color: #333;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            border-bottom: 2px solid #667eea;
                            padding-bottom: 20px;
                        }
                        .summary { 
                            display: grid; 
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                            gap: 20px; 
                            margin-bottom: 30px; 
                        }
                        .summary-card { 
                            background: #f8f9fa; 
                            padding: 20px; 
                            border-radius: 8px; 
                            text-align: center;
                            border-left: 4px solid #667eea;
                        }
                        .summary-card h3 {
                            color: #667eea;
                            font-size: 2rem;
                            margin: 0;
                        }
                        .summary-card p {
                            margin: 10px 0 0 0;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        h1 { color: #667eea; }
                        h2 { color: #2c3e50; margin-top: 30px; }
                        .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Relatório de Segurança do Trabalho</h1>
                        <p>Gerado em: ${Utils.formatDate(new Date(), 'DD/MM/YYYY HH:mm')}</p>
                    </div>
                    
                    <div class="summary">
                        <div class="summary-card">
                            <h3>${data.length}</h3>
                            <p>Total de Ocorrências</p>
                        </div>
                        <div class="summary-card">
                            <h3>${data.filter(o => o.type === 'Acidente').length}</h3>
                            <p>Acidentes</p>
                        </div>
                        <div class="summary-card">
                            <h3>${data.filter(o => o.type === 'Incidente').length}</h3>
                            <p>Incidentes</p>
                        </div>
                        <div class="summary-card">
                            <h3>${data.filter(o => o.highPotential).length}</h3>
                            <p>Alto Potencial</p>
                        </div>
                        <div class="summary-card">
                            <h3>${data.filter(o => o.fatalAccident).length}</h3>
                            <p>Acidentes Fatais</p>
                        </div>
                    </div>
                    
                    <h2>Resumo Executivo</h2>
                    <p>No período analisado foram registradas <strong>${data.length}</strong> ocorrências, sendo <strong>${data.filter(o => o.type === 'Acidente').length}</strong> acidentes e <strong>${data.filter(o => o.type === 'Incidente').length}</strong> incidentes.</p>
                    
                    <div class="highlight">
                        <p><strong>Taxa de eventos de alto potencial:</strong> ${data.length > 0 ? Utils.formatNumber((data.filter(o => o.highPotential).length / data.length) * 100, 1) : 0}%</p>
                    </div>
                    
                    <h2>Análise por Gravidade</h2>
                    <ul>
                        <li><strong>Leves:</strong> ${data.filter(o => o.severity === 'Leve').length} (${data.length > 0 ? Utils.formatNumber((data.filter(o => o.severity === 'Leve').length / data.length) * 100, 1) : 0}%)</li>
                        <li><strong>Moderadas:</strong> ${data.filter(o => o.severity === 'Moderada').length} (${data.length > 0 ? Utils.formatNumber((data.filter(o => o.severity === 'Moderada').length / data.length) * 100, 1) : 0}%)</li>
                        <li><strong>Graves:</strong> ${data.filter(o => o.severity === 'Grave').length} (${data.length > 0 ? Utils.formatNumber((data.filter(o => o.severity === 'Grave').length / data.length) * 100, 1) : 0}%)</li>
                    </ul>
                </body>
                </html>
            `;
            
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(reportContent);
            reportWindow.document.close();
            
            Utils.showNotification('Relatório gerado com sucesso!', 'success');
            
        } catch (error) {
            Utils.handleError(error, 'Report generation');
        }
    }

    // Data persistence
    saveOccurrences() {
        return Utils.saveToStorage(CONFIG.STORAGE_KEYS.occurrences, this.occurrences);
    }

    loadOccurrences() {
        this.occurrences = Utils.loadFromStorage(CONFIG.STORAGE_KEYS.occurrences, []);
    }

    saveSettings() {
        return Utils.saveToStorage(CONFIG.STORAGE_KEYS.settings, this.settings);
    }

    loadSettings() {
        this.settings = { ...DEFAULT_SETTINGS, ...Utils.loadFromStorage(CONFIG.STORAGE_KEYS.settings, {}) };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.occurrenceManager = new OccurrenceManager();
    } catch (error) {
        Utils.handleError(error, 'Application startup');
        Utils.showNotification('Erro ao inicializar o sistema', 'error');
    }
});

// Handle unhandled errors
window.addEventListener('error', (event) => {
    Utils.handleError(event.error, 'Global error handler');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    Utils.handleError(event.reason, 'Unhandled promise rejection');
    event.preventDefault();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OccurrenceManager;
}

