let accidentData = JSON.parse(localStorage.getItem('accidentData')) || [];

document.addEventListener('DOMContentLoaded', () => {
    const inputScreen = document.getElementById('inputScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const inputScreenBtn = document.getElementById('inputScreenBtn');
    const dashboardScreenBtn = document.getElementById('dashboardScreenBtn');
    const accidentForm = document.getElementById('accidentForm');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('fileInput');
    const currentDateElement = document.getElementById('currentDate');

    // Display current date
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = `Data atual: ${now.toLocaleDateString('pt-BR')}`;
    }

    // Event Listeners
    if (inputScreenBtn) inputScreenBtn.addEventListener('click', showInputScreen);
    if (dashboardScreenBtn) dashboardScreenBtn.addEventListener('click', showDashboardScreen);
    if (accidentForm) accidentForm.addEventListener('submit', handleFormSubmit);
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', applyFilters);
    if (downloadTemplateBtn) downloadTemplateBtn.addEventListener('click', downloadTemplate);
    if (uploadFileBtn) uploadFileBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    // Initialize dashboard
    updateDashboard(accidentData);

    function showInputScreen() {
        inputScreen.classList.add('active');
        dashboardScreen.classList.remove('active');
        inputScreenBtn.setAttribute('aria-pressed', 'true');
        dashboardScreenBtn.setAttribute('aria-pressed', 'false');
    }

    function showDashboardScreen() {
        inputScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        inputScreenBtn.setAttribute('aria-pressed', 'false');
        dashboardScreenBtn.setAttribute('aria-pressed', 'true');
        updateDashboard(accidentData);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const newAccident = {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            location: document.getElementById('location').value,
            type: document.getElementById('type').value,
            severity: document.getElementById('severity').value,
            description: document.getElementById('description').value
        };
        accidentData.push(newAccident);
        saveAccidentData();
        accidentForm.reset();
        alert('Relatório de acidente enviado com sucesso!');
        updateDashboard(accidentData);
    }

    function updateDashboard(data) {
        showLoadingIndicator();
        setTimeout(() => {
            try {
                updateKPIs(data);
                createAccidentsOverTimeChart(data);
                createCControlChart(data);
                createAccidentsByTypeChart(data);
                createAccidentsBySeverityOverTimeChart(data);
                createAccidentsHistoryChart(data);
            } catch (error) {
                console.error('Erro ao atualizar dashboard:', error);
                alert('Ocorreu um erro ao atualizar o dashboard. Por favor, tente novamente.');
            } finally {
                hideLoadingIndicator();
            }
        }, 10);
    }

    function updateKPIs(data) {
        // Total Accidents
        document.getElementById('totalAccidents').textContent = data.length;

        // Current vs Last Year
        const currentYear = new Date().getFullYear();
        const currentYearAccidents = data.filter(acc => new Date(acc.date).getFullYear() === currentYear).length;
        const lastYearAccidents = data.filter(acc => new Date(acc.date).getFullYear() === currentYear - 1).length;
        const yearOverYearChange = lastYearAccidents === 0 ? 100 : 
            ((currentYearAccidents - lastYearAccidents) / lastYearAccidents * 100).toFixed(1);
        document.getElementById('currentVsLastYear').textContent = `${yearOverYearChange}%`;

        // Most Common Incident
        const typeCount = {};
        data.forEach(acc => {
            typeCount[acc.type] = (typeCount[acc.type] || 0) + 1;
        });
        const mostCommonType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('mostCommonIncident').textContent = mostCommonType ? mostCommonType[0] : 'N/A';

        // Most Dangerous Location
        const locationCount = {};
        data.forEach(acc => {
            locationCount[acc.location] = (locationCount[acc.location] || 0) + 1;
        });
        const mostDangerousLocation = Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('mostDangerousLocation').textContent = mostDangerousLocation ? mostDangerousLocation[0] : 'N/A';
    }

    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const filterType = document.getElementById('filterType').value;

        const filteredData = accidentData.filter(acc => {
            const accidentDate = new Date(acc.date);
            const isDateInRange = (!startDate || accidentDate >= new Date(startDate)) && 
                                (!endDate || accidentDate <= new Date(endDate));
            const isTypeMatch = filterType === 'Todos' || acc.type === filterType;
            return isDateInRange && isTypeMatch;
        });

        updateDashboard(filteredData);
    }

    function downloadTemplate() {
        const template = [
            {
                date: '2023-01-01',
                time: '09:00',
                location: 'Local Exemplo',
                type: 'Escorregão e Queda',
                severity: 'Baixa',
                description: 'Descrição exemplo'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "template_relatorio_acidentes.xlsx");
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            showLoadingIndicator();
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                accidentData = accidentData.concat(jsonData);
                saveAccidentData();
                updateDashboard(accidentData);
                alert(`Arquivo importado com sucesso! ${jsonData.length} novos registros adicionados.`);
            } catch (error) {
                console.error('Erro ao importar arquivo:', error);
                alert('Erro ao importar arquivo. Por favor, verifique o formato e tente novamente.');
            } finally {
                hideLoadingIndicator();
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function saveAccidentData() {
        localStorage.setItem('accidentData', JSON.stringify(accidentData));
    }

    function createAccidentsOverTimeChart(data) {
        const ctx = document.getElementById('accidentsOverTimeChart');
        if (!ctx) return;

        const monthlyData = new Array(12).fill(0);
        data.forEach(accident => {
            const month = new Date(accident.date).getMonth();
            monthlyData[month]++;
        });

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Acidentes',
                    data: monthlyData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Acidentes'
                        }
                    }
                }
            }
        });
    }

    function createCControlChart(data) {
        const ctx = document.getElementById('cControlChart');
        if (!ctx) return;

        const monthlyData = new Array(12).fill(0);
        data.forEach(accident => {
            const month = new Date(accident.date).getMonth();
            monthlyData[month]++;
        });

        const average = monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;
        const ucl = average + 3 * Math.sqrt(average);
        const lcl = Math.max(0, average - 3 * Math.sqrt(average));

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Acidentes',
                    data: monthlyData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }, {
                    label: 'UCL',
                    data: Array(12).fill(ucl),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderDash: [5, 5],
                    fill: false
                }, {
                    label: 'LCL',
                    data: Array(12).fill(lcl),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function createAccidentsByTypeChart(data) {
        const ctx = document.getElementById('accidentsByTypeChart');
        if (!ctx) return;

        const typeCount = {};
        data.forEach(accident => {
            typeCount[accident.type] = (typeCount[accident.type] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(typeCount),
                datasets: [{
                    data: Object.values(typeCount),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    function createAccidentsBySeverityOverTimeChart(data) {
        const ctx = document.getElementById('accidentsBySeverityOverTimeChart');
        if (!ctx) return;

        const severities = ['Baixa', 'Médio', 'Grave', 'Crítico'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        const datasets = severities.map(severity => {
            const monthlyData = new Array(12).fill(0);
            data.forEach(accident => {
                if (accident.severity === severity) {
                    const month = new Date(accident.date).getMonth();
                    monthlyData[month]++;
                }
            });
            return {
                label: severity,
                data: monthlyData,
                borderColor: severity === 'Crítico' ? 'rgba(255, 99, 132, 1)' :
                           severity === 'Grave' ? 'rgba(255, 159, 64, 1)' :
                           severity === 'Médio' ? 'rgba(255, 205, 86, 1)' :
                           'rgba(75, 192, 192, 1)',
                fill: false
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function createAccidentsHistoryChart(data) {
        const ctx = document.getElementById('accidentsHistoryChart');
        if (!ctx) return;

        const yearCount = {};
        data.forEach(accident => {
            const year = new Date(accident.date).getFullYear();
            yearCount[year] = (yearCount[year] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(yearCount),
                datasets: [{
                    label: 'Acidentes por Ano',
                    data: Object.values(yearCount),
                    backgroundColor: 'rgba(75, 192, 192, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function showLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
});