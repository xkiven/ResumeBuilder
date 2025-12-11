// ========== 配置 ==========
const API_BASE_URL = 'http://localhost:8080/api';

// ========== DOM 元素 ==========
const elements = {
    userID: document.getElementById('userID'),
    // 分步输入元素
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    education: document.getElementById('education'),
    experience: document.getElementById('experience'),
    skills: document.getElementById('skills'),
    projects: document.getElementById('projects'),
    // 其他元素
    githubURL: document.getElementById('githubURL'),
    generateBtn: document.getElementById('generateBtn'),
    addGithubBtn: document.getElementById('addGithubBtn'),
    loadBtn: document.getElementById('loadBtn'),
    exportPDFBtn: document.getElementById('exportPDFBtn'),
    exportJSONBtn: document.getElementById('exportJSONBtn'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    resumeContent: document.getElementById('resumeContent'),
    toast: document.getElementById('toast'),
};

// ========== 状态管理 ==========
let currentResume = null;

// ========== 工具函数 ==========

/**
 * 显示Toast通知
 */
function showToast(message, type = 'info') {
    const toast = elements.toast;
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
    };

    toast.className = `toast ${type} show`;
    toast.innerHTML = `
        <span style="font-size: 1.5rem;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 显示加载状态
 */
function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.emptyState.style.display = 'none';
    elements.resumeContent.style.display = 'none';
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    elements.loadingState.style.display = 'none';
}

/**
 * 显示空状态
 */
function showEmptyState() {
    elements.emptyState.style.display = 'block';
    elements.resumeContent.style.display = 'none';
}

/**
 * 显示简历内容
 */
function showResumeContent() {
    elements.emptyState.style.display = 'none';
    elements.resumeContent.style.display = 'block';
}

/**
 * API请求封装
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        // 检查响应是否有内容
        const contentType = response.headers.get('content-type');
        const hasContent = response.headers.get('content-length') !== '0';

        // 如果响应状态不是成功，尝试获取错误信息
        if (!response.ok) {
            let errorMessage = `请求失败 (${response.status})`;

            // 尝试解析JSON错误信息
            if (contentType && contentType.includes('application/json') && hasContent) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // JSON解析失败，尝试获取文本
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
            } else {
                // 获取文本内容
                const text = await response.text();
                errorMessage = text || errorMessage;
            }

            throw new Error(errorMessage);
        }

        // 成功响应，解析JSON
        if (contentType && contentType.includes('application/json') && hasContent) {
            return await response.json();
        } else {
            throw new Error('服务器返回的数据格式不正确');
        }
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// ========== 简历渲染 ==========

/**
 * 渲染基本信息
 */
function renderBasicInfo(basicInfo) {
    const container = document.getElementById('basicInfoContent');

    if (!basicInfo || basicInfo.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">暂无基本信息</p>';
        return;
    }

    const info = basicInfo[0];
    container.innerHTML = `
        <div class="basic-info-grid">
            ${info.name ? `
                <div class="info-item">
                    <div class="info-label">姓名</div>
                    <div class="info-value">${info.name}</div>
                </div>
            ` : ''}
            ${info.email ? `
                <div class="info-item">
                    <div class="info-label">邮箱</div>
                    <div class="info-value">${info.email}</div>
                </div>
            ` : ''}
            ${info.phone ? `
                <div class="info-item">
                    <div class="info-label">电话</div>
                    <div class="info-value">${info.phone}</div>
                </div>
            ` : ''}
            ${info.location ? `
                <div class="info-item">
                    <div class="info-label">地址</div>
                    <div class="info-value">${info.location}</div>
                </div>
            ` : ''}
            ${info.title ? `
                <div class="info-item">
                    <div class="info-label">职位</div>
                    <div class="info-value">${info.title}</div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 渲染教育背景
 */
function renderEducation(education) {
    const container = document.getElementById('educationContent');

    if (!education || education.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">暂无教育背景</p>';
        return;
    }

    container.innerHTML = education.map(edu => `
        <div class="education-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${edu.school || '未知学校'}</div>
                    <div class="item-subtitle">${edu.major || ''} ${edu.degree ? `· ${edu.degree}` : ''}</div>
                </div>
                <div class="item-date">${edu.start_date || ''} - ${edu.end_date || ''}</div>
            </div>
        </div>
    `).join('');
}

/**
 * 渲染工作经历
 */
function renderExperience(experience) {
    const container = document.getElementById('experienceContent');

    if (!experience || experience.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">暂无工作经历</p>';
        return;
    }

    container.innerHTML = experience.map(exp => `
        <div class="experience-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${exp.company || '未知公司'}</div>
                    <div class="item-subtitle">${exp.position || ''}</div>
                </div>
                <div class="item-date">${exp.start_date || ''} - ${exp.end_date || ''}</div>
            </div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            ${exp.achievements && exp.achievements.length > 0 ? `
                <ul class="item-list">
                    ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
}

/**
 * 渲染项目经验
 */
function renderProjects(projects) {
    const container = document.getElementById('projectsContent');

    if (!projects || projects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">暂无项目经验</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${project.name || '未命名项目'}</div>
                    ${project.role ? `<div class="item-subtitle">${project.role}</div>` : ''}
                </div>
            </div>
            ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            ${project.tech_stack && project.tech_stack.length > 0 ? `
                <div class="tech-stack">
                    ${project.tech_stack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            ` : ''}
            ${project.highlights && project.highlights.length > 0 ? `
                <ul class="item-list">
                    ${project.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
}

/**
 * 渲染技能特长
 */
function renderSkills(skills) {
    const container = document.getElementById('skillsContent');

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">暂无技能信息</p>';
        return;
    }

    container.innerHTML = `
        <div class="skills-container">
            ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
    `;
}

/**
 * 渲染完整简历
 */
function renderResume(resume) {
    currentResume = resume;

    // 渲染各个部分
    renderBasicInfo(resume.basic_info);
    renderEducation(resume.education);
    renderExperience(resume.experience);
    renderProjects(resume.projects);
    renderSkills(resume.skills);

    // 显示简历内容
    showResumeContent();
}

// ========== API 调用 ==========

/**
 * 从分步输入框收集数据并组装成文本
 */
function collectResumeData() {
    const parts = [];

    // 基本信息
    const name = elements.name.value.trim();
    const email = elements.email.value.trim();
    const phone = elements.phone.value.trim();

    if (name) parts.push(`姓名：${name}`);
    if (email) parts.push(`邮箱：${email}`);
    if (phone) parts.push(`电话：${phone}`);

    // 教育背景
    const education = elements.education.value.trim();
    if (education) {
        parts.push(`学历：${education}`);
    }

    // 工作经历
    const experience = elements.experience.value.trim();
    if (experience) {
        parts.push(`工作经历：\n${experience}`);
    }

    // 技能特长
    const skills = elements.skills.value.trim();
    if (skills) {
        parts.push(`技能：${skills}`);
    }

    // 项目经验
    const projects = elements.projects.value.trim();
    if (projects) {
        parts.push(`项目经验：${projects}`);
    }

    return parts.join('\n');
}

/**
 * 生成简历
 */
async function generateResume() {
    const userID = elements.userID.value.trim();
    const rawText = collectResumeData();

    if (!userID) {
        showToast('请输入用户ID', 'error');
        return;
    }

    if (!rawText) {
        showToast('请至少填写一项简历信息', 'error');
        return;
    }

    try {
        showLoading();
        elements.generateBtn.disabled = true;

        const resume = await apiRequest(`${API_BASE_URL}/resume/${userID}/generate`, {
            method: 'POST',
            body: JSON.stringify({ raw: rawText }),
        });

        renderResume(resume);
        showToast('简历生成成功！', 'success');
    } catch (error) {
        showToast(`生成失败：${error.message}`, 'error');
        showEmptyState();
    } finally {
        hideLoading();
        elements.generateBtn.disabled = false;
    }
}

/**
 * 添加GitHub项目
 */
async function addGitHubProject() {
    const userID = elements.userID.value.trim();
    const repoURL = elements.githubURL.value.trim();

    if (!userID) {
        showToast('请输入用户ID', 'error');
        return;
    }

    if (!repoURL) {
        showToast('请输入GitHub仓库链接', 'error');
        return;
    }

    // 简单验证GitHub URL格式
    if (!repoURL.includes('github.com')) {
        showToast('请输入有效的GitHub仓库链接', 'error');
        return;
    }

    try {
        showLoading();
        elements.addGithubBtn.disabled = true;

        const resume = await apiRequest(`${API_BASE_URL}/resume/${userID}/generate/github`, {
            method: 'POST',
            body: JSON.stringify({ repo_url: repoURL }),
        });

        renderResume(resume);
        showToast('GitHub项目添加成功！', 'success');
    } catch (error) {
        showToast(`添加失败：${error.message}`, 'error');
    } finally {
        hideLoading();
        elements.addGithubBtn.disabled = false;
    }
}

/**
 * 加载已有简历
 */
async function loadResume() {
    const userID = elements.userID.value.trim();

    if (!userID) {
        showToast('请输入用户ID', 'error');
        return;
    }

    try {
        showLoading();
        elements.loadBtn.disabled = true;

        const resume = await apiRequest(`${API_BASE_URL}/resume/${userID}`);

        renderResume(resume);
        showToast('简历加载成功！', 'success');
    } catch (error) {
        showToast(`加载失败：${error.message}`, 'error');
        showEmptyState();
    } finally {
        hideLoading();
        elements.loadBtn.disabled = false;
    }
}

/**
 * 导出为JSON
 */
function exportJSON() {
    if (!currentResume) {
        showToast('暂无简历数据可导出', 'error');
        return;
    }

    try {
        const dataStr = JSON.stringify(currentResume, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${currentResume.user_id || 'export'}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('JSON导出成功！', 'success');
    } catch (error) {
        showToast(`导出失败：${error.message}`, 'error');
    }
}

/**
 * 导出为PDF（使用浏览器打印功能）
 */
function exportPDF() {
    if (!currentResume) {
        showToast('暂无简历数据可导出', 'error');
        return;
    }

    try {
        // 使用浏览器打印功能
        window.print();
        showToast('请在打印对话框中选择"另存为PDF"', 'info');
    } catch (error) {
        showToast(`导出失败：${error.message}`, 'error');
    }
}

// ========== 事件监听 ==========

// 生成简历按钮
elements.generateBtn.addEventListener('click', generateResume);

// 添加GitHub项目按钮
elements.addGithubBtn.addEventListener('click', addGitHubProject);

// 加载简历按钮
elements.loadBtn.addEventListener('click', loadResume);

// 导出JSON按钮
elements.exportJSONBtn.addEventListener('click', exportJSON);

// 导出PDF按钮
elements.exportPDFBtn.addEventListener('click', exportPDF);

// GitHub链接回车键触发
elements.githubURL.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addGitHubProject();
    }
});

// ========== 初始化 ==========

console.log('🎯 智能简历生成器已启动');
console.log(`📡 API地址: ${API_BASE_URL}`);
console.log('💡 提示：分模块填写信息，点击"生成简历"即可');
