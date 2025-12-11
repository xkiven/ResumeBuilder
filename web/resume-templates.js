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

        // 教育背景
        html += this._renderSection(resume.education, 'education', '教育背景', (edu) => `
            <div class="classic-item">
                <div class="classic-item-header">
                    <strong>${edu.school || ''}</strong>
                    <span class="classic-date">${this._formatDateRange(edu.start_date, edu.end_date)}</span>
                </div>
                <div class="classic-item-info">
                    ${edu.major ? `${edu.major}` : ''}${edu.degree ? ` · ${edu.degree}` : ''}
                </div>
            </div>
        `);

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
                ${proj.description ? `<div class="classic-desc">${proj.description}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="classic-tech">技术栈: ${proj.tech_stack.join(', ')}</div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="classic-highlights">
                        ${proj.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `);

        // 技能特长
        if (resume.skills && resume.skills.length > 0) {
            html += `
                <div class="classic-section">
                    <h2 class="classic-section-title">技能特长</h2>
                    <div class="classic-skills">${resume.skills.join(' · ')}</div>
                </div>
            `;
        }

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
                    ${resume.skills.map(skill => `<div class="modern-skill-item">${skill}</div>`).join('')}
                </div>
            `;
        }

        html += '</div>'; // 左侧栏结束

        // 右侧主内容
        html += '<div class="modern-main">';

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
                ${proj.description ? `<div class="modern-desc">${proj.description}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="modern-tech">${proj.tech_stack.map(t => `<span class="modern-tech-tag">${t}</span>`).join('')}</div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="modern-highlights">
                        ${proj.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `, 'modern-section');

        // 教育背景
        html += this._renderSection(resume.education, 'education', '教育背景', (edu) => `
            <div class="modern-item">
                <div class="modern-item-header">
                    <strong>${edu.school || ''}</strong>
                    <div class="modern-date">${this._formatDateRange(edu.start_date, edu.end_date)}</div>
                </div>
                <div class="modern-subtitle">
                    ${edu.major ? `${edu.major}` : ''}${edu.degree ? ` · ${edu.degree}` : ''}
                </div>
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
                ${proj.description ? `<div class="minimal-desc">${proj.description}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="minimal-tech">技术: ${proj.tech_stack.join(', ')}</div>
                ` : ''}
            </div>
        `, 'minimal-section');

        // 教育背景
        html += this._renderSection(resume.education, 'education', '教育背景', (edu) => `
            <div class="minimal-item">
                <div class="minimal-line">
                    <strong>${edu.school}</strong>, ${edu.major || ''}${edu.degree ? ` (${edu.degree})` : ''}
                    <span class="minimal-date">${this._formatDateRange(edu.start_date, edu.end_date)}</span>
                </div>
            </div>
        `, 'minimal-section');

        // 技能特长
        if (resume.skills && resume.skills.length > 0) {
            html += `
                <div class="minimal-section">
                    <h2>技能特长</h2>
                    <div>${resume.skills.join(' · ')}</div>
                </div>
            `;
        }

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
    }
};

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.ResumeTemplates = ResumeTemplates;
}
