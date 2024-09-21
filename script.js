let inventory;
try {
    inventory = JSON.parse(localStorage.getItem('inventory')) || {};
} catch (error) {
    console.error('Error parsing inventory from localStorage:', error);
    inventory = {};
}
const categories = {
    "蔬菜": ["胡萝卜", "西兰花", "番茄", "黄瓜", "其他"],
    "水果": ["苹果", "香蕉", "橙子", "草莓", "其他"],
    "肉类": ["牛肉", "猪肉", "鸡肉", "鱼", "其他"],
    "饮料": ["牛奶", "果汁", "水", "茶", "其他"],
    "其他": ["其他"]
};

const commonQuantities = [1, 2, 3, 5, 10];
const commonExpiryDays = [3, 7, 14, 30, 90];

// 定义状态常量
const STATUS = {
    FRESH: "新鲜",
    EXPIRING_SOON: "即将过期",
    EXPIRED: "已过期"
};

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Current page:', currentPage);

    switch(currentPage) {
        case 'index.html':
        case '':
            updateDashboard();
            break;
        case 'inventory-management.html':
            initializeInventoryManagement();
            break;
        case 'shopping-list.html':
            updateShoppingList();
            break;
        case 'recipes.html':
            suggestRecipes();
            break;
    }
});

function initializeInventoryManagement() {
    updateInventoryStatus();
    updateInventoryTables();
    document.getElementById('globalAddItemForm').addEventListener('submit', addGlobalNewItem);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // 添加这一行
    document.getElementById('globalAddItemBtn').addEventListener('click', showGlobalAddItemModal);
    
    // 添加点击事件监听器到整个表格容器
    document.getElementById('inventoryTables').addEventListener('click', handleRowClick);
}

function updateInventoryTables() {
    const inventoryTables = document.getElementById('inventoryTables');
    inventoryTables.innerHTML = '';

    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filteredInventory = Object.entries(inventory).reduce((acc, [itemName, item]) => {
        if ((categoryFilter === '' || item.category === categoryFilter) &&
            (statusFilter === '' || item.status === statusFilter)) {
            if (!acc[item.category]) {
                acc[item.category] = {};
            }
            acc[item.category][itemName] = item;
        }
        return acc;
    }, {});

    for (const [category, items] of Object.entries(filteredInventory)) {
        const table = createInventoryTable(category, items);
        inventoryTables.appendChild(table);
    }
}

function createInventoryTable(category, items) {
    const table = document.createElement('table');
    table.className = 'inventory-table';
    table.innerHTML = `
        <caption>${category}</caption>
        <thead>
            <tr>
                <th>物品名称</th>
                <th>数量</th>
                <th>单位</th>
                <th>过期日期</th>
                <th>状态</th>
                <th>预计消耗日期</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');
    for (const [itemName, item] of Object.entries(items)) {
        const row = createItemRow(itemName, item);
        tbody.appendChild(row);
    }

    const addItemRow = document.createElement('tr');
    addItemRow.className = 'add-item-row';
    addItemRow.innerHTML = `<td colspan="7"><button onclick="showAddItemForm('${category}')">+ 添加新物品</button></td>`;
    tbody.appendChild(addItemRow);

    return table;
}

function createItemRow(itemName, item) {
    const row = document.createElement('tr');
    row.dataset.itemName = itemName;
    const estimatedConsumptionDate = calculateEstimatedConsumptionDate(item);

    let statusIcon;
    switch(item.status) {
        case STATUS.FRESH:
            statusIcon = '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>';
            break;
        case STATUS.EXPIRING_SOON:
            statusIcon = '<i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>';
            break;
        case STATUS.EXPIRED:
            statusIcon = '<i class="fas fa-times-circle" style="color: var(--danger-color);"></i>';
            break;
        default:
            statusIcon = '';
    }

    row.innerHTML = `
        <td class="editable" data-field="name">${itemName}</td>
        <td class="editable" data-field="quantity">${item.quantity}</td>
        <td class="editable" data-field="unit">${item.unit}</td>
        <td class="editable" data-field="expiryDate">${item.expiryDate}</td>
        <td class="editable" data-field="status"><span>${statusIcon} ${item.status}</span></td>
        <td>${estimatedConsumptionDate}</td>
        <td class="actions">
            <button onclick="incrementQuantity('${itemName}')">+</button>
            <button onclick="decrementQuantity('${itemName}')">-</button>
            <button onclick="deleteItem('${itemName}')">删除</button>
        </td>
    `;
    const statusCell = row.querySelector('[data-field="status"] span');
    setStatusColor(statusCell, item.status);
    row.addEventListener('click', handleRowClick);
    return row;
}

function handleRowClick(event) {
    if (event.target.closest('.actions')) {
        return; // 如果点击的是操作按钮区域，不触发编辑模式
    }
    
    const cell = event.target.closest('td');
    if (!cell || !cell.classList.contains('editable')) {
        return; // 如果点击的不是可编辑单元格，不触发编辑模式
    }

    const row = cell.closest('tr');
    const itemName = row.dataset.itemName;
    const field = cell.dataset.field;
    const currentValue = cell.textContent;

    let input;
    if (field === 'status') {
        input = document.createElement('select');
        ['新鲜', '即将过期', '已过期'].forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (status === currentValue) {
                option.selected = true;
            }
            input.appendChild(option);
        });
    } else if (field === 'expiryDate') {
        input = document.createElement('input');
        input.type = 'date';
        input.value = currentValue;
    } else {
        input = document.createElement('input');
        input.type = field === 'quantity' ? 'number' : 'text';
        input.value = currentValue;
    }

    input.addEventListener('blur', () => saveEdit(itemName, field, input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit(itemName, field, input.value);
        } else if (e.key === 'Escape') {
            cell.textContent = currentValue;
        }
    });

    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
}

function saveEdit(itemName, field, newValue) {
    const item = inventory[itemName];
    if (!item) return;

    if (field === 'name') {
        delete inventory[itemName];
        itemName = newValue;
        inventory[itemName] = item;
    }

    item[field] = newValue;

    if (field === 'expiryDate') {
        item.status = calculateStatus(newValue);
    }

    saveInventory();
    updateInventoryTables();

    // 如果编辑的是过期日期或状态，更新状态颜色
    if (field === 'expiryDate' || field === 'status') {
        const row = document.querySelector(`tr[data-item-name="${itemName}"]`);
        if (row) {
            const statusCell = row.querySelector('[data-field="status"] span');
            setStatusColor(statusCell, item.status);
        }
    }
}

function calculateEstimatedConsumptionDate(item) {
    if (item.dailyConsumption && item.dailyConsumption > 0) {
        const daysLeft = Math.ceil(item.quantity / item.dailyConsumption);
        const consumptionDate = new Date();
        consumptionDate.setDate(consumptionDate.getDate() + daysLeft);
        return consumptionDate.toISOString().split('T')[0];
    }
    return '未知';
}

function incrementQuantity(itemName) {
    inventory[itemName].quantity++;
    saveInventory();
    updateInventoryTables();
}

function decrementQuantity(itemName) {
    if (inventory[itemName].quantity > 0) {
        inventory[itemName].quantity--;
        saveInventory();
        updateInventoryTables();
    }
}

function showAddItemForm(category) {
    const table = document.querySelector(`.inventory-table:has(caption:contains('${category}'))`);
    const form = document.createElement('tr');
    form.className = 'add-item-form';
    form.innerHTML = `
        <td><input type="text" id="newItemName" placeholder="物品名称" required></td>
        <td><input type="number" id="newItemQuantity" value="1" min="1" required></td>
        <td>
            <select id="newItemUnit" required>
                <option value="个">个</option>
                <option value="克">克</option>
                <option value="千克">千克</option>
                <option value="升">升</option>
            </select>
        </td>
        <td>
            <select id="newItemExpiryDays" onchange="updateNewItemExpiryDate()">
                <option value="3">3天</option>
                <option value="7">7天</option>
                <option value="14">14天</option>
                <option value="30">30天</option>
                <option value="90">90天</option>
            </select>
        </td>
        <td colspan="2">
            <select id="newItemDailyConsumption" required>
                <option value="0.1">0.1/天</option>
                <option value="0.5">0.5/天</option>
                <option value="1">1/天</option>
                <option value="2">2/天</option>
            </select>
        </td>
        <td>
            <button onclick="addNewItemToCategory('${category}')">保存</button>
            <button onclick="cancelAddItem()">取消</button>
        </td>
    `;
    table.querySelector('tbody').insertBefore(form, table.querySelector('.add-item-row'));
    
    // 设置默认日期为今天
    updateNewItemExpiryDate();
}

function updateNewItemExpiryDate() {
    const expiryDays = document.getElementById('newItemExpiryDays').value;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
    document.getElementById('newItemExpiryDate').value = expiryDate.toISOString().split('T')[0];
}

function addNewItemToCategory(category) {
    const name = document.getElementById('newItemName').value;
    const quantity = parseInt(document.getElementById('newItemQuantity').value);
    const unit = document.getElementById('newItemUnit').value;
    const expiryDate = document.getElementById('newItemExpiryDate').value;
    const dailyConsumption = parseFloat(document.getElementById('newItemDailyConsumption').value);

    if (name && quantity && unit && expiryDate && dailyConsumption) {
        const item = {
            name,
            quantity,
            unit,
            category,
            expiryDate,
            status: calculateStatus(expiryDate),
            dailyConsumption
        };

        inventory[name] = item;
        saveInventory();
        updateInventoryTables();
        
        // 添加动画效果
        const newRow = document.querySelector(`.inventory-table:has(caption:contains('${category}')) tr:has(td:contains('${name}'))`);
        newRow.classList.add('new-item-animation');
        setTimeout(() => newRow.classList.remove('new-item-animation'), 1000);
    } else {
        alert('请填写所有必要字段');
    }
}

function cancelAddItem() {
    updateInventoryTables();
}

function showGlobalAddItemModal() {
    const modal = document.getElementById('globalAddItemModal');
    modal.style.display = 'block';
    
    // 设置当前日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('globalItemPurchaseDate').value = today;
    document.getElementById('globalItemPurchaseDate').readOnly = true;

    // 填充分类下拉菜单
    const categorySelect = document.getElementById('globalItemCategory');
    categorySelect.innerHTML = '<option value="">选择分类</option>';
    Object.keys(categories).forEach(category => {
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });

    // 添加事件监听器
    categorySelect.addEventListener('change', updateGlobalItemNameOptions);
    document.getElementById('globalItemName').addEventListener('change', toggleCustomItemNameInput);
    document.getElementById('globalItemExpiryDays').addEventListener('change', toggleCustomExpiryDays);
    document.getElementById('globalItemDailyConsumption').addEventListener('change', toggleCustomDailyConsumption);
    document.getElementById('globalItemExpiryDays').addEventListener('change', updateExpiryDate);
    document.getElementById('customExpiryDays').addEventListener('input', updateExpiryDate);

    // 初始化过期日期
    updateExpiryDate();
}

function updateGlobalItemNameOptions() {
    const category = document.getElementById('globalItemCategory').value;
    const itemNameSelect = document.getElementById('globalItemName');
    itemNameSelect.innerHTML = '<option value="">选择物品名称</option>';

    if (category in categories) {
        categories[category].forEach(item => {
            itemNameSelect.innerHTML += `<option value="${item}">${item}</option>`;
        });
    }

    toggleCustomItemNameInput();
}

function toggleCustomItemNameInput() {
    const itemName = document.getElementById('globalItemName').value;
    const customItemNameGroup = document.getElementById('customItemNameGroup');
    
    if (itemName === "其他") {
        customItemNameGroup.style.display = 'block';
    } else {
        customItemNameGroup.style.display = 'none';
    }
}

function toggleCustomExpiryDays() {
    const expiryDays = document.getElementById('globalItemExpiryDays').value;
    const customExpiryDays = document.getElementById('customExpiryDays');
    
    if (expiryDays === "custom") {
        customExpiryDays.style.display = 'inline-block';
    } else {
        customExpiryDays.style.display = 'none';
    }
    updateExpiryDate();
}

function toggleCustomDailyConsumption() {
    const dailyConsumption = document.getElementById('globalItemDailyConsumption').value;
    const customDailyConsumption = document.getElementById('customDailyConsumption');
    
    if (dailyConsumption === "custom") {
        customDailyConsumption.style.display = 'inline-block';
    } else {
        customDailyConsumption.style.display = 'none';
    }
}

function updateExpiryDate() {
    const purchaseDate = new Date(document.getElementById('globalItemPurchaseDate').value);
    let expiryDays = document.getElementById('globalItemExpiryDays').value;
    
    if (expiryDays === "custom") {
        expiryDays = document.getElementById('customExpiryDays').value;
    }
    
    if (expiryDays) {
        const expiryDate = new Date(purchaseDate.getTime() + parseInt(expiryDays) * 24 * 60 * 60 * 1000);
        document.getElementById('globalItemExpiryDate').value = expiryDate.toISOString().split('T')[0];
    }
}

function addGlobalNewItem(e) {
    e.preventDefault();
    const category = document.getElementById('globalItemCategory').value;
    let name = document.getElementById('globalItemName').value;
    
    if (name === "其他") {
        name = document.getElementById('customItemName').value;
    }

    const quantity = parseInt(document.getElementById('globalItemQuantity').value);
    let dailyConsumption = document.getElementById('globalItemDailyConsumption').value;
    if (dailyConsumption === "custom") {
        dailyConsumption = document.getElementById('customDailyConsumption').value;
    }
    const purchaseDate = document.getElementById('globalItemPurchaseDate').value;
    const expiryDate = document.getElementById('globalItemExpiryDate').value;

    if (category && name && quantity && dailyConsumption && purchaseDate && expiryDate) {
        const item = {
            name,
            quantity,
            category,
            purchaseDate,
            expiryDate,
            status: calculateStatus(expiryDate),
            dailyConsumption: parseFloat(dailyConsumption)
        };

        inventory[name] = item;
        saveInventory();
        updateInventoryTables();
        closeGlobalAddItemModal();
        
        // 添加动画效果
        const newRow = document.querySelector(`.inventory-table:has(caption:contains('${category}')) tr:has(td:contains('${name}'))`);
        if (newRow) {
            newRow.classList.add('new-item-animation');
            setTimeout(() => newRow.classList.remove('new-item-animation'), 1000);
        }
    } else {
        alert('请填写所有必要字段');
    }
}

function closeGlobalAddItemModal() {
    document.getElementById('globalAddItemModal').style.display = 'none';
}

function closeEditItemModal() {
    document.getElementById('editItemModal').style.display = 'none';
}

// 计算物品状态
function calculateStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return STATUS.EXPIRED;
    } else if (daysLeft <= 7) {
        return STATUS.EXPIRING_SOON;
    } else {
        return STATUS.FRESH;
    }
}

// 更新库存中所有物品的状态
function updateInventoryStatus() {
    for (const item of Object.values(inventory)) {
        item.status = calculateStatus(item.expiryDate);
    }
    saveInventory();
}

// 获取状态对应的CSS类
function getStatusClass(status) {
    switch (status) {
        case STATUS.FRESH:
            return 'status-fresh';
        case STATUS.EXPIRING_SOON:
            return 'status-expiring-soon';
        case STATUS.EXPIRED:
            return 'status-expired';
        default:
            return '';
    }
}

function updateDashboard() {
    // 实现更新仪表盘的逻辑
}

function updateInventoryChart() {
    // 实现更新库存图表的逻辑
}

function editField(itemName, field) {
    // 实现编辑字段的逻辑
}

function deleteItem(itemName) {
    if (confirm(`确定要删除 ${itemName} 吗？`)) {
        try {
            delete inventory[itemName];
            saveInventory();
            updateInventoryTables();
            showNotification('删除成功', `${itemName} 已从库存中删除。`);
        } catch (error) {
            logError('删除物品时发生错误:', error);
            showNotification('删除失败', `无法删除 ${itemName}，请稍后重试。`, 'error');
        }
    }
}

function showNotification(title, message, type = 'info') {
    // 这里可以使用一个简单的 alert，或者实现一个更复杂的通知系统
    alert(`${title}: ${message}`);
}

function applyFilters() {
    // 实现应用筛选的逻辑
}

function updateShoppingList() {
    // 实现更新购物清单的逻辑
}

function generateShoppingList() {
    // 实现生成购物清单的逻辑
}

function suggestRecipes() {
    // 实现推荐食谱的逻辑
}

function generateRecipes() {
    // 实现生成食谱的逻辑
}

function clearInputs() {
    // 实现清除输入的逻辑
}

function scanBarcode() {
    // 实现扫描条形码的逻辑（如果需要）
}

function voiceInput() {
    // 实现语音输入逻辑（如果需要）
}

function saveInventory() {
    try {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    } catch (error) {
        logError('Error saving inventory to localStorage:', error);
    }
}

function setupDailyStatusUpdate() {
    // 实现设置每日状态更新的逻辑
}

// 在页面加载时设置每日更新
document.addEventListener('DOMContentLoaded', setupDailyStatusUpdate);

function setupEditItemModal() {
    const modal = document.getElementById('editItemModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function setStatusColor(statusCell, status) {
    statusCell.classList.remove('status-fresh', 'status-expiring-soon', 'status-expired');
    statusCell.classList.add(getStatusClass(status));
}

function logError(message, error) {
    console.error(message, error);
    // 可以在这里添加更多的错误处理逻辑，比如显示一个错误消息给用户
}

function initializeApp() {
    console.log('Initializing app...');
    updateInventoryStatus();
    updateInventoryTables();
    setupEventListeners();
    console.log('App initialized successfully.');
}

function setupEventListeners() {
    document.getElementById('globalAddItemForm').addEventListener('submit', addGlobalNewItem);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('globalAddItemBtn').addEventListener('click', showGlobalAddItemModal);
    document.getElementById('inventoryTables').addEventListener('click', handleRowClick);
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeApp();
    } catch (error) {
        logError('Error initializing app:', error);
    }
});