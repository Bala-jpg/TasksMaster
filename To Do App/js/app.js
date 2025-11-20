// Main application controller
class TaskMasterApp {
    constructor() {
        this.taskManager = taskManager;
        this.currentEditingTask = null;
        this.currentEditingList = null;
    }

    // Initialize the application
    init() {
        this.initializeApp();
    }

    // Initialize all app components
    initializeApp() {
        // Initialize theme
        UI.initTheme();
        
        // Initialize task manager
        this.taskManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI effects
        UI.initRippleEffects();
        
        // Show welcome message for new users
        this.showWelcomeMessage();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Task modal
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('emptyAddTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModals());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeModals());

        // List modal
        document.getElementById('addListBtn').addEventListener('click', () => this.openListModal());
        document.getElementById('listForm').addEventListener('submit', (e) => this.handleListSubmit(e));
        document.getElementById('closeListModal').addEventListener('click', () => this.closeModals());
        document.getElementById('cancelListBtn').addEventListener('click', () => this.closeModals());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const listId = e.currentTarget.dataset.list;
                this.taskManager.handleListChange(listId);
            });
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.taskManager.handleFilterChange(filter);
            });
        });

        // Sorting
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.taskManager.handleSortChange(e.target.value);
        });

        // Sidebar toggle
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Color picker in list modal
        this.setupColorPicker();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModals();
            });
        });

        // List name preview
        const listNameInput = document.getElementById('listName');
        if (listNameInput) {
            listNameInput.addEventListener('input', (e) => {
                this.updateListPreview();
            });
        }
    }

    // Setup color picker for list creation
    setupColorPicker() {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selected class from all options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                e.currentTarget.classList.add('selected');
                
                // Update preview
                this.updateListPreview();
            });
        });
    }

    // Update list preview in modal
    updateListPreview() {
        const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#3b82f6';
        const listName = document.getElementById('listName')?.value || 'New List';
        
        const previewIcon = document.getElementById('previewIcon');
        const previewName = document.getElementById('previewName');
        
        if (previewIcon) {
            previewIcon.style.backgroundColor = selectedColor;
        }
        if (previewName) {
            previewName.textContent = listName || 'New List';
        }
    }

    // Open task modal for creating/editing tasks
    openTaskModal(taskId = null) {
        this.currentEditingTask = taskId ? this.taskManager.getTask(taskId) : null;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('modalTitle');
        const submitButton = document.getElementById('submitButtonText');
        
        if (this.currentEditingTask) {
            title.textContent = 'Edit Task';
            submitButton.textContent = 'Update Task';
            this.populateTaskForm(this.currentEditingTask);
        } else {
            title.textContent = 'Add New Task';
            submitButton.textContent = 'Add Task';
            this.clearTaskForm();
        }
        
        UI.showModal('taskModal');
        document.getElementById('taskTitle').focus();
    }

    // Populate task form with existing data
    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDueDate').value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskList').value = task.list;
        document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
        
        // Update lists dropdown
        this.updateListsDropdown();
    }

    // Clear task form
    clearTaskForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskList').value = this.taskManager.currentList === 'all' ? 'inbox' : this.taskManager.currentList;
        
        // Update lists dropdown
        this.updateListsDropdown();
    }

    // Update lists dropdown in task form
    updateListsDropdown() {
        const listSelect = document.getElementById('taskList');
        const currentValue = listSelect.value;
        
        // Clear existing options except inbox
        listSelect.innerHTML = '<option value="inbox">Inbox</option>';
        
        // Add custom lists
        this.taskManager.lists.forEach(list => {
            if (!['inbox', 'today', 'important', 'completed'].includes(list.id)) {
                const option = document.createElement('option');
                option.value = list.id;
                option.textContent = list.name;
                listSelect.appendChild(option);
            }
        });
        
        // Restore previous value if it exists
        if (currentValue && Array.from(listSelect.options).some(opt => opt.value === currentValue)) {
            listSelect.value = currentValue;
        }
    }

    // Handle task form submission
    async handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const submitBtn = document.getElementById('submitTaskBtn');
        const spinner = document.getElementById('submitSpinner');
        const submitText = document.getElementById('submitButtonText');
        
        // Show loading state
        submitBtn.disabled = true;
        spinner.style.display = 'block';
        submitText.textContent = this.currentEditingTask ? 'Updating...' : 'Adding...';
        
        try {
            const taskData = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim(),
                dueDate: formData.get('dueDate') || null,
                priority: formData.get('priority'),
                list: formData.get('list'),
                tags: Utils.parseTags(formData.get('tags'))
            };

            // Validate required fields
            if (!taskData.title) {
                throw new Error('Task title is required');
            }

            if (this.currentEditingTask) {
                // Update existing task
                this.taskManager.updateTask(this.currentEditingTask.id, taskData);
            } else {
                // Create new task
                this.taskManager.createTask(taskData);
            }

            this.closeModals();
            this.taskManager.render();

        } catch (error) {
            UI.showNotification(error.message, 'error');
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            spinner.style.display = 'none';
            submitText.textContent = this.currentEditingTask ? 'Update Task' : 'Add Task';
        }
    }

    // Open list modal for creating lists
    openListModal(listId = null) {
        this.currentEditingList = listId ? this.taskManager.getList(listId) : null;
        const modal = document.getElementById('listModal');
        const title = document.getElementById('listModalTitle');
        const submitButton = modal.querySelector('button[type="submit"]');
        
        if (this.currentEditingList) {
            title.textContent = 'Edit List';
            submitButton.textContent = 'Update List';
            this.populateListForm(this.currentEditingList);
        } else {
            title.textContent = 'Create New List';
            submitButton.textContent = 'Create List';
            this.clearListForm();
        }
        
        UI.showModal('listModal');
        document.getElementById('listName').focus();
    }

    // Populate list form with existing data
    populateListForm(list) {
        document.getElementById('listName').value = list.name;
        
        // Select the correct color
        const colorOption = document.querySelector(`[data-color="${list.color}"]`);
        if (colorOption) {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            colorOption.classList.add('selected');
        }
        
        this.updateListPreview();
    }

    // Clear list form
    clearListForm() {
        document.getElementById('listForm').reset();
        
        // Reset color selection
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('[data-color="#3b82f6"]').classList.add('selected');
        
        this.updateListPreview();
    }

    // Handle list form submission
    handleListSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#3b82f6';
        
        const listData = {
            name: formData.get('name').trim(),
            color: selectedColor
        };

        // Validate required fields
        if (!listData.name) {
            UI.showNotification('List name is required', 'error');
            return;
        }

        if (this.currentEditingList) {
            // Update existing list
            // Note: For simplicity, we're not implementing list editing in this version
            UI.showNotification('List editing not implemented yet', 'info');
        } else {
            // Create new list
            this.taskManager.createList(listData);
        }

        this.closeModals();
        this.taskManager.render();
    }

    // Close all modals
    closeModals() {
        UI.hideModal('taskModal');
        UI.hideModal('listModal');
        this.currentEditingTask = null;
        this.currentEditingList = null;
    }

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '80px';
        } else {
            mainContent.style.marginLeft = '280px';
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openTaskModal();
        }
        
        // Ctrl/Cmd + K: Toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.toggleSidebar();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
        
        // Ctrl/Cmd + /: Show keyboard shortcuts help
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.showKeyboardShortcuts();
        }
    }

    // Show keyboard shortcuts help
    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + N', action: 'New task' },
            { key: 'Ctrl/Cmd + K', action: 'Toggle sidebar' },
            { key: 'Escape', action: 'Close modals' },
            { key: 'Ctrl/Cmd + /', action: 'Show this help' }
        ];

        const shortcutsHtml = shortcuts.map(shortcut => `
            <div class="shortcut-item">
                <kbd>${shortcut.key}</kbd>
                <span>${shortcut.action}</span>
            </div>
        `).join('');

        UI.showNotification(`
            <div class="keyboard-shortcuts">
                <h4>Keyboard Shortcuts</h4>
                ${shortcutsHtml}
            </div>
        `, 'info', 5000);
    }

    // Show welcome message for new users
    showWelcomeMessage() {
        const tasks = Storage.getTasks();
        
        // Only show welcome message if there are very few tasks (likely new user)
        if (tasks.length <= 3) {
            setTimeout(() => {
                UI.showNotification(
                    'Welcome to TaskMaster! Start by adding your first task or explore the features. 🚀',
                    'info',
                    6000
                );
            }, 1000);
        }
    }

    // Export data
    exportData() {
        if (Storage.exportData()) {
            UI.showNotification('Data exported successfully!', 'success');
        } else {
            UI.showNotification('Failed to export data', 'error');
        }
    }

    // Import data
    importData(file) {
        Storage.importData(file)
            .then(() => {
                this.taskManager.loadData();
                this.taskManager.render();
                UI.showNotification('Data imported successfully!', 'success');
            })
            .catch(error => {
                UI.showNotification('Failed to import data: ' + error.message, 'error');
            });
    }

    // Clear all data (with confirmation)
    clearAllData() {
        UI.showConfirmation(
            'Are you sure you want to clear all data? This action cannot be undone and will delete all your tasks and lists.',
            'Clear All',
            'Cancel'
        ).then(confirmed => {
            if (confirmed) {
                if (Storage.clearAllData()) {
                    this.taskManager.loadData();
                    this.taskManager.render();
                    UI.showNotification('All data cleared successfully!', 'success');
                } else {
                    UI.showNotification('Failed to clear data', 'error');
                }
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TaskMasterApp();
    window.app.init();
    
    // Make app globally available for onclick handlers
    window.taskManager = taskManager;
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}