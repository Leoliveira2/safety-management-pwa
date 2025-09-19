// Configuration constants
const CONFIG = {
    // Chart colors
    COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        leve: '#3498db',
        moderada: '#f39c12',
        grave: '#e74c3c',
        altoPotencial: '#000000',
        acidente: '#e74c3c',
        incidente: '#3498db'
    },
    
    // Alert thresholds
    ALERT_THRESHOLDS: {
        highPotentialPercentage: 5, // 5% threshold for high potential events
        maxAccidentsPerMonth: 10,
        maxIncidentsPerMonth: 20
    },
    
    // Local storage keys
    STORAGE_KEYS: {
        occurrences: 'sst_occurrences',
        settings: 'sst_settings',
        lastBackup: 'sst_last_backup'
    },
    
    // Form validation rules
    VALIDATION: {
        required: ['occurrenceDate', 'occurrenceTime', 'occurrenceLocation', 'occurrenceCategory', 'occurrenceSeverity', 'occurrenceType', 'occurrenceResponsibleManagement'],
        maxLength: {
            location: 100,
            description: 1000,
            responsibleManagement: 50
        },
        minValues: {
            involvedPeople: 1,
            workHours: 0
        }
    },
    
    // Chart options
    CHART_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'center',
                labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: {
                        size: 11
                    },
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#667eea',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12
            }
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    },
    
    // Chart responsive heights
    CHART_HEIGHTS: {
        mobile: 250,    // iPhone/small screens
        tablet: 350,    // iPad/medium screens  
        desktop: 400    // Laptop/large screens
    },
    
    // Breakpoints for responsive design
    BREAKPOINTS: {
        mobile: 768,
        tablet: 1024
    },
    
    // Export formats
    EXPORT_FORMATS: {
        csv: {
            extension: '.csv',
            mimeType: 'text/csv',
            headers: ['ID', 'Data', 'Horário', 'Localização', 'Categoria', 'Gravidade', 'Tipo', 'Alto Potencial', 'Parte do Corpo', 'Gerência', 'Descrição']
        },
        json: {
            extension: '.json',
            mimeType: 'application/json'
        }
    },
    
    // Notification settings
    NOTIFICATIONS: {
        duration: 5000, // 5 seconds
        position: 'top-right'
    },
    
    // Performance settings
    PERFORMANCE: {
        debounceDelay: 300, // milliseconds
        maxChartDataPoints: 100,
        lazyLoadThreshold: 50
    }
};

// Default settings
const DEFAULT_SETTINGS = {
    alertThresholds: CONFIG.ALERT_THRESHOLDS,
    autoSave: true,
    theme: 'default',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    chartAnimations: true,
    notifications: true,
    lastBackup: null,
    company: {
        name: 'Empresa',
        totalEmployees: 0,
        totalWorkHoursPerMonth: 0,
        hasWorkHoursData: false,
        hasEmployeeData: false
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, DEFAULT_SETTINGS };
}

