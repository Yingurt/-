let inventory = JSON.parse(localStorage.getItem('inventory')) || {};
const categories = {
    "蔬菜": ["胡萝卜", "西兰花", "番茄", "黄瓜", "其他"],
    "水果": ["苹果", "香蕉", "橙子", "草莓", "其他"],
    "肉类": ["牛肉", "猪肉", "鸡肉", "鱼", "其他"],
    "饮料": ["牛奶", "果汁", "水", "茶", "其他"],
    "其他": ["其他"]
};

const commonQuantities = [1, 2, 3, 5, 10];
const commonExpiryDays = [3, 7, 14, 30, 90];

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
    row.innerHTML = `
        <td class="editable" data-field="name">${itemName}</td>
        <td class="editable" data-field="quantity">${item.quantity}</td>
        <td class="editable" data-field="unit">${item.unit}</td>
        <td class="editable" data-field="expiryDate">${item.expiryDate}</td>
        <td class="status-${getStatusClass(item.status)}" data-field="status">${item.status}</td>
        <td>${estimatedConsumptionDate}</td>
        <td class="actions">
            <button onclick="incrementQuantity('${itemName}')">+</button>
            <button onclick="decrementQuantity('${itemName}')">-</button>
            <button onclick="deleteItem('${itemName}')">删除</button>
        </td>
    `;
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
        // 如果修改了物品名称，需要更新 inventory 对象的键
        delete inventory[itemName];
        itemName = newValue;
        inventory[itemName] = item;
    }

    item[field] = newValue;

    if (field === 'expiryDate') {
        item.status = calculateStatus(item.purchaseDate, newValue);
    }

    saveInventory();
    updateInventoryTables();
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
            status: calculateStatus(new Date().toISOString().split('T')[0], expiryDate),
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
            status: calculateStatus(purchaseDate, expiryDate),
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

function calculateStatus(purchaseDate, expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return "已过期";
    } else if (daysLeft <= 7) {
        return "即将过期";
    } else {
        return "新鲜";
    }
}

function updateInventoryStatus() {
    const today = new Date();
    for (const [itemName, item] of Object.entries(inventory)) {
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
            item.status = "已过期";
        } else if (daysLeft <= 7) {
            item.status = "即将过期";
        } else {
            item.status = "新鲜";
        }
    }
    saveInventory();
}

function updateDashboard() {
    // 实现更新仪表盘的逻辑
}

function updateInventoryChart() {
    // 实现更新库存图表的逻辑
}

function getStatusClass(status) {
    // 实现获取状态类的逻辑
}

function editField(itemName, field) {
    // 实现编辑字段的逻辑
}

function deleteItem(itemName) {
    // 实现删除物品的逻辑
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
    // 实现语音输入的逻辑（如果需要）
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function setupDailyStatusUpdate() {
    // 实现设置每日状态更新的逻辑
}

// 在页面加载时设置每日更新
document.addEventListener('DOMContentLoaded', setupDailyStatusUpdate);

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
            status: calculateStatus(purchaseDate, expiryDate),
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

function calculateStatus(purchaseDate, expiryDays) {
    const today = new Date();
    const expiryDate = new Date(new Date(purchaseDate).getTime() + expiryDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft > 7) return "新鲜";
    if (daysLeft > 0) return "即将过期";
    return "已过期";
}

function updateDashboard() {
    const expiringCount = Object.values(inventory).filter(item => item.status === "即将过期").length;
    const lowStockCount = Object.values(inventory).filter(item => item.quantity <= 2).length;
    const totalItemCount = Object.keys(inventory).length;

    document.getElementById('expiringCount').textContent = expiringCount;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('totalItemCount').textContent = totalItemCount;

    updateInventoryChart();
}

function updateInventoryChart() {
    const ctx = document.getElementById('inventoryChart').getContext('2d');
    const categories = ['蔬菜', '水果', '肉类', '饮料', '其他'];
    const data = categories.map(category => 
        Object.values(inventory).filter(item => item.category === category).length
    );

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: '库存分类统计'
            }
        }
    });
}

function getStatusClass(status) {
    switch (status) {
        case '新鲜': return 'fresh';
        case '即将过期': return 'expiring-soon';
        case '已过期': return 'expired';
        default: return '';
    }
}

function editField(itemName, field) {
    const item = inventory[itemName];
    const modal = document.getElementById('editItemModal');
    const form = document.getElementById('editItemForm');

    // 清空表单
    form.innerHTML = '';

    // 创建输入字段
    const input = document.createElement('input');
    input.type = field === 'expiryDate' ? 'date' : 'text';
    input.value = item[field];

    // 创建保存按钮
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.onclick = (e) => {
        e.preventDefault();
        item[field] = input.value;
        saveInventory();
        updateInventoryTables();
        modal.style.display = 'none';
    };

    // 将输入字段和按钮添加到表单
    form.appendChild(input);
    form.appendChild(saveButton);

    // 显示模态框
    modal.style.display = 'block';
}

function deleteItem(itemName) {
    if (confirm(`确定要删除 ${itemName} 吗？`)) {
        delete inventory[itemName];
        saveInventory();
        updateInventoryTables();
    }
}

function applyFilters() {
    updateInventoryTables();
}

function updateShoppingList() {
    const list = document.getElementById('shoppingListItems');
    list.innerHTML = '';
    const lowStockItems = Object.values(inventory).filter(item => item.quantity <= 2);
    for (const item of lowStockItems) {
        const li = document.createElement('li');
        li.textContent = `${item.name} (当前库存: ${item.quantity})`;
        list.appendChild(li);
    }
}

function generateShoppingList() {
    updateShoppingList();
    alert('购物清单已更新');
}

function suggestRecipes() {
    const suggestions = document.getElementById('recipeSuggestions');
    suggestions.innerHTML = '';
    const availableIngredients = Object.keys(inventory).join(', ');
    const recipes = [
        `使用${availableIngredients}制作美味沙拉`,
        `用${availableIngredients}烹饪营养炖菜`,
        `尝试用${availableIngredients}制作创意三明治`
    ];
    recipes.forEach(recipe => {
        const p = document.createElement('p');
        p.textContent = recipe;
        suggestions.appendChild(p);
    });
}

function generateRecipes() {
    suggestRecipes();
    alert('新的食谱推荐已生成');
}

function clearInputs() {
    // 实现清除输入的逻辑
}

function scanBarcode() {
    // 模拟条形码扫描
    alert('条形码扫描功能尚未实现');
}

function voiceInput() {
    // 模拟语音输入
    alert('语音输入功能尚未实现');
}

// 在每次修改inventory后，保存到localStorage
function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

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