// 简历模板系统
// 三种简洁风格：经典、现代、极简

const ResumeTemplates = {
    // 当前选中的模板
    currentTemplate: 'classic',

    // 模板配置
    templates: {
        classic: {
            name: '经典模板',
            description: '传统专业风格',
            icon: '📄'
        },
        modern: {
            name: '现代模板',
            description: '简约双栏设计',
            icon: '✨'
        },
        minimal: {
            name: '极简模板',
            description: '纯文字高效',
            icon: '📝'
        }
    },

    // 设置当前模板
    setTemplate(templateId) {
        if (this.templates[templateId]) {
            this.currentTemplate = templateId;
            return true;
        }
        return false;
    },

    // 渲染简历（根据当前模板）
    render(resume) {
        switch (this.currentTemplate) {
            case 'modern':
                return this.renderModern(resume);
            case 'minimal':
                return this.renderMinimal(resume);
            case 'classic':
            default:
                return this.renderClassic(resume);
        }
    },

    // ========== 模板1: 经典模板 ==========
    renderClassic(resume) {
        let html = '<div class="resume-classic">';

        // 基本信息
        if (resume.basic_info && resume.basic_info.length > 0) {
            const basic = resume.basic_info[0];
            if (basic.name || basic.email || basic.phone) {
                html += `
                    <div class="classic-header">
                        <h1 class="classic-name">${basic.name || '姓名'}</h1>
                        ${basic.title ? `<div class="classic-title">${basic.title}</div>` : ''}
                        <div class="classic-contact">
                            ${basic.email ? `<span>${basic.email}</span>` : ''}
                            ${basic.phone ? `<span>${basic.phone}</span>` : ''}
                            ${basic.location ? `<span>${basic.location}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }

        // 教育背景（包含校园经历）
        if ((resume.education && resume.education.length > 0) || (resume.campus_experience && resume.campus_experience.length > 0)) {
            html += '<div class="classic-section"><h2 class="classic-section-title">教育背景</h2>';

            // 教育经历
            if (resume.education && resume.education.length > 0) {
                resume.education.forEach(edu => {
                    html += `
                        <div class="classic-item">
                            <div class="classic-item-header">
                                <strong>${edu.school || ''}</strong>
                                <span class="classic-date">${this._formatDateRange(edu.start_date, edu.end_date)}</span>
                            </div>
                            <div class="classic-item-info">
                                ${edu.major ? `${edu.major}` : ''}${edu.degree ? ` · ${edu.degree}` : ''}
                            </div>
                        </div>
                    `;
                });
            }

            // 校园经历（无单独标题）
            if (resume.campus_experience && resume.campus_experience.length > 0) {
                resume.campus_experience.forEach(exp => {
                    html += `
                        <div class="classic-item">
                            <div class="classic-item-header">
                                <strong>${exp.title || ''}</strong>
                                ${exp.date ? `<span class="classic-date">${exp.date}</span>` : ''}
                            </div>
                            ${exp.organization ? `<div class="classic-item-info">${exp.organization}</div>` : ''}
                            ${exp.description ? `<div class="classic-item-description">${exp.description}</div>` : ''}
                        </div>
                    `;
                });
            }

            html += '</div>';
        }

        // 技能特长
        if (resume.skills && resume.skills.length > 0) {
            html += `
                <div class="classic-section">
                    <h2 class="classic-section-title">技能特长</h2>
                    <ul class="classic-skills-list">
                        ${resume.skills.map(skill => `<li>${this._boldPrefix(skill)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // 工作经历
        html += this._renderSection(resume.experience, 'experience', '工作经历', (exp) => `
            <div class="classic-item">
                <div class="classic-item-header">
                    <strong>${exp.company || ''}</strong>
                    <span class="classic-date">${this._formatDateRange(exp.start_date, exp.end_date)}</span>
                </div>
                <div class="classic-item-info">${exp.position || ''}</div>
                ${exp.achievements ? `<div class="classic-desc">${exp.achievements}</div>` : ''}
            </div>
        `);

        // 项目经验
        html += this._renderSection(resume.projects, 'projects', '项目经验', (proj) => `
            <div class="classic-item">
                <strong>${proj.name || ''}</strong>
                ${proj.role ? `<span class="classic-role"> - ${proj.role}</span>` : ''}
                ${proj.description ? `<div class="classic-desc">${this._boldPrefix(proj.description)}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="classic-tech"><strong>技术栈:</strong> ${proj.tech_stack.join(', ')}</div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="classic-highlights">
                        ${proj.highlights.map(h => `<li>${this._boldPrefix(h)}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `);

        html += '</div>';
        return html;
    },

    // ========== 模板2: 现代模板 ==========
    renderModern(resume) {
        let html = '<div class="resume-modern">';

        const basic = resume.basic_info && resume.basic_info.length > 0 ? resume.basic_info[0] : {};

        // 左侧栏
        html += '<div class="modern-sidebar">';

        // 基本信息
        html += `
            <div class="modern-profile">
                <h1 class="modern-name">${basic.name || '姓名'}</h1>
                ${basic.title ? `<div class="modern-title">${basic.title}</div>` : ''}
            </div>
        `;

        // 联系方式
        if (basic.email || basic.phone || basic.location) {
            html += '<div class="modern-contact">';
            html += '<h3 class="modern-sidebar-title">联系方式</h3>';
            if (basic.email) html += `<div>📧 ${basic.email}</div>`;
            if (basic.phone) html += `<div>📱 ${basic.phone}</div>`;
            if (basic.location) html += `<div>📍 ${basic.location}</div>`;
            html += '</div>';
        }

        // 技能特长（左侧）
        if (resume.skills && resume.skills.length > 0) {
            html += `
                <div class="modern-skills">
                    <h3 class="modern-sidebar-title">技能特长</h3>
                    ${resume.skills.map(skill => `<div class="modern-skill-item">${this._boldPrefix(skill)}</div>`).join('')}
                </div>
            `;
        }

        html += '</div>'; // 左侧栏结束

        // 右侧主内容
        html += '<div class="modern-main">';

        // 教育背景（包含校园经历）
        if ((resume.education && resume.education.length > 0) || (resume.campus_experience && resume.campus_experience.length > 0)) {
            html += '<div class="modern-section"><h3>教育背景</h3>';

            // 教育经历
            if (resume.education && resume.education.length > 0) {
                resume.education.forEach(edu => {
                    html += `
                        <div class="modern-item">
                            <div class="modern-item-header">
                                <strong>${edu.school || ''}</strong>
                                <div class="modern-date">${this._formatDateRange(edu.start_date, edu.end_date)}</div>
                            </div>
                            <div class="modern-subtitle">
                                ${edu.major ? `${edu.major}` : ''}${edu.degree ? ` · ${edu.degree}` : ''}
                            </div>
                        </div>
                    `;
                });
            }

            // 校园经历（无单独标题）
            if (resume.campus_experience && resume.campus_experience.length > 0) {
                resume.campus_experience.forEach(exp => {
                    html += `
                        <div class="modern-item">
                            <div class="modern-item-header">
                                <strong>${exp.title || ''}</strong>
                                ${exp.date ? `<div class="modern-date">${exp.date}</div>` : ''}
                            </div>
                            ${exp.organization ? `<div class="modern-subtitle">${exp.organization}</div>` : ''}
                            ${exp.description ? `<div class="modern-description">${exp.description}</div>` : ''}
                        </div>
                    `;
                });
            }

            html += '</div>';
        }

        // 工作经历
        html += this._renderSection(resume.experience, 'experience', '工作经历', (exp) => `
            <div class="modern-item">
                <div class="modern-item-header">
                    <div>
                        <strong>${exp.company || ''}</strong>
                        <div class="modern-subtitle">${exp.position || ''}</div>
                    </div>
                    <div class="modern-date">${this._formatDateRange(exp.start_date, exp.end_date)}</div>
                </div>
                ${exp.achievements ? `<div class="modern-desc">${exp.achievements}</div>` : ''}
            </div>
        `, 'modern-section');

        // 项目经验
        html += this._renderSection(resume.projects, 'projects', '项目经验', (proj) => `
            <div class="modern-item">
                <strong>${proj.name || ''}</strong>
                ${proj.description ? `<div class="modern-desc">${this._boldPrefix(proj.description)}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="modern-tech">${proj.tech_stack.map(t => `<span class="modern-tech-tag">${t}</span>`).join('')}</div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="modern-highlights">
                        ${proj.highlights.map(h => `<li>${this._boldPrefix(h)}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `, 'modern-section');

        html += '</div>'; // 右侧主内容结束
        html += '</div>'; // modern容器结束
        return html;
    },

    // ========== 模板3: 极简模板 ==========
    renderMinimal(resume) {
        let html = '<div class="resume-minimal">';

        const basic = resume.basic_info && resume.basic_info.length > 0 ? resume.basic_info[0] : {};

        // 顶部基本信息
        html += `
            <div class="minimal-header">
                <h1>${basic.name || '姓名'}</h1>
                ${basic.title ? `<div class="minimal-title">${basic.title}</div>` : ''}
                <div class="minimal-contact">
                    ${basic.email || ''}
                    ${basic.phone ? ` · ${basic.phone}` : ''}
                    ${basic.location ? ` · ${basic.location}` : ''}
                </div>
            </div>
        `;

        // 教育背景（包含校园经历）
        if ((resume.education && resume.education.length > 0) || (resume.campus_experience && resume.campus_experience.length > 0)) {
            html += '<div class="minimal-section"><h2>教育背景</h2>';

            // 教育经历
            if (resume.education && resume.education.length > 0) {
                resume.education.forEach(edu => {
                    html += `
                        <div class="minimal-item">
                            <div class="minimal-line">
                                <strong>${edu.school}</strong>, ${edu.major || ''}${edu.degree ? ` (${edu.degree})` : ''}
                                <span class="minimal-date">${this._formatDateRange(edu.start_date, edu.end_date)}</span>
                            </div>
                        </div>
                    `;
                });
            }

            // 校园经历（无单独标题）
            if (resume.campus_experience && resume.campus_experience.length > 0) {
                resume.campus_experience.forEach(exp => {
                    html += `
                        <div class="minimal-item">
                            <div class="minimal-line">
                                <strong>${exp.title || ''}</strong>${exp.organization ? `, ${exp.organization}` : ''}
                                ${exp.date ? `<span class="minimal-date">${exp.date}</span>` : ''}
                            </div>
                            ${exp.description ? `<div class="minimal-description">${exp.description}</div>` : ''}
                        </div>
                    `;
                });
            }

            html += '</div>';
        }

        // 技能特长
        if (resume.skills && resume.skills.length > 0) {
            html += `
                <div class="minimal-section">
                    <h2>技能特长</h2>
                    <ul class="minimal-skills-list">
                        ${resume.skills.map(skill => `<li>${this._boldPrefix(skill)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // 工作经历
        html += this._renderSection(resume.experience, 'experience', '工作经历', (exp) => `
            <div class="minimal-item">
                <div class="minimal-line">
                    <strong>${exp.company}</strong>, ${exp.position}
                    <span class="minimal-date">${this._formatDateRange(exp.start_date, exp.end_date)}</span>
                </div>
                ${exp.achievements ? `<div class="minimal-desc">${exp.achievements}</div>` : ''}
            </div>
        `, 'minimal-section');

        // 项目经验
        html += this._renderSection(resume.projects, 'projects', '项目经验', (proj) => `
            <div class="minimal-item">
                <div class="minimal-line"><strong>${proj.name}</strong></div>
                ${proj.description ? `<div class="minimal-desc">${this._boldPrefix(proj.description)}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="minimal-tech"><strong>技术:</strong> ${proj.tech_stack.join(', ')}</div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="minimal-highlights">
                        ${proj.highlights.map(h => `<li>${this._boldPrefix(h)}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `, 'minimal-section');

        html += '</div>';
        return html;
    },

    // ========== 辅助函数 ==========
    _renderSection(items, type, title, renderItem, sectionClass = '') {
        if (!items || items.length === 0) return '';

        const validItems = items.filter(item => {
            switch (type) {
                case 'education':
                    return item.school || item.major;
                case 'experience':
                    return item.company || item.position;
                case 'projects':
                    return item.name || item.description;
                default:
                    return true;
            }
        });

        if (validItems.length === 0) return '';

        const className = sectionClass || `${this.currentTemplate}-section`;
        const titleClassName = `${this.currentTemplate}-section-title`;

        return `
            <div class="${className}">
                <h2 class="${titleClassName}">${title}</h2>
                ${validItems.map(renderItem).join('')}
            </div>
        `;
    },

    _formatDateRange(start, end) {
        if (!start && !end) return '';
        if (start && end) {
            return `${this._formatDate(start)} - ${this._formatDate(end)}`;
        }
        if (start) return `${this._formatDate(start)} 至今`;
        return `至 ${this._formatDate(end)}`;
    },

    _formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
            return `${parts[0]}.${parts[1]}`;
        }
        return dateStr;
    },

    // 加粗冒号前的内容或前缀词
    _boldPrefix(text) {
        if (!text) return '';

        // 如果包含冒号或：，加粗冒号前的内容
        if (text.includes('：') || text.includes(':')) {
            const colonChar = text.includes('：') ? '：' : ':';
            const parts = text.split(colonChar);
            return `<strong>${parts[0]}</strong>${colonChar}${parts.slice(1).join(colonChar)}`;
        }

        // 如果以"熟悉"、"掌握"等开头，加粗这些词
        const match = text.match(/^(熟悉|掌握|了解|精通|擅长|熟练)/);
        if (match) {
            const prefix = match[1];
            const rest = text.substring(prefix.length);
            return `<strong>${prefix}</strong>${rest}`;
        }

        return text;
    },

    // 智能优化技能描述：将关键词转换为完整句子
    _enhanceSkill(skill) {
        // 如果已经是完整句子（包含"熟悉"、"掌握"等词），直接返回
        if (/^(熟悉|掌握|了解|精通|擅长|熟练)/.test(skill)) {
            return skill;
        }

        // 技能关键词映射表
        const skillMap = {
            // 编程语言
            'Go': '熟悉使用 Go 语言进行后端开发',
            'Python': '熟悉使用 Python 进行开发',
            'Java': '熟悉使用 Java 进行开发',
            'JavaScript': '熟悉 JavaScript 前后端开发',
            'TypeScript': '熟悉 TypeScript 类型化开发',
            'C++': '熟悉 C++ 编程',
            'C': '熟悉 C 语言编程',

            // Web 框架
            'Gin': '熟悉 Gin Web 框架',
            'Echo': '熟悉 Echo Web 框架',
            'Fiber': '熟悉 Fiber Web 框架',
            'Django': '熟悉 Django Web 框架',
            'Flask': '熟悉 Flask 轻量级框架',
            'Spring Boot': '熟悉 Spring Boot 框架',
            'Express': '熟悉 Express.js 框架',
            'Nest.js': '熟悉 Nest.js 框架',

            // ORM
            'GORM': '熟悉 GORM 对象关系映射',
            'TypeORM': '熟悉 TypeORM 数据库操作',
            'Hibernate': '熟悉 Hibernate ORM 框架',

            // 数据库
            'MySQL': '掌握 MySQL 数据库设计与优化',
            'PostgreSQL': '掌握 PostgreSQL 数据库',
            'MongoDB': '熟悉 MongoDB 文档数据库',
            'Redis': '熟悉 Redis 缓存设计',
            'SQLite': '了解 SQLite 轻量级数据库',

            // 消息队列
            'RabbitMQ': '了解 RabbitMQ 消息队列',
            'Kafka': '了解 Kafka 分布式消息系统',
            'RocketMQ': '了解 RocketMQ 消息中间件',

            // WebSocket
            'Gorilla WebSocket': '熟悉 WebSocket 实时通信',
            'WebSocket': '熟悉 WebSocket 实时通信技术',
            'Socket.io': '熟悉 Socket.io 实时通信',

            // 缓存
            'go-cache': '熟悉 Go 缓存技术',
            'Memcached': '了解 Memcached 缓存系统',

            // 邮件
            'QQ SMTP': '了解 SMTP 邮件发送',
            'SMTP': '了解 SMTP 邮件服务',

            // 会话管理
            'Gin Sessions': '熟悉会话管理机制',
            'JWT': '熟悉 JWT 认证机制',

            // 日志
            '标准库Logger': '熟悉日志记录与管理',
            'Logger': '熟悉日志系统',
            'Logrus': '熟悉 Logrus 日志框架',
            'Zap': '熟悉 Zap 高性能日志库',

            // 容器化
            'Docker': '熟悉 Docker 容器化部署',
            'Kubernetes': '了解 Kubernetes 容器编排',
            'K8s': '了解 Kubernetes 容器编排',

            // 网络协议
            'TCP/IP': '掌握 TCP/IP 网络协议',
            'HTTP': '掌握 HTTP 协议',
            'HTTPS': '掌握 HTTPS 安全协议',
            'gRPC': '熟悉 gRPC 远程调用',

            // 前端技术
            'React': '熟悉 React 前端框架',
            'Vue': '熟悉 Vue.js 前端框架',
            'Angular': '熟悉 Angular 前端框架',

            // 版本控制
            'Git': '熟练使用 Git 版本控制',
            'GitHub': '熟悉 GitHub 协作开发',
            'GitLab': '熟悉 GitLab CI/CD',

            // 其他
            'Linux': '熟悉 Linux 系统操作',
            'Nginx': '熟悉 Nginx 服务器配置',
            'RESTful API': '熟悉 RESTful API 设计',
            'Microservices': '了解微服务架构',
        };

        // 精确匹配
        if (skillMap[skill]) {
            return skillMap[skill];
        }

        // 模糊匹配（处理变体）
        const skillLower = skill.toLowerCase();
        for (const [key, value] of Object.entries(skillMap)) {
            if (key.toLowerCase() === skillLower) {
                return value;
            }
        }

        // 通用转换规则
        // 如果是单个词，添加通用前缀
        if (skill.length < 20 && !/\s/.test(skill)) {
            return `熟悉 ${skill}`;
        }

        // 否则保持原样
        return skill;
    }
};

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.ResumeTemplates = ResumeTemplates;
}
