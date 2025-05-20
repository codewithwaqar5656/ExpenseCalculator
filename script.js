document.addEventListener('DOMContentLoaded', function() {
    // Common functionality for all pages
    const currentYear = new Date().getFullYear();
    document.getElementById('current-year').textContent = currentYear;
    
    // Set last updated date for policy/terms pages
    if (document.getElementById('update-date')) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('update-date').textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    // Contact form handling
    if (document.getElementById('contact-form')) {
        document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Only run calculator code on the index page
    if (document.getElementById('expense-form')) {
        // Calculator functionality
        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        let expenseChart = null;
        
        const expenseForm = document.getElementById('expense-form');
        const expensesList = document.getElementById('expenses-list');
        const totalAmountElement = document.getElementById('total-amount');
        const resetBtn = document.getElementById('reset-btn');
        const exportBtn = document.getElementById('export-btn');
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        const expenseChartCanvas = document.getElementById('expense-chart');
        
        // Initialize calculator
        renderExpenses();
        updateTotal();
        renderChart();
        
        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();
        
        // Event listeners
        expenseForm.addEventListener('submit', addExpense);
        resetBtn.addEventListener('click', resetExpenses);
        exportBtn.addEventListener('click', exportToCSV);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Calculator functions
        function addExpense(e) {
            e.preventDefault();
            
            const date = document.getElementById('date').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const notes = document.getElementById('notes').value;
            
            if (!date || !category || isNaN(amount)) {
                alert('Please fill in all required fields with valid data');
                return;
            }
            
            const expense = {
                id: Date.now(),
                date,
                category,
                amount,
                notes
            };
            
            expenses.push(expense);
            saveExpenses();
            renderExpenses();
            updateTotal();
            renderChart();
            
            expenseForm.reset();
        }
        
        function renderExpenses() {
            if (expenses.length === 0) {
                expensesList.innerHTML = '<tr><td colspan="5" style="text-align: center;">No expenses added yet</td></tr>';
                return;
            }
            
            expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            expensesList.innerHTML = '';
            
            expenses.forEach(expense => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.category}</td>
                    <td>$${expense.amount.toFixed(2)}</td>
                    <td>${expense.notes || '-'}</td>
                    <td><button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button></td>
                `;
                expensesList.appendChild(row);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteExpense);
            });
        }
        
        function deleteExpense(e) {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
            renderExpenses();
            updateTotal();
            renderChart();
        }
        
        function resetExpenses() {
            if (confirm('Are you sure you want to delete all expenses?')) {
                expenses = [];
                saveExpenses();
                renderExpenses();
                updateTotal();
                renderChart();
            }
        }
        
        function updateTotal() {
            const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            totalAmountElement.textContent = `$${total.toFixed(2)}`;
        }
        
        function saveExpenses() {
            localStorage.setItem('expenses', JSON.stringify(expenses));
        }
        
        function exportToCSV() {
            if (expenses.length === 0) {
                alert('No expenses to export');
                return;
            }
            
            let csv = 'Date,Category,Amount,Notes\n';
            expenses.forEach(expense => {
                csv += `"${formatDate(expense.date)}","${expense.category}","${expense.amount.toFixed(2)}","${expense.notes || ''}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        
        function switchTab(tabId) {
            tabs.forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
            });
            
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === tabId);
            });
            
            if (tabId === 'analytics') {
                setTimeout(renderChart, 100);
            }
        }
        
        function renderChart() {
            const categories = {};
            expenses.forEach(expense => {
                categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
            });
            
            const ctx = expenseChartCanvas.getContext('2d');
            
            if (expenseChart) {
                expenseChart.destroy();
            }
            
            expenseChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: [
                            '#4a6fa5',
                            '#6b8cae',
                            '#ff7e5f',
                            '#59a5d8',
                            '#386fa4'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
    }
});