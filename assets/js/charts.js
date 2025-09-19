// Chart management class
class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = CONFIG.COLORS;
        this.defaultOptions = CONFIG.CHART_OPTIONS;
        this.setupResponsiveHeights();
    }

    // Setup responsive heights based on screen size
    setupResponsiveHeights() {
        this.updateChartHeights();
        
        // Listen for window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.updateChartHeights();
            this.resizeCharts();
        }, 250));
    }

    // Update chart container heights based on screen size
    updateChartHeights() {
        const width = window.innerWidth;
        let height;
        
        if (width <= CONFIG.BREAKPOINTS.mobile) {
            height = CONFIG.CHART_HEIGHTS.mobile;
        } else if (width <= CONFIG.BREAKPOINTS.tablet) {
            height = CONFIG.CHART_HEIGHTS.tablet;
        } else {
            height = CONFIG.CHART_HEIGHTS.desktop;
        }
        
        // Apply height to all chart containers
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.style.height = `${height}px`;
            
            // Special handling for full-width charts
            if (container.classList.contains('full-width')) {
                container.style.height = `${height + 100}px`;
            }
        });
    }

    // Initialize all charts
    initializeCharts() {
        // First update heights
        this.updateChartHeights();
        
        // Then create charts
        this.createOccurrencesByMonthChart();
        this.createOccurrencesByTypeChart();
        this.createOccurrencesByCategoryChart();
        this.createOccurrencesBySeverityChart();
        this.createOccurrencesByLocationChart();
        this.createOccurrencesByBodyPartChart();
        this.createCControlChart();
        this.createHighPotentialCharts();
    }

    // Resize existing charts
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Destroy all charts
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // Create monthly occurrences chart
    createOccurrencesByMonthChart() {
        const ctx = document.getElementById('occurrencesByMonthChart');
        if (!ctx) return;

        this.charts.monthChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    x: { 
                        stacked: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: { 
                        stacked: true, 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Evolução Mensal de Ocorrências por Gravidade'
                    }
                }
            }
        });
    }

    // Update monthly chart
    updateOccurrencesByMonthChart(data) {
        if (!this.charts.monthChart) return;

        const monthlyData = data.reduce((acc, o) => {
            const monthYear = `${o.year}-${String(o.month).padStart(2, '0')}`;
            acc[monthYear] = acc[monthYear] || { leve: 0, moderada: 0, grave: 0, altoPotencial: 0 };
            
            if (o.highPotential) {
                acc[monthYear].altoPotencial++;
            } else {
                const severity = o.severity.toLowerCase();
                if (acc[monthYear][severity] !== undefined) {
                    acc[monthYear][severity]++;
                }
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            return dayjs().year(year).month(Number(month) - 1).format('MMM/YY');
        });

        this.charts.monthChart.data.labels = labels;
        this.charts.monthChart.data.datasets = [
            {
                label: 'Leve',
                data: sortedMonths.map(m => monthlyData[m].leve),
                backgroundColor: this.colors.leve,
                borderColor: this.colors.leve,
                borderWidth: 1
            },
            {
                label: 'Moderada',
                data: sortedMonths.map(m => monthlyData[m].moderada),
                backgroundColor: this.colors.moderada,
                borderColor: this.colors.moderada,
                borderWidth: 1
            },
            {
                label: 'Grave',
                data: sortedMonths.map(m => monthlyData[m].grave),
                backgroundColor: this.colors.grave,
                borderColor: this.colors.grave,
                borderWidth: 1
            },
            {
                label: 'Alto Potencial',
                data: sortedMonths.map(m => monthlyData[m].altoPotencial),
                backgroundColor: this.colors.altoPotencial,
                borderColor: this.colors.altoPotencial,
                borderWidth: 1
            }
        ];
        
        this.charts.monthChart.update('none');
    }

    // Create type distribution chart
    createOccurrencesByTypeChart() {
        const ctx = document.getElementById('occurrencesByTypeChart');
        if (!ctx) return;

        this.charts.typeChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Acidente', 'Incidente'],
                datasets: [{
                    data: [],
                    backgroundColor: [this.colors.acidente, this.colors.incidente],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '60%',
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Distribuição por Tipo de Ocorrência'
                    }
                }
            }
        });
    }

    // Update type chart
    updateOccurrencesByTypeChart(data) {
        if (!this.charts.typeChart) return;

        const typeCounts = data.reduce((acc, o) => {
            acc[o.type] = (acc[o.type] || 0) + 1;
            return acc;
        }, {});

        this.charts.typeChart.data.datasets[0].data = [
            typeCounts['Acidente'] || 0,
            typeCounts['Incidente'] || 0
        ];
        
        this.charts.typeChart.update('none');
    }

    // Create category chart
    createOccurrencesByCategoryChart() {
        const ctx = document.getElementById('occurrencesByCategoryChart');
        if (!ctx) return;

        this.charts.categoryChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ocorrências',
                    data: [],
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                indexAxis: 'y',
                scales: {
                    x: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Ocorrências por Categoria'
                    }
                }
            }
        });
    }

    // Update category chart
    updateOccurrencesByCategoryChart(data) {
        if (!this.charts.categoryChart) return;

        const categoryCounts = data.reduce((acc, o) => {
            acc[o.category] = (acc[o.category] || 0) + 1;
            return acc;
        }, {});

        const sortedEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
        
        this.charts.categoryChart.data.labels = sortedEntries.map(e => e[0]);
        this.charts.categoryChart.data.datasets[0].data = sortedEntries.map(e => e[1]);
        this.charts.categoryChart.data.datasets[0].backgroundColor = Utils.generateColorPalette(sortedEntries.length);
        
        this.charts.categoryChart.update('none');
    }

    // Create severity chart
    createOccurrencesBySeverityChart() {
        const ctx = document.getElementById('occurrencesBySeverityChart');
        if (!ctx) return;

        this.charts.severityChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Leve', 'Moderada', 'Grave'],
                datasets: [{
                    data: [],
                    backgroundColor: [this.colors.leve, this.colors.moderada, this.colors.grave],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Distribuição por Gravidade'
                    }
                }
            }
        });
    }

    // Update severity chart
    updateOccurrencesBySeverityChart(data) {
        if (!this.charts.severityChart) return;

        const severityCounts = data.reduce((acc, o) => {
            acc[o.severity] = (acc[o.severity] || 0) + 1;
            return acc;
        }, {});

        this.charts.severityChart.data.datasets[0].data = [
            severityCounts['Leve'] || 0,
            severityCounts['Moderada'] || 0,
            severityCounts['Grave'] || 0
        ];
        
        this.charts.severityChart.update('none');
    }

    // Create location chart
    createOccurrencesByLocationChart() {
        const ctx = document.getElementById('occurrencesByLocationChart');
        if (!ctx) return;

        this.charts.locationChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ocorrências',
                    data: [],
                    backgroundColor: this.colors.info,
                    borderColor: this.colors.info,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Ocorrências por Localização'
                    }
                }
            }
        });
    }

    // Update location chart
    updateOccurrencesByLocationChart(data) {
        if (!this.charts.locationChart) return;

        const locationCounts = data.reduce((acc, o) => {
            acc[o.location] = (acc[o.location] || 0) + 1;
            return acc;
        }, {});

        const sortedEntries = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
        
        this.charts.locationChart.data.labels = sortedEntries.map(e => e[0]);
        this.charts.locationChart.data.datasets[0].data = sortedEntries.map(e => e[1]);
        this.charts.locationChart.data.datasets[0].backgroundColor = Utils.generateColorPalette(sortedEntries.length);
        
        this.charts.locationChart.update('none');
    }

    // Create body part chart
    createOccurrencesByBodyPartChart() {
        const ctx = document.getElementById('occurrencesByBodyPartChart');
        if (!ctx) return;

        // Get current screen size for responsive configuration
        const width = window.innerWidth;
        let legendMaxColumns = 4;
        let legendPadding = 8;
        let legendFontSize = 11;
        
        if (width <= CONFIG.BREAKPOINTS.mobile) {
            legendMaxColumns = 2;
            legendPadding = 6;
            legendFontSize = 10;
        } else if (width <= CONFIG.BREAKPOINTS.tablet) {
            legendMaxColumns = 3;
            legendPadding = 7;
            legendFontSize = 10;
        }

        this.charts.bodyPartChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '50%',
                layout: {
                    padding: {
                        top: 5,
                        bottom: 5,
                        left: 5,
                        right: 5
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        position: 'top',
                        align: 'center',
                        labels: {
                            boxWidth: 12,
                            padding: legendPadding,
                            font: {
                                size: legendFontSize
                            },
                            usePointStyle: true,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        return {
                                            text: `${label} (${value})`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor,
                                            lineWidth: dataset.borderWidth,
                                            pointStyle: 'circle',
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        },
                        maxColumns: legendMaxColumns
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    // Update body part chart
    updateOccurrencesByBodyPartChart(data) {
        if (!this.charts.bodyPartChart) return;

        const bodyPartData = data.filter(o => o.bodyPart);
        const bodyPartCounts = bodyPartData.reduce((acc, o) => {
            acc[o.bodyPart] = (acc[o.bodyPart] || 0) + 1;
            return acc;
        }, {});

        const sortedEntries = Object.entries(bodyPartCounts).sort((a, b) => b[1] - a[1]);
        
        this.charts.bodyPartChart.data.labels = sortedEntries.map(e => e[0]);
        this.charts.bodyPartChart.data.datasets[0].data = sortedEntries.map(e => e[1]);
        this.charts.bodyPartChart.data.datasets[0].backgroundColor = Utils.generateColorPalette(sortedEntries.length);
        
        this.charts.bodyPartChart.update('none');
    }

    // Create C-Control chart
    createCControlChart() {
        const ctx = document.getElementById('cControlChart');
        if (!ctx) return;

        this.charts.cChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Ocorrências',
                        data: [],
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary,
                        pointBackgroundColor: [],
                        pointBorderColor: [],
                        pointRadius: 5,
                        fill: false
                    },
                    {
                        label: 'Limite Superior (UCL)',
                        data: [],
                        borderColor: this.colors.danger,
                        backgroundColor: 'transparent',
                        borderDash: [10, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Média (CL)',
                        data: [],
                        borderColor: this.colors.success,
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Limite Inferior (LCL)',
                        data: [],
                        borderColor: this.colors.danger,
                        backgroundColor: 'transparent',
                        borderDash: [10, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Gráfico de Controle Estatístico (C-Chart)'
                    }
                },
                interaction: {
                    intersect: false
                }
            }
        });
    }

    // Update C-Control chart
    updateCControlChart(data) {
        if (!this.charts.cChart) return;

        const monthlyCounts = {};
        data.forEach(o => {
            const monthYear = `${o.year}-${String(o.month).padStart(2, '0')}`;
            monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthlyCounts).sort();
        if (sortedMonths.length === 0) {
            this.charts.cChart.data.labels = [];
            this.charts.cChart.data.datasets.forEach(ds => ds.data = []);
            this.charts.cChart.update('none');
            return;
        }

        const counts = sortedMonths.map(m => monthlyCounts[m]);
        const cBar = counts.reduce((a, b) => a + b, 0) / counts.length;
        const ucl = cBar + 3 * Math.sqrt(cBar);
        const lcl = Math.max(0, cBar - 3 * Math.sqrt(cBar));

        const labels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            return dayjs().year(year).month(Number(month) - 1).format('MMM/YY');
        });

        const pointColors = counts.map(c => (c > ucl || c < lcl) ? this.colors.danger : this.colors.primary);

        this.charts.cChart.data.labels = labels;
        this.charts.cChart.data.datasets[0].data = counts;
        this.charts.cChart.data.datasets[0].pointBackgroundColor = pointColors;
        this.charts.cChart.data.datasets[0].pointBorderColor = pointColors;
        this.charts.cChart.data.datasets[1].data = new Array(counts.length).fill(ucl);
        this.charts.cChart.data.datasets[2].data = new Array(counts.length).fill(cBar);
        this.charts.cChart.data.datasets[3].data = new Array(counts.length).fill(lcl);
        
        this.charts.cChart.update('none');
    }

    // Create high potential charts
    createHighPotentialCharts() {
        this.createHighPotentialTrendChart();
        this.createHighPotentialByCategoryChart();
        this.createHighPotentialByLocationChart();
    }

    // Create high potential trend chart
    createHighPotentialTrendChart() {
        const ctx = document.getElementById('highPotentialTrendChart');
        if (!ctx) return;

        this.charts.highPotentialTrendChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Evolução de Eventos de Alto Potencial vs Demais',
                        color: '#ffffff'
                    },
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        labels: {
                            ...this.defaultOptions.plugins.legend.labels,
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    // Update high potential trend chart
    updateHighPotentialTrendChart(data) {
        if (!this.charts.highPotentialTrendChart) return;

        const monthlyData = data.reduce((acc, o) => {
            const monthYear = `${o.year}-${String(o.month).padStart(2, '0')}`;
            acc[monthYear] = acc[monthYear] || { highPotential: 0, normal: 0 };
            
            if (o.highPotential) {
                acc[monthYear].highPotential++;
            } else {
                acc[monthYear].normal++;
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            return dayjs().year(year).month(Number(month) - 1).format('MMM/YY');
        });

        this.charts.highPotentialTrendChart.data.labels = labels;
        this.charts.highPotentialTrendChart.data.datasets = [
            {
                label: 'Alto Potencial',
                data: sortedMonths.map(m => monthlyData[m].highPotential),
                borderColor: this.colors.altoPotencial,
                backgroundColor: this.colors.altoPotencial,
                tension: 0.1,
                fill: false
            },
            {
                label: 'Demais Eventos',
                data: sortedMonths.map(m => monthlyData[m].normal),
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary,
                tension: 0.1,
                fill: false
            }
        ];
        
        this.charts.highPotentialTrendChart.update('none');
    }

    // Create high potential by category chart
    createHighPotentialByCategoryChart() {
        const ctx = document.getElementById('highPotentialByCategoryChart');
        if (!ctx) return;

        this.charts.highPotentialByCategoryChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Alto Potencial',
                    data: [],
                    backgroundColor: this.colors.altoPotencial,
                    borderColor: this.colors.altoPotencial,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Alto Potencial por Categoria',
                        color: '#ffffff'
                    },
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        labels: {
                            ...this.defaultOptions.plugins.legend.labels,
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    // Update high potential by category chart
    updateHighPotentialByCategoryChart(data) {
        if (!this.charts.highPotentialByCategoryChart) return;

        const highPotentialData = data.filter(o => o.highPotential);
        const categoryCounts = highPotentialData.reduce((acc, o) => {
            acc[o.category] = (acc[o.category] || 0) + 1;
            return acc;
        }, {});

        const sortedEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
        
        this.charts.highPotentialByCategoryChart.data.labels = sortedEntries.map(e => e[0]);
        this.charts.highPotentialByCategoryChart.data.datasets[0].data = sortedEntries.map(e => e[1]);
        
        this.charts.highPotentialByCategoryChart.update('none');
    }

    // Create high potential by location chart
    createHighPotentialByLocationChart() {
        const ctx = document.getElementById('highPotentialByLocationChart');
        if (!ctx) return;

        this.charts.highPotentialByLocationChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Alto Potencial',
                    data: [],
                    backgroundColor: this.colors.altoPotencial,
                    borderColor: this.colors.altoPotencial,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                indexAxis: 'y',
                scales: {
                    x: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'Alto Potencial por Localização',
                        color: '#ffffff'
                    },
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        labels: {
                            ...this.defaultOptions.plugins.legend.labels,
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    // Update high potential by location chart
    updateHighPotentialByLocationChart(data) {
        if (!this.charts.highPotentialByLocationChart) return;

        const highPotentialData = data.filter(o => o.highPotential);
        const locationCounts = highPotentialData.reduce((acc, o) => {
            acc[o.location] = (acc[o.location] || 0) + 1;
            return acc;
        }, {});

        const sortedEntries = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
        
        this.charts.highPotentialByLocationChart.data.labels = sortedEntries.map(e => e[0]);
        this.charts.highPotentialByLocationChart.data.datasets[0].data = sortedEntries.map(e => e[1]);
        
        this.charts.highPotentialByLocationChart.update('none');
    }

    // Update all charts
    updateAllCharts(data) {
        this.updateOccurrencesByMonthChart(data);
        this.updateOccurrencesByTypeChart(data);
        this.updateOccurrencesByCategoryChart(data);
        this.updateOccurrencesBySeverityChart(data);
        this.updateOccurrencesByLocationChart(data);
        this.updateOccurrencesByBodyPartChart(data);
        this.updateCControlChart(data);
        this.updateHighPotentialTrendChart(data);
        this.updateHighPotentialByCategoryChart(data);
        this.updateHighPotentialByLocationChart(data);
    }

    // Resize charts (useful for responsive design)
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Export chart as image
    exportChart(chartName, filename) {
        const chart = this.charts[chartName];
        if (!chart) {
            Utils.showNotification('Gráfico não encontrado', 'error');
            return;
        }

        const canvas = chart.canvas;
        const url = canvas.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${chartName}.png`;
        a.click();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}

