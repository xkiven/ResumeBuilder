# 简历生成器 - 文件存储版本

> 这是 `file-storage` 分支，使用纯文件存储，无需安装 MySQL 和 Redis 喵～ ฅ'ω'ฅ

## ✨ 特点

- ✅ **零依赖** - 不需要安装 MySQL 和 Redis
- ✅ **开箱即用** - 下载即可运行
- ✅ **轻量级** - 适合个人使用或小规模部署
- ✅ **数据可见** - JSON 文件存储，方便查看和备份
- ✅ **并发安全** - 使用读写锁保护文件操作

## 📁 数据存储

简历数据存储在 `data/resumes/` 目录下：

```
data/
└── resumes/
    ├── user001.json
    ├── user002.json
    └── ...
```

每个用户的简历保存为独立的 JSON 文件，文件名为 `{userID}.json`

## 🚀 快速开始

### 1. 配置环境变量

创建 `.env` 文件：

```bash
apiKey=your_deepseek_api_key
```

### 2. 编译运行

```bash
# 编译
go build -o ResumeBuilder.exe cmd/main.go

# 运行
./ResumeBuilder.exe
```

### 3. 访问

浏览器打开：`http://localhost:8080`

## 📊 与数据库版本的区别

| 特性 | 文件存储版 (file-storage) | 数据库版 (test) |
|------|---------------------------|----------------|
| 依赖 | 无 | MySQL + Redis |
| 性能 | 中等 | 高 |
| 适用场景 | 个人使用 | 生产环境 |
| 备份 | 复制 data 目录 | 数据库备份 |
| 并发 | 读写锁 | 事务 + 缓存 |

## 🔧 技术实现

### 文件存储 DAO

- 每个用户的简历保存为独立的 JSON 文件
- 使用 `sync.RWMutex` 保证并发安全
- 自动创建数据目录
- JSON 格式化输出，方便阅读

### 核心方法

- `Create(resume)` - 创建新简历（检查是否已存在）
- `Get(userID)` - 读取简历（不存在返回错误）
- `Update(resume)` - 更新简历（不存在则创建）
- `Delete(userID)` - 删除简历

## 📝 数据格式示例

```json
{
  "user_id": "user001",
  "basic_info": [
    {
      "name": "张三",
      "email": "zhangsan@example.com",
      "phone": "13812345678",
      "location": "北京市",
      "title": "高级软件工程师"
    }
  ],
  "education": [...],
  "experience": [...],
  "projects": [...],
  "skills": [...]
}
```

## 🔄 切换到数据库版本

```bash
# 切换到 test 分支（数据库版本）
git checkout test

# 重新编译
go build -o ResumeBuilder.exe cmd/main.go
```

## ⚠️ 注意事项

1. **数据目录** - `data/` 目录已添加到 `.gitignore`，不会被提交到 Git
2. **备份建议** - 定期备份 `data/resumes/` 目录
3. **并发限制** - 文件存储适合中小规模使用，高并发场景建议使用数据库版本
4. **数据迁移** - 如需迁移到数据库版本，可以编写脚本读取 JSON 文件导入数据库

## 💡 优化建议

如果需要提升性能，可以考虑：

1. 添加内存缓存（如 sync.Map）
2. 使用更高效的序列化格式（如 MessagePack）
3. 实现数据压缩
4. 添加索引文件加速查询

---

**流萤酱的温馨提示** (´。• ᵕ •。`) ♡：

这个版本特别适合：
- 第一次使用的用户
- 不想折腾数据库的同学
- 快速演示和测试
- 个人简历管理

如果要部署到生产环境或需要高性能，建议使用 `test` 分支的数据库版本喵～
