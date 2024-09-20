# 冰箱库存系统

## 项目简介
这是一个用于管理家庭冰箱内食品库存的系统。它可以帮助用户追踪冰箱中的食品,记录保质期,并提醒用户及时使用即将过期的食品。
## 主要功能
- 添加新食品到库存
- 查看当前库存列表
- 更新食品信息(如数量、保质期等)
- 删除已使用完的食品
- 过期提醒功能
- 库存搜索功能
## 安装说明
#### 前提条件
在安装和运行项目之前，确保你的电脑已安装以下工具：
1. **Git**：用于版本控制和从 GitHub 克隆项目。[下载 Git](https://git-scm.com/downloads)
2. **Node.js 和 npm**（可选）：如果项目依赖 Node.js，确保你已安装。[下载 Node.js](https://nodejs.org/en/)
3. **Python 和 pip**（可选）：如果项目依赖 Python，确保你已安装 Python 和包管理工具 pip。[下载 Python](https://www.python.org/downloads/)
---

#### 安装步骤

1. **克隆仓库**
   - 打开命令提示符、终端或 Git Bash，并导航到你希望存放项目的文件夹，使用以下命令克隆仓库：

   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
克隆完成后，进入项目文件夹：
cd your-repo-name
安装依赖
如果项目是基于 Node.js： 使用以下命令安装项目所需的依赖库（通过 package.json 管理依赖）：
## 使用方法
```markdown
1. **添加新物品**：
   - 点击“添加新物品”按钮，选择物品分类、物品名称，填写数量、单位、保质期等信息，系统会自动计算物品的过期日期。

2. **管理库存**：
   - 在“库存管理”页面中，用户可以查看所有已添加的物品信息，包括名称、数量、单位、过期日期和状态（新鲜、即将过期或已过期）。

3. **编辑和删除物品**：
   - 点击任意物品的名称或信息，即可直接编辑该物品信息（如数量、单位、过期日期等）。
   - 用户也可以通过点击“删除”按钮移除不再需要的物品。

4. **预计消耗功能**：
   - 每个物品都有每日消耗量的设置，系统根据设定的消耗速度和当前库存量，自动计算预计的耗尽日期。

5. **过滤功能**：
   - 在“库存管理”页面中，用户可以通过类别和状态筛选物品，方便管理。
npm install
如果项目是基于 Python： 使用以下命令安装 Python 项目依赖（通过 requirements.txt 管理依赖）：
pip install -r requirements.txt


## 技术栈

1. **前端**：
   - HTML5
   - CSS3
   - JavaScript (Vanilla JS 或 jQuery)
   - [可选] React.js（如果你使用了 React 框架）
   
2. **后端**：
   - [可选] Node.js + Express.js（如果项目包含后端部分）
   - [可选] Flask/Django（如果使用 Python 作为后端）

3. **数据库**：
   - [可选] MongoDB / MySQL / SQLite（如果项目包含数据库功能）

4. **版本控制**：
   - Git 和 GitHub 用于代码管理和协作

5. **部署**：
   - GitHub Pages 用于部署静态网页
   - [可选] Heroku / Vercel / Netlify（如果有后端服务）
## 贡献指南
欢迎对本项目提出改进建议或直接贡献代码。请遵循以下步骤:

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 将您的更改推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 联系方式

Ying Zhang - [smyyz22@nottingham.ac.uk]

项目链接: [https://github.com/yourusername/your-repo-name](https://github.com/yourusername/your-repo-name)

## 许可证

本项目采用 [选择一个许可证] 许可证 - 查看 [LICENSE.md](LICENSE.md) 文件了解详情。
