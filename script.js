document.addEventListener('DOMContentLoaded', () => {
    // Definir as cores em variáveis JavaScript para lógica, mas usar as variáveis CSS para o estilo
    const COLOR_MAP = {
        'Leve': '#FFC107',
        'Moderada': '#FF8C00',
        'Grave': '#DC3545',
        'Acidente': '#e74c3c',
        'Incidente': '#3498db',
        'Alto Potencial': '#000000',
    };

    class OccurrenceManager {
        constructor() {
            this.storageKey = 'sst_occurrences';
            this.occurrences = this.loadOccurrences();
            this.charts = {};
            this.initializeForm();
            this.initializeDashboards();
            window.occurrenceManager = this;
        }

        loadOccurrences() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Erro ao carregar dados do localStorage:", e);
                return [];
            }
        }

        saveOccurrences() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.occurrences));
        }

        generateId() {
            return this.occurrences.length > 0
                ? Math.max(...this.occurrences.map(o => o.id)) + 1
                : 1;
        }

        initializeForm() {
            const form = document.getElementById('occurrenceForm');
            const idField = document.getElementById('occurrenceId');
            const dateField = document.getElementById('occurrenceDate');

            idField.value = this.generateId();
            dateField.value = dayjs().format('YYYY-MM-DD');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addOccurrence();
            });
        }

        addOccurrence() {
            const form = document.getElementById('occurrenceForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                this.showNotification('Por favor, preencha todos os campos obrigatórios (*).', 'danger');
                return;
            }

            const date = document.getElementById('occurrenceDate').value;
            const dateObj = dayjs(date);

            const occurrence = {
                id: this.generateId(),
                date: date,
                month: dateObj.month() + 1,
                year: dateObj.year(),
                time: document.getElementById('occurrenceTime').value,
                location: document.getElementById('occurrenceLocation').value,
                category: document.getElementById('occurrenceCategory').value,
                severity: document.getElementById('occurrenceSeverity').value,
                type: document.getElementById('occurrenceType').value,
                highPotential: document.getElementById('occurrenceHighPotential').checked,
                bodyPart: document.getElementById('occurrenceBodyPart').value,
                description: document.getElementById('occurrenceDescription').value,
                responsibleManagement: document.getElementById('occurrenceResponsibleManagement').value
            };

            this.occurrences.push(occurrence);
            this.saveOccurrences();
            this.resetForm();
            this.updateFiltersOptions();
            this.updateDashboards();
            this.showNotification('Ocorrência registrada com sucesso!', 'success');
        }

        resetForm() {
            document.getElementById('occurrenceForm').reset();
            document.getElementById('occurrenceId').value = this.generateId();
            document.getElementById('occurrenceDate').value = dayjs().format('YYYY-MM-DD');
        }

        showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        generateSampleData() {
            const categories = ['Queda', 'Choque', 'Desvio', 'Corte', 'Fratura', 'Outro'];
            const severities = ['Leve', 'Moderada', 'Grave'];
            const types = ['Acidente', 'Incidente'];
            const bodyParts = ['Mão', 'Cabeça', 'Joelho', 'Braço', 'Perna', 'Tronco', 'Olho', 'Pé'];
            const locations = ['Área de Produção', 'Escritório', 'Almoxarifado', 'Laboratório', 'Oficina', 'Pátio'];
            const managements = ['Produção', 'Manutenção', 'RH', 'Qualidade', 'Logística'];

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
                    highPotential: Math.random() > 0.85,
                    bodyPart: bodyParts[Math.floor(Math.random() * bodyParts.length)],
                    description: 'Descrição de exemplo gerada automaticamente',
                    responsibleManagement: managements[Math.floor(Math.random() * managements.length)]
                };
                sampleOccurrences.push(occurrence);
            }

            this.occurrences = sampleOccurrences;
            this.saveOccurrences();
            this.updateFiltersOptions();
            this.updateDashboards();
            this.showNotification('300 ocorrências de exemplo geradas com sucesso!', 'success');
        }

        initializeDashboards() {
            this.createAllCharts();
            this.initializeFilters();
            this.updateFiltersOptions();
            this.updateDashboards();
        }

        initializeFilters() {
            document.getElementById('applyFilters').addEventListener('click', () => this.updateDashboards());
            document.getElementById('clearFilters').addEventListener('click', () => {
                ['filterYear', 'filterMonth', 'filterType', 'filterSeverity', 'filterCategory',
                    'filterLocation', 'filterBodyPart', 'filterManagement'].forEach(id => {
                        document.getElementById(id).value = '';
                    });
                this.updateDashboards();
            });
        }

        updateFiltersOptions() {
            this.updateFilterOptions('filterYear', [...new Set(this.occurrences.map(o => o.year))].sort());
            this.updateFilterOptions('filterCategory', [...new Set(this.occurrences.map(o => o.category))].filter(x => x));
            this.updateFilterOptions('filterLocation', [...new Set(this.occurrences.map(o => o.location))].filter(x => x));
            this.updateFilterOptions('filterBodyPart', [...new Set(this.occurrences.map(o => o.bodyPart))].filter(x => x));
            this.updateFilterOptions('filterManagement', [...new Set(this.occurrences.map(o => o.responsibleManagement))].filter(x => x));
        }

        updateFilterOptions(selectId, options) {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                select.appendChild(opt);
            });
            select.value = currentValue;
        }

        getFilteredOccurrences() {
            const year = document.getElementById('filterYear').value;
            const month = document.getElementById('filterMonth').value;
            const type = document.getElementById('filterType').value;
            const severity = document.getElementById('filterSeverity').value;
            const category = document.getElementById('filterCategory').value;
            const location = document.getElementById('filterLocation').value;
            const bodyPart = document.getElementById('filterBodyPart').value;
            const management = document.getElementById('filterManagement').value;

            return this.occurrences.filter(o =>
                (!year || o.year.toString() === year) &&
                (!month || o.month.toString() === month) &&
                (!type || o.type === type) &&
                (!severity || o.severity === severity) &&
                (!category || o.category === category) &&
                (!location || o.location === location) &&
                (!bodyPart || o.bodyPart === bodyPart) &&
                (!management || o.responsibleManagement === management)
            );
        }

        updateDashboards() {
            const filteredOccurrences = this.getFilteredOccurrences();
            this.updateStatsSummary(filteredOccurrences);
            this.updateOccurrencesByMonthChart(filteredOccurrences);
            this.updateOccurrencesByTypeChart(filteredOccurrences);
            this.updateOccurrencesByCategoryChart(filteredOccurrences);
            this.updateOccurrencesBySeverityChart(filteredOccurrences);
            this.updateOccurrencesByLocationChart(filteredOccurrences);
            this.updateOccurrencesByBodyPartChart(filteredOccurrences);
            this.updateCControlChart(filteredOccurrences);
            this.updateHighPotentialDashboards(filteredOccurrences);
        }
        
        // Função utilitária para atualizar gráficos
        updateChart(chartId, data, config) {
            const ctx = document.getElementById(chartId).getContext('2d');
            if (this.charts[chartId]) {
                this.charts[chartId].data.labels = data.labels;
                this.charts[chartId].data.datasets = data.datasets;
                if (config.options) {
                    this.charts[chartId].options = config.options;
                }
                this.charts[chartId].update();
            } else {
                this.charts[chartId] = new Chart(ctx, {
                    type: config.type,
                    data: {
                        labels: data.labels,
                        datasets: data.datasets,
                    },
                    options: config.options,
                    plugins: config.plugins,
                });
            }
        }

        updateStatsSummary(occurrences) {
            const total = occurrences.length;
            const accidents = occurrences.filter(o => o.type === 'Acidente').length;
            const incidents = occurrences.filter(o => o.type === 'Incidente').length;
            const highPotential = occurrences.filter(o => o.highPotential).length;
            const grave = occurrences.filter(o => o.severity === 'Grave').length;

            const statsContainer = document.getElementById('statsSummary');
            statsContainer.innerHTML = `
                <div class="stat-card total">
                    <div class="stat-number">${total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-card accidents">
                    <div class="stat-number">${accidents}</div>
                    <div class="stat-label">Acidentes</div>
                </div>
                <div class="stat-card incidents">
                    <div class="stat-number">${incidents}</div>
                    <div class="stat-label">Incidentes</div>
                </div>
                <div class="stat-card high-potential">
                    <div class="stat-number">${highPotential}</div>
                    <div class="stat-label">Alto Potencial</div>
                </div>
                <div class="stat-card grave">
                    <div class="stat-number">${grave}</div>
                    <div class="stat-label">Ocorrências Graves</div>
                </div>
            `;
        }

        updateOccurrencesByMonthChart(occurrences) {
            const monthlyCounts = occurrences.reduce((acc, o) => {
                const date = dayjs(o.date);
                const monthYear = date.format('YYYY-MM');
                acc[monthYear] = (acc[monthYear] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(monthlyCounts).sort().map(my => dayjs(my).format('MMM YYYY'));
            const data = Object.keys(monthlyCounts).sort().map(my => monthlyCounts[my]);

            this.updateChart('occurrencesByMonthChart', {
                labels: labels,
                datasets: [{
                    label: 'Número de Ocorrências',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            }, {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }
        
        updateOccurrencesByTypeChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.type] = (acc[o.type] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts);
            const data = labels.map(label => counts[label]);
            const colors = labels.map(label => COLOR_MAP[label]);

            this.updateChart('occurrencesByTypeChart', {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                }]
            }, {
                type: 'doughnut',
                plugins: [ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        datalabels: {
                            color: '#fff',
                            formatter: (value, context) => {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${percentage}%`;
                            }
                        }
                    }
                }
            });
        }

        updateOccurrencesByCategoryChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.category] = (acc[o.category] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts).sort();
            const data = labels.map(label => counts[label]);

            this.updateChart('occurrencesByCategoryChart', {
                labels: labels,
                datasets: [{
                    label: 'Ocorrências por Categoria',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1,
                }]
            }, {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
        
        updateOccurrencesBySeverityChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.severity] = (acc[o.severity] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts);
            const data = labels.map(label => counts[label]);
            const colors = labels.map(label => COLOR_MAP[label]);

            this.updateChart('occurrencesBySeverityChart', {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                }]
            }, {
                type: 'pie',
                plugins: [ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        datalabels: {
                            color: '#fff',
                            formatter: (value, context) => {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${percentage}%`;
                            }
                        }
                    }
                }
            });
        }

        updateOccurrencesByLocationChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.location] = (acc[o.location] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
            const data = labels.map(label => counts[label]);

            this.updateChart('occurrencesByLocationChart', {
                labels: labels,
                datasets: [{
                    label: 'Ocorrências por Localização',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            }, {
                type: 'bar',
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
        
        updateOccurrencesByBodyPartChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                if (o.bodyPart) {
                    acc[o.bodyPart] = (acc[o.bodyPart] || 0) + 1;
                }
                return acc;
            }, {});

            const labels = Object.keys(counts);
            const data = labels.map(label => counts[label]);
            const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 50%)`);

            this.updateChart('occurrencesByBodyPartChart', {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            }, {
                type: 'polarArea',
                plugins: [ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        datalabels: {
                            formatter: (value) => value,
                            color: '#fff',
                            anchor: 'end',
                            align: 'start',
                            offset: -20
                        }
                    }
                }
            });
        }

        updateCControlChart(occurrences) {
            const monthlyCounts = occurrences.reduce((acc, o) => {
                const date = dayjs(o.date);
                const monthYear = date.format('YYYY-MM');
                acc[monthYear] = (acc[monthYear] || 0) + 1;
                return acc;
            }, {});
            
            const sortedMonths = Object.keys(monthlyCounts).sort();
            const counts = sortedMonths.map(m => monthlyCounts[m]);
            const labels = sortedMonths.map(my => dayjs(my).format('MMM YYYY'));

            const n = counts.length;
            if (n === 0) {
                this.updateChart('cControlChart', { labels: [], datasets: [] }, { type: 'line', options: { responsive: true, maintainAspectRatio: false } });
                return;
            }

            const cBar = counts.reduce((a, b) => a + b, 0) / n;
            const ucl = cBar + 3 * Math.sqrt(cBar);
            const lcl = Math.max(0, cBar - 3 * Math.sqrt(cBar));
            const lclPoints = new Array(n).fill(lcl);

            const pointColors = counts.map(c => (c > ucl || c < lcl) ? 'red' : 'rgb(75, 192, 192)');

            this.updateChart('cControlChart', {
                labels: labels,
                datasets: [
                    {
                        label: 'Número de Ocorrências',
                        data: counts,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        pointBackgroundColor: pointColors,
                        pointBorderColor: pointColors,
                        fill: false,
                        tension: 0.1,
                    },
                    {
                        label: 'LSC (UCL)',
                        data: new Array(n).fill(ucl),
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0,
                    },
                    {
                        label: 'Média (C-bar)',
                        data: new Array(n).fill(cBar),
                        borderColor: 'rgb(54, 162, 235)',
                        pointRadius: 0,
                        fill: false,
                        tension: 0,
                    },
                    {
                        label: 'LIC (LCL)',
                        data: new Array(n).fill(lcl),
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0,
                    }
                ]
            }, {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
        
        updateHighPotentialDashboards(occurrences) {
            const highPotentialOccurrences = occurrences.filter(o => o.highPotential);
            const otherOccurrences = occurrences.filter(o => !o.highPotential);

            this.updateHighPotentialStats(highPotentialOccurrences);
            this.updateHighPotentialTrendChart(highPotentialOccurrences, otherOccurrences);
            this.updateHighPotentialByCategoryChart(highPotentialOccurrences);
            this.updateHighPotentialByLocationChart(highPotentialOccurrences);
        }
        
        updateHighPotentialStats(occurrences) {
            const totalHighPotential = occurrences.length;
            const statsContainer = document.getElementById('highPotentialStats');
            statsContainer.innerHTML = `
                <div class="stat-card high-potential">
                    <div class="stat-number">${totalHighPotential}</div>
                    <div class="stat-label">Total de Eventos</div>
                </div>
            `;
        }

        updateHighPotentialTrendChart(highPotential, others) {
            const highPotentialMonthly = highPotential.reduce((acc, o) => {
                const monthYear = dayjs(o.date).format('YYYY-MM');
                acc[monthYear] = (acc[monthYear] || 0) + 1;
                return acc;
            }, {});

            const otherMonthly = others.reduce((acc, o) => {
                const monthYear = dayjs(o.date).format('YYYY-MM');
                acc[monthYear] = (acc[monthYear] || 0) + 1;
                return acc;
            }, {});

            const allMonths = [...new Set([...Object.keys(highPotentialMonthly), ...Object.keys(otherMonthly)])].sort();
            const highPotentialData = allMonths.map(m => highPotentialMonthly[m] || 0);
            const otherData = allMonths.map(m => otherMonthly[m] || 0);
            const labels = allMonths.map(my => dayjs(my).format('MMM YYYY'));

            this.updateChart('highPotentialTrendChart', {
                labels: labels,
                datasets: [
                    {
                        label: 'Eventos de Alto Potencial',
                        data: highPotentialData,
                        borderColor: COLOR_MAP['Alto Potencial'],
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Demais Ocorrências',
                        data: otherData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            }, {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }

        updateHighPotentialByCategoryChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.category] = (acc[o.category] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts).sort();
            const data = labels.map(label => counts[label]);
            const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 50%, 40%)`);

            this.updateChart('highPotentialByCategoryChart', {
                labels: labels,
                datasets: [{
                    label: 'Ocorrências por Categoria',
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            }, {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        updateHighPotentialByLocationChart(occurrences) {
            const counts = occurrences.reduce((acc, o) => {
                acc[o.location] = (acc[o.location] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(counts).sort();
            const data = labels.map(label => counts[label]);
            const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 50%, 40%)`);

            this.updateChart('highPotentialByLocationChart', {
                labels: labels,
                datasets: [{
                    label: 'Ocorrências por Localização',
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            }, {
                type: 'bar',
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { x: { beginAtZero: true } }
                }
            });
        }
    }
    new OccurrenceManager();
});
