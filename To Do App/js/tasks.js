// Task management functionality
class TaskManager {
    constructor() {
        this.tasks = [];
        this.lists = [];
        this.currentList = 'all';
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentView = 'list';
        this.searchQuery = '';
    }

    // Initialize task manager
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    }

    // Load data from storage
    loadData() {
        this.tasks = Storage.getTasks();
        this.lists = Storage.getLists();
        
        // Create sample data if no tasks exist
        if (this.tasks.length === 0) {
            this.createSampleData();
        }
    }

    // Create sample data for new users
    createSampleData() {
        const sampleTasks = [
            {
                id: Utils.generateId(),
                title: 'Welcome to TaskMaster! 🎉',
                description: 'This is your first task. Click to edit or mark as complete.',
                completed: false,
                dueDate: null,
                priority: 'medium',
                list: 'inbox',
                tags: ['welcome', 'getting-started'],
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 0
            },
            {
                id: Utils.generateId(),
                title: 'Create your first custom list',
                description: 'Organize your tasks by creating custom lists for different projects or categories.',
                completed: false,
                dueDate: new Date(Date.now() + 86400000), // Tomorrow
                priority: 'high',
                list: 'inbox',
                tags: ['tutorial', 'organization'],
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: Utils.generateId(),
                title: 'Explore task features',
                description: 'Try adding due dates, priorities, and tags to your tasks.',
                completed: true,
                dueDate: null,
                priority: 'low',
                list: 'inbox',
                tags: ['tutorial', 'features'],
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 2
            }
        ];

        this.tasks = sampleTasks;
        this.saveTasks();
    }

    // Save tasks to storage
    saveTasks() {
        Storage.saveTasks(this.tasks);
    }

    // Save lists to storage
    saveLists() {
        Storage.saveLists(this.lists);
    }

    // Get tasks based on current filters
    getFilteredTasks() {
        let filteredTasks = [...this.tasks];

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Filter by current list
        if (this.currentList !== 'all') {
            if (this.currentList === 'today') {
                filteredTasks = filteredTasks.filter(task => Utils.isToday(task.dueDate));
            } else if (this.currentList === 'important') {
                filteredTasks = filteredTasks.filter(task => task.priority === 'high');
            } else if (this.currentList === 'completed') {
                filteredTasks = filteredTasks.filter(task => task.completed);
            } else {
                filteredTasks = filteredTasks.filter(task => task.list === this.currentList);
            }
        }

        // Filter by status
        if (this.currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        // Sort tasks
        filteredTasks = this.sortTasks(filteredTasks);

        return filteredTasks;
    }

    // Sort tasks based on current sort option
    sortTasks(tasks) {
        const sortedTasks = [...tasks];
        
        switch (this.currentSort) {
            case 'newest':
                return sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sortedTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return sortedTasks.sort((a, b) => {
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            case 'dueDate':
                return sortedTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'title':
                return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sortedTasks;
        }
    }

    // Create new task
    createTask(taskData) {
        const newTask = {
            id: Utils.generateId(),
            ...taskData,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            order: this.tasks.length
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        
        UI.showNotification('Task created successfully!', 'success');
        return newTask;
    }

    // Update existing task
    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return null;

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            updatedAt: new Date()
        };

        this.saveTasks();
        
        UI.showNotification('Task updated successfully!', 'success');
        return this.tasks[taskIndex];
    }

    // Delete task
    deleteTask(taskId) {
        UI.showConfirmation('Are you sure you want to delete this task? This action cannot be undone.', 'Delete', 'Cancel')
            .then(confirmed => {
                if (confirmed) {
                    this.tasks = this.tasks.filter(task => task.id !== taskId);
                    this.saveTasks();
                    this.render();
                    UI.showNotification('Task deleted successfully!', 'success');
                }
            });
    }

    // Toggle task completion
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date();
            this.saveTasks();
            this.renderTasks();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as active';
            UI.showNotification(message, 'success', 2000);
        }
    }

    // Create new list
    createList(listData) {
        const newList = {
            id: Utils.generateId(),
            ...listData,
            createdAt: new Date(),
            order: this.lists.length
        };

        this.lists.push(newList);
        this.saveLists();
        
        UI.showNotification('List created successfully!', 'success');
        return newList;
    }

    // Delete list
    deleteList(listId) {
        // Don't allow deleting default lists
        const defaultLists = ['inbox', 'today', 'important', 'completed'];
        if (defaultLists.includes(listId)) {
            UI.showNotification('Cannot delete default lists.', 'error');
            return;
        }

        UI.showConfirmation('Are you sure you want to delete this list? All tasks in this list will be moved to Inbox.', 'Delete', 'Cancel')
            .then(confirmed => {
                if (confirmed) {
                    // Move tasks to inbox
                    this.tasks.forEach(task => {
                        if (task.list === listId) {
                            task.list = 'inbox';
                        }
                    });

                    // Remove the list
                    this.lists = this.lists.filter(list => list.id !== listId);
                    this.saveLists();
                    this.saveTasks();
                    this.render();
                    
                    UI.showNotification('List deleted successfully!', 'success');
                }
            });
    }

    // Get list by ID
    getList(listId) {
        return this.lists.find(list => list.id === listId);
    }

    // Get task by ID
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    // Update task counts
    updateStats() {
        UI.updateTaskCounts(this.tasks);
        
        // Update current task count
        const currentTaskCount = document.getElementById('currentTaskCount');
        if (currentTaskCount) {
            currentTaskCount.textContent = this.getFilteredTasks().length;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchQuery = e.target.value.trim();
                this.renderTasks();
            }, 300));
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.currentTarget.dataset.view;
                
                // Update active state
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                this.renderTasks();
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                UI.toggleTheme();
            });
        }
    }

    // Render the entire app
    render() {
        this.renderLists();
        this.renderTasks();
        this.updateStats();
        this.updatePageTitle();
    }

    // Render tasks
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');
        const filteredTasks = this.getFilteredTasks();

        // Show loading state briefly for better UX
        UI.showLoading();
        setTimeout(() => {
            UI.hideLoading();

            if (filteredTasks.length === 0) {
                tasksList.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            tasksList.style.display = 'block';
            emptyState.style.display = 'none';

            // Set appropriate class for view mode
            tasksList.className = this.currentView === 'grid' ? 'tasks-grid' : 'tasks-list';

            tasksList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
        }, 100);
    }

    // Render single task
    renderTask(task) {
        const priorityInfo = UI.formatPriority(task.priority);
        const dueDateText = task.dueDate ? Utils.formatDate(task.dueDate) : '';
        const isOverdue = task.dueDate && !task.completed && Utils.isOverdue(task.dueDate);
        const isToday = task.dueDate && Utils.isToday(task.dueDate);
        
        const dueDateClass = isOverdue ? 'overdue' : isToday ? 'today' : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" 
                 data-task-id="${task.id}" role="listitem">
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTaskCompletion('${task.id}')"
                           aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                    <span class="checkmark"></span>
                </div>
                
                <div class="task-content">
                    <div class="task-header">
                        <h4 class="task-title">${Utils.escapeHtml(task.title)}</h4>
                        <div class="task-actions">
                            <button class="task-action-btn" onclick="app.openTaskModal('${task.id}')" 
                                    aria-label="Edit task" title="Edit task">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="task-action-btn delete" onclick="taskManager.deleteTask('${task.id}')" 
                                    aria-label="Delete task" title="Delete task">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${task.description ? `
                        <p class="task-description">${Utils.escapeHtml(task.description)}</p>
                    ` : ''}
                    
                    <div class="task-meta">
                        ${dueDateText ? `
                            <span class="task-due-date ${dueDateClass}">
                                <i class="fas fa-calendar"></i>
                                ${dueDateText}
                            </span>
                        ` : ''}
                        
                        <span class="task-priority ${priorityInfo.class}">
                            <i class="fas fa-flag"></i>
                            ${priorityInfo.text}
                        </span>
                        
                        ${task.tags && task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `
                                    <span class="task-tag">${Utils.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Render lists in sidebar
    renderLists() {
        const customListsContainer = document.getElementById('customLists');
        if (!customListsContainer) return;

        const customLists = this.lists.filter(list => !['inbox', 'today', 'important', 'completed'].includes(list.id));
        
        customListsContainer.innerHTML = customLists.map(list => `
            <li class="nav-item" data-list="${list.id}" role="button" tabindex="0">
                <i class="fas fa-list" style="color: ${list.color}"></i>
                <span>${Utils.escapeHtml(list.name)}</span>
                <span class="task-count">${this.tasks.filter(task => task.list === list.id).length}</span>
            </li>
        `).join('');

        // Re-attach event listeners
        customListsContainer.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleListChange(e.currentTarget.dataset.list);
            });
        });
    }

    // Handle list change
    handleListChange(listId) {
        this.currentList = listId;
        
        // Update active state in navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-list="${listId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        this.updatePageTitle();
        this.renderTasks();
    }

    // Handle filter change
    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.renderTasks();
    }

    // Handle sort change
    handleSortChange(sort) {
        this.currentSort = sort;
        this.renderTasks();
    }

    // Update page title based on current view
    updatePageTitle() {
        const titleElement = document.getElementById('pageTitle');
        const subtitleElement = document.getElementById('pageSubtitle');
        
        if (!titleElement || !subtitleElement) return;

        let title = 'All Tasks';
        let subtitle = `You have ${this.getFilteredTasks().length} tasks`;

        switch (this.currentList) {
            case 'today':
                title = 'Today';
                subtitle = 'Tasks due today';
                break;
            case 'important':
                title = 'Important';
                subtitle = 'High priority tasks';
                break;
            case 'completed':
                title = 'Completed';
                subtitle = 'Finished tasks';
                break;
            default:
                if (this.currentList !== 'all') {
                    const list = this.getList(this.currentList);
                    title = list ? list.name : 'Tasks';
                    subtitle = `Tasks in ${title}`;
                }
                break;
        }
        
        titleElement.textContent = title;
        subtitleElement.textContent = subtitle;
    }
}

// Initialize task manager
const taskManager = new TaskManager();