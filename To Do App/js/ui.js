// UI components and interactions
class UI {
    // Show notification
    static showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="notification-message">
                    <strong>${this.capitalizeFirst(type)}</strong>
                    <span>${Utils.escapeHtml(message)}</span>
                </div>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
            <div class="notification-progress"></div>
        `;

        container.appendChild(notification);

        // Add event listener to close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove if duration is specified
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    // Remove notification
    static removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Get notification icon based on type
    static getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Capitalize first letter
    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Show loading state
    static showLoading(containerId = 'tasksContainer') {
        const container = document.getElementById(containerId);
        const loadingState = container.querySelector('.loading-state');
        const tasksList = container.querySelector('.tasks-list');
        const emptyState = container.querySelector('.empty-state');
        
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
        if (tasksList) {
            tasksList.style.display = 'none';
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    // Hide loading state
    static hideLoading(containerId = 'tasksContainer') {
        const container = document.getElementById(containerId);
        const loadingState = container.querySelector('.loading-state');
        
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    // Show modal
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus trap
        this.trapFocus(modal);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide modal
    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Trap focus inside modal
    static trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }

            if (e.key === 'Escape') {
                UI.hideModal(modal.id);
            }
        });

        // Focus first element
        if (firstElement) {
            firstElement.focus();
        }
    }

    // Toggle theme
    static toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.saveTheme(newTheme);
        
        // Update theme toggle button icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
        
        return newTheme;
    }

    // Initialize theme
    static initTheme() {
        const savedTheme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle button icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }

    // Show confirmation dialog
    static showConfirmation(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Confirmation</h3>
                    </div>
                    <div class="modal-body">
                        <p>${Utils.escapeHtml(message)}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="confirmCancel">${cancelText}</button>
                        <button class="btn btn-danger" id="confirmOk">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const handleConfirm = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            modal.querySelector('#confirmOk').addEventListener('click', () => handleConfirm(true));
            modal.querySelector('#confirmCancel').addEventListener('click', () => handleConfirm(false));

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleConfirm(false);
                }
            });
        });
    }

    // Update task counts in sidebar
    static updateTaskCounts(tasks) {
        const elements = {
            allCount: tasks.length,
            todayCount: tasks.filter(task => Utils.isToday(task.dueDate)).length,
            importantCount: tasks.filter(task => task.priority === 'high').length,
            completedCount: tasks.filter(task => task.completed).length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(task => task.completed).length,
            pendingTasks: tasks.filter(task => !task.completed).length,
            overdueTasks: tasks.filter(task => !task.completed && Utils.isOverdue(task.dueDate)).length
        };

        for (const [id, count] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        }
    }

    // Format priority for display
    static formatPriority(priority) {
        const priorities = {
            low: { text: 'Low', class: 'priority-low' },
            medium: { text: 'Medium', class: 'priority-medium' },
            high: { text: 'High', class: 'priority-high' }
        };
        return priorities[priority] || priorities.medium;
    }

    // Add ripple effect to buttons
    static addRippleEffect(button) {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Initialize all ripple effects
    static initRippleEffects() {
        document.querySelectorAll('.btn').forEach(btn => {
            this.addRippleEffect(btn);
        });
    }
}

// Add ripple effect styles
const rippleStyles = `
.ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.7);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.btn {
    position: relative;
    overflow: hidden;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = rippleStyles;
document.head.appendChild(styleSheet);