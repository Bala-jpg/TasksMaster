// LocalStorage management
class Storage {
    static STORAGE_KEYS = {
        TASKS: 'taskmaster_tasks',
        LISTS: 'taskmaster_lists',
        SETTINGS: 'taskmaster_settings',
        THEME: 'taskmaster_theme'
    };

    // Tasks management
    static getTasks() {
        try {
            const tasks = localStorage.getItem(this.STORAGE_KEYS.TASKS);
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error loading tasks from storage:', error);
            this.showStorageError();
            return [];
        }
    }

    static saveTasks(tasks) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
            this.showStorageError();
            return false;
        }
    }

    // Lists management
    static getLists() {
        try {
            const lists = localStorage.getItem(this.STORAGE_KEYS.LISTS);
            const defaultLists = [
                { id: 'inbox', name: 'Inbox', color: '#3b82f6', order: 0, createdAt: new Date() },
                { id: 'work', name: 'Work', color: '#ef4444', order: 1, createdAt: new Date() },
                { id: 'personal', name: 'Personal', color: '#10b981', order: 2, createdAt: new Date() }
            ];
            
            return lists ? JSON.parse(lists) : defaultLists;
        } catch (error) {
            console.error('Error loading lists from storage:', error);
            this.showStorageError();
            return defaultLists;
        }
    }

    static saveLists(lists) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LISTS, JSON.stringify(lists));
            return true;
        } catch (error) {
            console.error('Error saving lists to storage:', error);
            this.showStorageError();
            return false;
        }
    }

    // Settings management
    static getSettings() {
        try {
            const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            const defaultSettings = {
                theme: 'light',
                notifications: true,
                sound: true,
                autoBackup: false,
                language: 'en',
                dateFormat: 'MM/DD/YYYY',
                startOfWeek: 0 // 0 = Sunday, 1 = Monday
            };
            
            return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
        } catch (error) {
            console.error('Error loading settings from storage:', error);
            return defaultSettings;
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings to storage:', error);
            return false;
        }
    }

    // Theme management
    static getTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.THEME) || 'light';
        } catch (error) {
            console.error('Error loading theme from storage:', error);
            return 'light';
        }
    }

    static saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error saving theme to storage:', error);
            return false;
        }
    }

    // Export data
    static exportData() {
        try {
            const data = {
                tasks: this.getTasks(),
                lists: this.getLists(),
                settings: this.getSettings(),
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    // Import data
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.tasks || !data.lists || !data.settings) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Save imported data
                    this.saveTasks(data.tasks);
                    this.saveLists(data.lists);
                    this.saveSettings(data.settings);
                    
                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Clear all data
    static clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.TASKS);
            localStorage.removeItem(this.STORAGE_KEYS.LISTS);
            localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Get storage usage
    static getStorageUsage() {
        try {
            let totalSize = 0;
            for (let key in this.STORAGE_KEYS) {
                const value = localStorage.getItem(this.STORAGE_KEYS[key]);
                if (value) {
                    totalSize += new Blob([value]).size;
                }
            }
            return totalSize;
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return 0;
        }
    }

    // Show storage error notification
    static showStorageError() {
        if (typeof UI !== 'undefined') {
            UI.showNotification(
                'Storage error: Unable to save data. Please check if your browser supports localStorage.',
                'error',
                5000
            );
        }
    }

    // Check if localStorage is available
    static isStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}