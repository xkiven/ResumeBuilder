// 编辑页面逻辑

const API_BASE_URL = 'http://localhost:8080/api';

// 全局变量
let currentUserID = '';
let currentResume = null;
let educationCount = 0;
let experienceCount = 0;
let projectCount = 0;
let skillCount = 0;
let zoomLevel = 1;
let changesMade = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 从 URL 获取 userID
    const urlParams = new URLSearchParams(window.location.search);
    currentUserID = urlParams.get('userID');

    if (!currentUserID) {
        showToast('❌ 缺少用户ID，即将返回首页', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // 显示当前用户ID
    document.getElementById('currentUserID').textContent = currentUserID;

    // 加载简历数据
    loadResume();

    // 绑定事件
    bindEvents();
});

// API 请求封装
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const contentType = response.headers.get('content-type');
        const hasContent = response.headers.get('content-length') !== '0';

        if (!response.ok) {
            let errorMessage = `请求失败 (${response.status})`;
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            }
            throw new Error(errorMessage);
        }

        if (contentType && contentType.includes('application/json') && hasContent) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// Toast 通知
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 显示/隐藏加载遮罩
function showLoading(show = true) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// 清理数据中的"未提供"等占位文本
function cleanPlaceholderText(value) {
    if (!value) return '';
    if (typeof value === 'string') {
        // 清理包含"未提供"、"未填写"、"暂无"等占位文本
        const placeholders = ['未提供', '未填写', '暂无', '无'];
        if (placeholders.includes(value.trim())) {
            return '';
        }
        return value;
    }
    return value;
}

// 深度清理简历数据
function cleanResumeData(resume) {
    // 清理基本信息
    if (resume.basic_info && resume.basic_info.length > 0) {
        resume.basic_info = resume.basic_info.map(info => ({
            name: cleanPlaceholderText(info.name),
            email: cleanPlaceholderText(info.email),
            phone: cleanPlaceholderText(info.phone),
            location: cleanPlaceholderText(info.location),
            title: cleanPlaceholderText(info.title)
        }));
    }

    // 清理教育背景
    if (resume.education && resume.education.length > 0) {
        resume.education = resume.education.map(edu => ({
            school: cleanPlaceholderText(edu.school),
            major: cleanPlaceholderText(edu.major),
            degree: cleanPlaceholderText(edu.degree),
            start_date: cleanPlaceholderText(edu.start_date),
            end_date: cleanPlaceholderText(edu.end_date)
        }));
    }

    // 清理工作经历
    if (resume.experience && resume.experience.length > 0) {
        resume.experience = resume.experience.map(exp => ({
            company: cleanPlaceholderText(exp.company),
            position: cleanPlaceholderText(exp.position),
            start_date: cleanPlaceholderText(exp.start_date),
            end_date: cleanPlaceholderText(exp.end_date),
            description: cleanPlaceholderText(exp.description),
            achievements: cleanPlaceholderText(exp.achievements)
        }));
    }

    // 清理项目
    if (resume.projects && resume.projects.length > 0) {
        resume.projects = resume.projects.map(proj => ({
            name: cleanPlaceholderText(proj.name),
            role: cleanPlaceholderText(proj.role),
            url: cleanPlaceholderText(proj.url),
            description: cleanPlaceholderText(proj.description),
            tech_stack: (proj.tech_stack && Array.isArray(proj.tech_stack))
                ? proj.tech_stack.map(tech => cleanPlaceholderText(tech)).filter(t => t)
                : [],
            highlights: (proj.highlights && Array.isArray(proj.highlights))
                ? proj.highlights.map(h => cleanPlaceholderText(h)).filter(h => h)
                : []
        }));
    }

    // 清理技能
    if (resume.skills && resume.skills.length > 0) {
        resume.skills = resume.skills.map(skill => cleanPlaceholderText(skill)).filter(s => s);
    }

    return resume;
}

// 加载简历数据
async function loadResume() {
    showLoading(true);
    try {
        let resume = await apiRequest(`${API_BASE_URL}/resume/${currentUserID}`);

        // 清理数据中的"未提供"等占位文本
        resume = cleanResumeData(resume);

        currentResume = resume;

        // 填充表单
        fillForm(resume);

        // 渲染预览
        renderPreview(resume);

        showToast('✅ 简历加载成功', 'success');
        changesMade = false;
    } catch (error) {
        showToast(`❌ 加载失败: ${error.message}`, 'error');
        console.error('加载简历失败:', error);
    } finally {
        showLoading(false);
    }
}

// 填充表单
function fillForm(resume) {
    // 基本信息
    if (resume.basic_info && resume.basic_info.length > 0) {
        const basic = resume.basic_info[0];
        document.getElementById('name').value = basic.name || '';
        document.getElementById('email').value = basic.email || '';
        document.getElementById('phone').value = basic.phone || '';
        document.getElementById('location').value = basic.location || '';
        document.getElementById('title').value = basic.title || '';
    }

    // 教育背景
    if (resume.education && resume.education.length > 0) {
        resume.education.forEach(edu => addEducation(edu));
    }

    // 校园经历
    if (resume.campus_experience && resume.campus_experience.length > 0) {
        resume.campus_experience.forEach(exp => addCampusExperience(exp));
    }

    // 工作经历
    if (resume.experience && resume.experience.length > 0) {
        resume.experience.forEach(exp => addExperience(exp));
    }

    // 技能
    if (resume.skills && resume.skills.length > 0) {
        resume.skills.forEach(skill => addSkill(skill));
    }

    // 项目
    if (resume.projects && resume.projects.length > 0) {
        resume.projects.forEach(proj => addProject(proj));
    }
}

// 添加教育经历
function addEducation(data = {}) {
    educationCount++;
    const id = `education-${educationCount}`;

    const html = `
        <div class="dynamic-item" id="${id}" data-type="education">
            <button type="button" class="remove-btn" onclick="removeItem('${id}')">×</button>
            <div class="form-grid">
                <div class="form-group">
                    <label>学校</label>
                    <input type="text" name="school" placeholder="北京大学" value="${data.school || ''}" />
                </div>
                <div class="form-group">
                    <label>专业</label>
                    <input type="text" name="major" placeholder="计算机科学与技术" value="${data.major || ''}" />
                </div>
                <div class="form-group">
                    <label>学位</label>
                    <select name="degree">
                        <option value="本科" ${data.degree === '本科' ? 'selected' : ''}>本科</option>
                        <option value="硕士" ${data.degree === '硕士' ? 'selected' : ''}>硕士</option>
                        <option value="博士" ${data.degree === '博士' ? 'selected' : ''}>博士</option>
                        <option value="大专" ${data.degree === '大专' ? 'selected' : ''}>大专</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>开始时间</label>
                    <input type="month" name="start_date" value="${data.start_date || ''}" />
                </div>
                <div class="form-group">
                    <label>结束时间</label>
                    <input type="month" name="end_date" value="${data.end_date || ''}" />
                </div>
            </div>
        </div>
    `;

    document.getElementById('educationList').insertAdjacentHTML('beforeend', html);
    attachInputListeners(`#${id}`);
}

// 添加校园经历
let campusExperienceCount = 0;

function addCampusExperience(data = {}) {
    campusExperienceCount++;
    const id = `campus-${campusExperienceCount}`;

    const html = `
        <div class="dynamic-item" id="${id}" data-type="campus_experience">
            <button type="button" class="remove-btn" onclick="removeItem('${id}')">×</button>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>经历标题</label>
                    <input type="text" name="title" placeholder="例如: 全国大学生数学建模竞赛 国家级一等奖" value="${data.title || ''}" />
                </div>
                <div class="form-group">
                    <label>时间</label>
                    <input type="text" name="date" placeholder="例如: 2023.05" value="${data.date || ''}" />
                </div>
                <div class="form-group">
                    <label>组织/单位</label>
                    <input type="text" name="organization" placeholder="例如: 校学生会、ACM协会" value="${data.organization || ''}" />
                </div>
                <div class="form-group full-width">
                    <label>详细描述（选填）</label>
                    <textarea name="description" rows="2" placeholder="可以描述您的角色、职责或成就等">${data.description || ''}</textarea>
                </div>
            </div>
        </div>
    `;

    document.getElementById('campusExperienceList').insertAdjacentHTML('beforeend', html);
    attachInputListeners(`#${id}`);
}

// 添加工作经历
function addExperience(data = {}) {
    experienceCount++;
    const id = `experience-${experienceCount}`;

    const html = `
        <div class="dynamic-item" id="${id}" data-type="experience">
            <button type="button" class="remove-btn" onclick="removeItem('${id}')">×</button>
            <div class="form-grid">
                <div class="form-group">
                    <label>公司名称</label>
                    <input type="text" name="company" placeholder="ABC科技有限公司" value="${data.company || ''}" />
                </div>
                <div class="form-group">
                    <label>职位</label>
                    <input type="text" name="position" placeholder="高级软件工程师" value="${data.position || ''}" />
                </div>
                <div class="form-group">
                    <label>开始时间</label>
                    <input type="month" name="start_date" value="${data.start_date || ''}" />
                </div>
                <div class="form-group">
                    <label>结束时间</label>
                    <input type="month" name="end_date" value="${data.end_date || ''}" />
                </div>
                <div class="form-group full-width">
                    <label>工作内容/成就</label>
                    <textarea name="achievements" rows="3" placeholder="描述您的主要工作内容和成就...">${data.achievements || ''}</textarea>
                </div>
            </div>
        </div>
    `;

    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
    attachInputListeners(`#${id}`);
}

// 添加项目
function addProject(data = {}) {
    projectCount++;
    const id = `project-${projectCount}`;

    // 处理技术栈和亮点
    const techStackStr = (data.tech_stack && Array.isArray(data.tech_stack))
        ? data.tech_stack.join(', ')
        : (data.tech_stack || '');

    const highlightsStr = (data.highlights && Array.isArray(data.highlights))
        ? data.highlights.join('\n')
        : (data.highlights || '');

    const html = `
        <div class="dynamic-item" id="${id}" data-type="project">
            <button type="button" class="remove-btn" onclick="removeItem('${id}')">×</button>
            <div class="form-grid">
                <div class="form-group">
                    <label>项目名称</label>
                    <input type="text" name="name" placeholder="智能简历生成器" value="${data.name || ''}" />
                </div>
                <div class="form-group">
                    <label>项目角色</label>
                    <input type="text" name="role" placeholder="开源项目/项目负责人" value="${data.role || ''}" />
                </div>
                <div class="form-group full-width">
                    <label>项目链接</label>
                    <input type="url" name="url" placeholder="https://github.com/..." value="${data.url || ''}" />
                </div>
                <div class="form-group full-width">
                    <label>项目描述</label>
                    <textarea name="description" rows="2" placeholder="简要描述项目的功能和特点...">${data.description || ''}</textarea>
                </div>
                <div class="form-group full-width">
                    <label>技术栈（用逗号分隔）</label>
                    <input type="text" name="tech_stack" placeholder="Go, React, MySQL, Docker" value="${techStackStr}" />
                </div>
                <div class="form-group full-width">
                    <label>项目亮点（每行一条）</label>
                    <textarea name="highlights" rows="3" placeholder="支持10万并发\n实现了高可用架构">${highlightsStr}</textarea>
                </div>
            </div>
        </div>
    `;

    document.getElementById('projectsList').insertAdjacentHTML('beforeend', html);
    attachInputListeners(`#${id}`);
}

// 添加技能
function addSkill(skillText = '') {
    skillCount++;
    const id = `skill-${skillCount}`;

    const html = `
        <div class="dynamic-item" id="${id}" data-type="skill" style="padding: 12px;">
            <button type="button" class="remove-btn" onclick="removeItem('${id}')">×</button>
            <div class="form-group" style="margin: 0;">
                <input type="text" name="skill" placeholder="例如: 熟悉使用 Go 语言进行后端开发" value="${skillText}" style="width: 100%;" />
            </div>
        </div>
    `;

    document.getElementById('skillsList').insertAdjacentHTML('beforeend', html);
    attachInputListeners(`#${id}`);
}

// 删除项
function removeItem(id) {
    const item = document.getElementById(id);
    if (item) {
        item.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            item.remove();
            updatePreview();
        }, 300);
    }
}

// 绑定事件
function bindEvents() {
    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', saveResume);

    // 导出按钮
    document.getElementById('exportPDFBtn').addEventListener('click', exportPDF);
    document.getElementById('exportJSONBtn').addEventListener('click', exportJSON);

    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', () => {
        if (changesMade) {
            if (confirm('您有未保存的修改，确定要离开吗？')) {
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    // 添加按钮
    document.getElementById('addEducationBtn').addEventListener('click', () => addEducation());
    document.getElementById('addCampusExperienceBtn').addEventListener('click', () => addCampusExperience());
    document.getElementById('addExperienceBtn').addEventListener('click', () => addExperience());
    document.getElementById('addProjectBtn').addEventListener('click', () => addProject());
    document.getElementById('addSkillBtn').addEventListener('click', () => addSkill());
    document.getElementById('addGithubBtn').addEventListener('click', addGitHubProject);

    // 缩放按钮
    document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
    document.getElementById('resetZoomBtn').addEventListener('click', resetZoom);

    // 模板切换按钮
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const templateId = this.dataset.template;
            if (window.ResumeTemplates && window.ResumeTemplates.setTemplate(templateId)) {
                // 移除所有按钮的active类
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                this.classList.add('active');
                // 重新渲染预览
                updatePreview();
            }
        });
    });

    // 监听表单输入变化
    attachInputListeners('.edit-form');

    // 离开页面提示
    window.addEventListener('beforeunload', (e) => {
        if (changesMade) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// 附加输入监听器
function attachInputListeners(selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            changesMade = true;
            updatePreview();
        });
    });
}

// 更新预览
function updatePreview() {
    const data = collectFormData();
    renderPreview(data);
}

// 收集表单数据
function collectFormData() {
    const data = {
        user_id: currentUserID,
        basic_info: [],
        education: [],
        campus_experience: [],
        experience: [],
        skills: [],
        projects: []
    };

    // 基本信息
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    const title = document.getElementById('title').value.trim();

    if (name || email) {
        data.basic_info.push({ name, email, phone, location, title });
    }

    // 教育背景
    document.querySelectorAll('#educationList .dynamic-item').forEach(item => {
        const school = item.querySelector('[name="school"]').value.trim();
        const major = item.querySelector('[name="major"]').value.trim();
        const degree = item.querySelector('[name="degree"]').value;
        const start_date = item.querySelector('[name="start_date"]').value;
        const end_date = item.querySelector('[name="end_date"]').value;

        if (school || major) {
            data.education.push({ school, major, degree, start_date, end_date });
        }
    });

    // 校园经历
    document.querySelectorAll('#campusExperienceList .dynamic-item').forEach(item => {
        const title = item.querySelector('[name="title"]').value.trim();
        const date = item.querySelector('[name="date"]').value.trim();
        const organization = item.querySelector('[name="organization"]').value.trim();
        const description = item.querySelector('[name="description"]').value.trim();

        if (title) {
            data.campus_experience.push({ title, date, organization, description });
        }
    });

    // 工作经历
    document.querySelectorAll('#experienceList .dynamic-item').forEach(item => {
        const company = item.querySelector('[name="company"]').value.trim();
        const position = item.querySelector('[name="position"]').value.trim();
        const start_date = item.querySelector('[name="start_date"]').value;
        const end_date = item.querySelector('[name="end_date"]').value;
        const achievements = item.querySelector('[name="achievements"]').value.trim();

        if (company || position) {
            data.experience.push({ company, position, start_date, end_date, achievements });
        }
    });

    // 技能
    document.querySelectorAll('#skillsList .dynamic-item').forEach(item => {
        const skill = item.querySelector('[name="skill"]').value.trim();
        if (skill) {
            data.skills.push(skill);
        }
    });

    // 项目
    document.querySelectorAll('#projectsList .dynamic-item').forEach(item => {
        const name = item.querySelector('[name="name"]').value.trim();
        const role = item.querySelector('[name="role"]').value.trim();
        const url = item.querySelector('[name="url"]').value.trim();
        const description = item.querySelector('[name="description"]').value.trim();
        const techStackInput = item.querySelector('[name="tech_stack"]').value.trim();
        const highlightsInput = item.querySelector('[name="highlights"]').value.trim();

        const tech_stack = techStackInput ? techStackInput.split(/[,，、]/).map(s => s.trim()).filter(s => s) : [];
        const highlights = highlightsInput ? highlightsInput.split('\n').map(s => s.trim()).filter(s => s) : [];

        if (name || description) {
            data.projects.push({ name, role, url, description, tech_stack, highlights });
        }
    });

    return data;
}

// 渲染预览（使用模板系统）
function renderPreview(resume) {
    const previewDiv = document.getElementById('resumePreview');

    // 使用模板系统渲染
    if (window.ResumeTemplates) {
        previewDiv.innerHTML = window.ResumeTemplates.render(resume);
        return;
    }

    // 降级：使用原始渲染（如果模板系统未加载）
    renderPreviewLegacy(resume);
}

// 原始渲染方法（备用）
function renderPreviewLegacy(resume) {
    const previewDiv = document.getElementById('resumePreview');

    let html = '';

    // 简历头部
    if (resume.basic_info && resume.basic_info.length > 0) {
        const basic = resume.basic_info[0];
        const hasBasicInfo = basic.name || basic.email || basic.phone || basic.location || basic.title;

        if (hasBasicInfo) {
            html += `
                <div class="resume-header">
                    <h1 class="resume-name">${basic.name || '姓名'}</h1>
                    ${basic.title ? `<div class="resume-title">${basic.title}</div>` : ''}
                    <div class="resume-contact">
                        ${basic.email ? `<span>📧 ${basic.email}</span>` : ''}
                        ${basic.phone ? `<span>📱 ${basic.phone}</span>` : ''}
                        ${basic.location ? `<span>📍 ${basic.location}</span>` : ''}
                    </div>
                </div>
            `;
        }
    }

    // 教育背景
    if (resume.education && resume.education.length > 0) {
        // 过滤掉完全空的教育记录
        const validEducations = resume.education.filter(edu => edu.school || edu.major || edu.degree);

        if (validEducations.length > 0) {
            html += `<div class="resume-section">
                <h2 class="resume-section-title">🎓 教育背景</h2>`;

            validEducations.forEach(edu => {
                // 构建专业和学位信息
                const majorDegree = [edu.major, edu.degree].filter(Boolean).join(' · ');

                // 构建日期范围
                let dateRange = '';
                if (edu.start_date && edu.end_date) {
                    dateRange = `${formatDate(edu.start_date)} - ${formatDate(edu.end_date)}`;
                } else if (edu.start_date) {
                    dateRange = `${formatDate(edu.start_date)} 至今`;
                } else if (edu.end_date) {
                    dateRange = `至 ${formatDate(edu.end_date)}`;
                }

                html += `
                    <div class="resume-item">
                        <div class="resume-item-header">
                            <div>
                                ${edu.school ? `<div class="resume-item-title">${edu.school}</div>` : ''}
                                ${majorDegree ? `<div class="resume-item-subtitle">${majorDegree}</div>` : ''}
                            </div>
                            ${dateRange ? `<div class="resume-item-date">${dateRange}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }
    }

    // 工作经历
    if (resume.experience && resume.experience.length > 0) {
        // 过滤掉完全空的工作记录
        const validExperiences = resume.experience.filter(exp => exp.company || exp.position);

        if (validExperiences.length > 0) {
            html += `<div class="resume-section">
                <h2 class="resume-section-title">💼 工作经历</h2>`;

            validExperiences.forEach(exp => {
                // 构建日期范围
                let dateRange = '';
                if (exp.start_date && exp.end_date) {
                    dateRange = `${formatDate(exp.start_date)} - ${formatDate(exp.end_date)}`;
                } else if (exp.start_date) {
                    dateRange = `${formatDate(exp.start_date)} 至今`;
                } else if (exp.end_date) {
                    dateRange = `至 ${formatDate(exp.end_date)}`;
                }

                html += `
                    <div class="resume-item">
                        <div class="resume-item-header">
                            <div>
                                ${exp.company ? `<div class="resume-item-title">${exp.company}</div>` : ''}
                                ${exp.position ? `<div class="resume-item-subtitle">${exp.position}</div>` : ''}
                            </div>
                            ${dateRange ? `<div class="resume-item-date">${dateRange}</div>` : ''}
                        </div>
                        ${exp.achievements ? `<div class="resume-item-description">${exp.achievements}</div>` : ''}
                    </div>
                `;
            });

            html += `</div>`;
        }
    }

    // 项目经验
    if (resume.projects && resume.projects.length > 0) {
        // 过滤掉完全空的项目记录
        const validProjects = resume.projects.filter(proj => proj.name || proj.description);

        if (validProjects.length > 0) {
            html += `<div class="resume-section">
                <h2 class="resume-section-title">🚀 项目经验</h2>`;

            validProjects.forEach(proj => {
                html += `
                    <div class="resume-item">
                        ${proj.name ? `<div class="resume-item-title">${proj.name}</div>` : ''}
                        ${proj.role ? `<div class="resume-item-subtitle">角色: ${proj.role}</div>` : ''}
                        ${proj.url ? `<div class="resume-item-subtitle">🔗 ${proj.url}</div>` : ''}
                        ${proj.description ? `<div class="resume-item-description">${proj.description}</div>` : ''}
                        ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                            <div class="resume-tech-stack" style="margin-top: 0.5rem;">
                                ${proj.tech_stack.map(tech => `<span class="resume-skill-tag" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">${tech}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${proj.highlights && proj.highlights.length > 0 ? `
                            <ul class="resume-highlights" style="margin-top: 0.5rem; padding-left: 1.5rem; color: #475569;">
                                ${proj.highlights.map(h => `<li>${h}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `;
            });

            html += `</div>`;
        }
    }

    // 技能特长
    if (resume.skills && resume.skills.length > 0) {
        html += `
            <div class="resume-section">
                <h2 class="resume-section-title">⚡ 技能特长</h2>
                <div class="resume-skills">
                    ${resume.skills.map(skill => `<span class="resume-skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }

    previewDiv.innerHTML = html;
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
        const [year, month] = parts;
        return `${year}年${month}月`;
    }
    return dateStr;
}

// 保存简历
async function saveResume() {
    const data = collectFormData();

    // 验证必填字段
    if (!data.basic_info.length || !data.basic_info[0].name || !data.basic_info[0].email) {
        showToast('❌ 请至少填写姓名和邮箱', 'error');
        return;
    }

    showLoading(true);
    try {
        // 直接保存简历数据，不需要 AI 解析
        await apiRequest(`${API_BASE_URL}/resume`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        currentResume = data;
        changesMade = false;
        showToast('✅ 保存成功', 'success');
    } catch (error) {
        showToast(`❌ 保存失败: ${error.message}`, 'error');
        console.error('保存失败:', error);
    } finally {
        showLoading(false);
    }
}

// 导出 JSON
function exportJSON() {
    const data = collectFormData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${currentUserID}_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('✅ JSON 导出成功', 'success');
}

// 导出 PDF
async function exportPDF() {
    const data = collectFormData();

    // 检查是否有内容
    if (!data.basic_info[0].name) {
        showToast('❌ 请至少填写姓名后再导出', 'error');
        return;
    }

    try {
        showLoading(true);
        showToast('📄 正在生成PDF，请稍候...', 'info');

        const element = document.getElementById('resumePreview');

        // 保存原始样式
        const originalBoxShadow = element.style.boxShadow;
        const originalBorderRadius = element.style.borderRadius;
        const originalTransform = element.style.transform;
        const originalTransformOrigin = element.style.transformOrigin;
        const originalWidth = element.style.width;
        const originalLineHeight = element.style.lineHeight;
        const originalLetterSpacing = element.style.letterSpacing;

        // 移除阴影、圆角
        element.style.boxShadow = 'none';
        element.style.borderRadius = '0';

        // 增加行高和字间距以改善可读性
        element.style.lineHeight = '1.5';
        element.style.letterSpacing = '0.2px';

        // 计算缩放比例以适应单页（保留所有内容）
        const contentHeight = element.scrollHeight;
        const a4HeightPx = 1050;  // A4可用高度（考虑边距）

        let scaleFactor = 1;
        if (contentHeight > a4HeightPx) {
            scaleFactor = a4HeightPx / contentHeight;
            // 应用缩放
            element.style.transform = `scale(${scaleFactor})`;
            element.style.transformOrigin = 'top left';
            element.style.width = `${100 / scaleFactor}%`;
        }

        // PDF 配置选项（固定一页）
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `resume_${data.basic_info[0].name}_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2.5,
                useCORS: true,
                letterRendering: true,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: {
                mode: 'avoid-all'
            }
        };

        // 生成 PDF
        await html2pdf().set(opt).from(element).save();

        // 恢复原始样式
        element.style.boxShadow = originalBoxShadow;
        element.style.borderRadius = originalBorderRadius;
        element.style.transform = originalTransform;
        element.style.transformOrigin = originalTransformOrigin;
        element.style.width = originalWidth;
        element.style.lineHeight = originalLineHeight;
        element.style.letterSpacing = originalLetterSpacing;

        showToast('✅ PDF 导出成功！', 'success');
    } catch (error) {
        showToast(`❌ PDF 导出失败: ${error.message}`, 'error');
        console.error('PDF导出失败:', error);
    } finally {
        showLoading(false);
    }
}

// 验证GitHub仓库URL格式
function validateGitHubURL(url) {
    // 匹配多种GitHub URL格式：
    // - https://github.com/user/repo
    // - https://github.com/user/repo/
    // - https://github.com/user/repo/tree/branch
    // - https://github.com/user/repo/blob/branch/file
    const pattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(?:\/(?:tree|blob)\/[\w.-]+.*)?$/;
    return pattern.test(url);
}

// GitHub 项目分析
async function addGitHubProject() {
    const repoURL = document.getElementById('githubURL').value.trim();

    if (!repoURL) {
        showToast('❌ 请输入GitHub仓库链接', 'error');
        return;
    }

    if (!validateGitHubURL(repoURL)) {
        showToast('❌ 请输入有效的GitHub仓库链接（格式：https://github.com/用户名/仓库名）', 'error');
        return;
    }

    const btn = document.getElementById('addGithubBtn');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '⏳ AI 分析中...';

        // 阶段1：获取README
        showToast('📥 正在获取README.md...', 'info');
        showLoading(true);

        const response = await apiRequest(`${API_BASE_URL}/resume/${currentUserID}/generate/github`, {
            method: 'POST',
            body: JSON.stringify({ repo_url: repoURL }),
        });

        // 阶段2：AI分析完成
        showToast('🤖 AI分析完成，正在添加到简历...', 'info');

        // 从返回的简历数据中提取最新添加的项目
        if (response.projects && response.projects.length > 0) {
            const lastProject = response.projects[response.projects.length - 1];

            // 添加到表单
            addProject(lastProject);

            // 更新预览
            updatePreview();

            // 清空输入框
            document.getElementById('githubURL').value = '';

            showToast('✅ GitHub项目分析成功！已添加到项目列表', 'success');
            changesMade = true;
        } else {
            showToast('⚠️ 未能提取项目信息，请手动添加', 'error');
        }

    } catch (error) {
        showToast(`❌ 分析失败: ${error.message}`, 'error');
        console.error('GitHub分析失败:', error);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        showLoading(false);
    }
}

// 缩放控制
function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.1, 1.5);
    applyZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.7);
    applyZoom();
}

function resetZoom() {
    zoomLevel = 1;
    applyZoom();
}

function applyZoom() {
    const preview = document.getElementById('resumePreview');
    preview.style.transform = `scale(${zoomLevel})`;
}

// 添加淡出动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
document.head.appendChild(style);
