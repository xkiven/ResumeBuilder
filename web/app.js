// ========== 配置 ==========
const API_BASE_URL = 'http://localhost:8080/api';

// ========== 状态管理 ==========
let currentStep = 1;
const totalSteps = 6;
let resumeData = {
    educations: [],
    experiences: [],
    projects: []
};

// ========== 工具函数 ==========

/**
 * 显示Toast通知
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
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

        const contentType = response.headers.get('content-type');
        const hasContent = response.headers.get('content-length') !== '0';

        if (!response.ok) {
            let errorMessage = `请求失败 (${response.status})`;
            if (contentType && contentType.includes('application/json') && hasContent) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
            } else {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }

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

// ========== 步骤导航 ==========

function showStep(step) {
    // 隐藏所有步骤
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });

    // 显示当前步骤
    document.getElementById(`step${step}`).classList.add('active');

    // 更新进度条
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        const stepNum = index + 1;
        if (stepNum < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (stepNum === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });

    // 更新导航按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
    nextBtn.textContent = step === totalSteps ? '完成 ✓' : '下一步 →';

    currentStep = step;
}

function nextStep() {
    if (currentStep < totalSteps) {
        // 验证当前步骤
        if (validateStep(currentStep)) {
            // 如果是最后一步前，生成预览
            if (currentStep === totalSteps - 1) {
                generatePreview();
            }
            showStep(currentStep + 1);
        }
    } else {
        // 最后一步，显示完成
        showToast('所有信息已填写完成！', 'success');
    }
}

function prevStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

function validateStep(step) {
    switch(step) {
        case 1:
            const userID = document.getElementById('userID').value.trim();
            if (!userID) {
                showToast('请输入用户ID', 'error');
                return false;
            }
            return true;
        case 2:
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            if (!name) {
                showToast('请输入姓名', 'error');
                return false;
            }
            if (!email) {
                showToast('请输入邮箱', 'error');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// ========== 动态表单管理 ==========

// 教育经历
let educationCount = 0;

function addEducation(data = {}) {
    educationCount++;
    const id = `education-${educationCount}`;
    const html = `
        <div class="dynamic-item" id="${id}">
            <div class="item-header">
                <span class="item-title">教育经历 ${educationCount}</span>
                <button type="button" class="btn-remove" onclick="removeItem('${id}')">删除</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>学校名称</label>
                    <input type="text" name="school" placeholder="北京大学" value="${data.school || ''}" />
                </div>
                <div class="form-group">
                    <label>专业</label>
                    <input type="text" name="major" placeholder="计算机科学" value="${data.major || ''}" />
                </div>
                <div class="form-group">
                    <label>学历</label>
                    <select name="degree">
                        <option value="">请选择</option>
                        <option value="专科" ${data.degree === '专科' ? 'selected' : ''}>专科</option>
                        <option value="本科" ${data.degree === '本科' ? 'selected' : ''}>本科</option>
                        <option value="硕士" ${data.degree === '硕士' ? 'selected' : ''}>硕士</option>
                        <option value="博士" ${data.degree === '博士' ? 'selected' : ''}>博士</option>
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
}

// 工作经历
let experienceCount = 0;

function addExperience(data = {}) {
    experienceCount++;
    const id = `experience-${experienceCount}`;
    const achievementsText = data.achievements ? data.achievements.join('\n') : '';
    const html = `
        <div class="dynamic-item" id="${id}">
            <div class="item-header">
                <span class="item-title">工作经历 ${experienceCount}</span>
                <button type="button" class="btn-remove" onclick="removeItem('${id}')">删除</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>公司名称</label>
                    <input type="text" name="company" placeholder="腾讯科技" value="${data.company || ''}" />
                </div>
                <div class="form-group">
                    <label>职位</label>
                    <input type="text" name="position" placeholder="高级开发工程师" value="${data.position || ''}" />
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
                    <label>工作描述</label>
                    <textarea name="description" rows="2" placeholder="负责微信后端开发...">${data.description || ''}</textarea>
                </div>
                <div class="form-group full-width">
                    <label>主要成就（每行一条）</label>
                    <textarea name="achievements" rows="3" placeholder="优化系统性能，提升50%\n设计并实现XX功能模块">${achievementsText}</textarea>
                </div>
            </div>
        </div>
    `;
    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
}

// 项目经验
let projectCount = 0;

function addProject(data = {}) {
    projectCount++;
    const id = `project-${projectCount}`;
    const techStackText = data.tech_stack ? data.tech_stack.join(', ') : '';
    const highlightsText = data.highlights ? data.highlights.join('\n') : '';
    const html = `
        <div class="dynamic-item" id="${id}">
            <div class="item-header">
                <span class="item-title">项目 ${projectCount}</span>
                <button type="button" class="btn-remove" onclick="removeItem('${id}')">删除</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>项目名称</label>
                    <input type="text" name="name" placeholder="高并发消息系统" value="${data.name || ''}" />
                </div>
                <div class="form-group">
                    <label>担任角色</label>
                    <input type="text" name="role" placeholder="后端负责人" value="${data.role || ''}" />
                </div>
                <div class="form-group full-width">
                    <label>项目描述</label>
                    <textarea name="description" rows="2" placeholder="开发了日均处理10亿条消息的分布式系统...">${data.description || ''}</textarea>
                </div>
                <div class="form-group full-width">
                    <label>技术栈（用逗号分隔）</label>
                    <input type="text" name="tech_stack" placeholder="Go, Redis, Kafka, Docker" value="${techStackText}" />
                </div>
                <div class="form-group full-width">
                    <label>项目亮点（每行一条）</label>
                    <textarea name="highlights" rows="2" placeholder="支持10亿级消息处理\n实现99.99%可用性">${highlightsText}</textarea>
                </div>
            </div>
        </div>
    `;
    document.getElementById('projectsList').insertAdjacentHTML('beforeend', html);
}

// 删除项目
function removeItem(id) {
    document.getElementById(id).remove();
}

// ========== 数据收集 ==========

function collectFormData() {
    const userID = document.getElementById('userID').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    const title = document.getElementById('title').value.trim();
    const skills = document.getElementById('skills').value.trim();

    // 收集教育
    const educations = [];
    document.querySelectorAll('#educationList .dynamic-item').forEach(item => {
        const school = item.querySelector('[name="school"]').value.trim();
        const major = item.querySelector('[name="major"]').value.trim();
        const degree = item.querySelector('[name="degree"]').value.trim();
        const startDate = item.querySelector('[name="start_date"]').value.trim();
        const endDate = item.querySelector('[name="end_date"]').value.trim();

        if (school || major) {
            educations.push({ school, major, degree, start_date: startDate, end_date: endDate });
        }
    });

    // 收集工作经历
    const experiences = [];
    document.querySelectorAll('#experienceList .dynamic-item').forEach(item => {
        const company = item.querySelector('[name="company"]').value.trim();
        const position = item.querySelector('[name="position"]').value.trim();
        const startDate = item.querySelector('[name="start_date"]').value.trim();
        const endDate = item.querySelector('[name="end_date"]').value.trim();
        const description = item.querySelector('[name="description"]').value.trim();
        const achievementsText = item.querySelector('[name="achievements"]').value.trim();
        const achievements = achievementsText ? achievementsText.split('\n').filter(a => a.trim()) : [];

        if (company || position) {
            experiences.push({ company, position, start_date: startDate || '', end_date: endDate || '', description, achievements });
        }
    });

    // 收集项目
    const projects = [];
    document.querySelectorAll('#projectsList .dynamic-item').forEach(item => {
        const name = item.querySelector('[name="name"]').value.trim();
        const role = item.querySelector('[name="role"]').value.trim();
        const description = item.querySelector('[name="description"]').value.trim();
        const techStackText = item.querySelector('[name="tech_stack"]').value.trim();
        const highlightsText = item.querySelector('[name="highlights"]').value.trim();
        const tech_stack = techStackText ? techStackText.split(/[,，、]/).map(s => s.trim()).filter(s => s) : [];
        const highlights = highlightsText ? highlightsText.split('\n').filter(h => h.trim()) : [];

        if (name) {
            projects.push({ name, role, description, tech_stack, highlights });
        }
    });

    return {
        user_id: userID,
        basic_info: [{ name, email, phone, location, title }],
        education: educations,
        experience: experiences,
        projects: projects,
        skills: skills ? skills.split(/[,，、]/).map(s => s.trim()).filter(s => s) : []
    };
}

// 生成预览
function generatePreview() {
    const data = collectFormData();
    let html = '';

    // 基本信息
    if (data.basic_info && data.basic_info[0]) {
        const info = data.basic_info[0];
        html += `<div class="preview-section">
            <h4>👤 基本信息</h4>
            ${info.name ? `<div class="preview-item">姓名：${info.name}</div>` : ''}
            ${info.email ? `<div class="preview-item">邮箱：${info.email}</div>` : ''}
            ${info.phone ? `<div class="preview-item">电话：${info.phone}</div>` : ''}
            ${info.location ? `<div class="preview-item">地址：${info.location}</div>` : ''}
            ${info.title ? `<div class="preview-item">职位：${info.title}</div>` : ''}
        </div>`;
    }

    // 教育背景
    if (data.education && data.education.length > 0) {
        html += `<div class="preview-section"><h4>🎓 教育背景</h4>`;
        data.education.forEach(edu => {
            html += `<div class="preview-item">${edu.school} - ${edu.major} (${edu.degree}) ${edu.start_date}-${edu.end_date}</div>`;
        });
        html += `</div>`;
    }

    // 工作经历
    if (data.experience && data.experience.length > 0) {
        html += `<div class="preview-section"><h4>💼 工作经历</h4>`;
        data.experience.forEach(exp => {
            html += `<div class="preview-item">${exp.company} - ${exp.position} (${exp.start_date}-${exp.end_date})</div>`;
        });
        html += `</div>`;
    }

    // 项目经验
    if (data.projects && data.projects.length > 0) {
        html += `<div class="preview-section"><h4>🚀 项目经验</h4>`;
        data.projects.forEach(proj => {
            html += `<div class="preview-item">${proj.name}${proj.role ? ` (${proj.role})` : ''}</div>`;
        });
        html += `</div>`;
    }

    // 技能
    if (data.skills && data.skills.length > 0) {
        html += `<div class="preview-section"><h4>⚡ 技能</h4>`;
        html += `<div class="preview-item">${data.skills.join('、')}</div>`;
        html += `</div>`;
    }

    document.getElementById('previewContent').innerHTML = html || '<p>暂无填写内容</p>';
}

// ========== 简历生成 ==========

async function generateResume() {
    const data = collectFormData();

    if (!data.user_id) {
        showToast('请输入用户ID', 'error');
        return;
    }

    // 组装成后端需要的格式
    let rawText = '';
    if (data.basic_info[0].name) rawText += `姓名：${data.basic_info[0].name}\n`;
    if (data.basic_info[0].email) rawText += `邮箱：${data.basic_info[0].email}\n`;
    if (data.basic_info[0].phone) rawText += `电话：${data.basic_info[0].phone}\n`;
    if (data.basic_info[0].location) rawText += `地址：${data.basic_info[0].location}\n`;
    if (data.basic_info[0].title) rawText += `职位：${data.basic_info[0].title}\n`;

    if (data.education.length > 0) {
        rawText += `\n教育背景：\n`;
        data.education.forEach(edu => {
            rawText += `- ${edu.school}，${edu.major}，${edu.degree}，${edu.start_date}-${edu.end_date}\n`;
        });
    }

    if (data.experience.length > 0) {
        rawText += `\n工作经历：\n`;
        data.experience.forEach(exp => {
            rawText += `- ${exp.company}，${exp.position}，${exp.start_date}-${exp.end_date}`;
            if (exp.description) rawText += `，${exp.description}`;
            rawText += `\n`;
            if (exp.achievements.length > 0) {
                exp.achievements.forEach(a => rawText += `  * ${a}\n`);
            }
        });
    }

    if (data.skills.length > 0) {
        rawText += `\n技能：${data.skills.join('、')}\n`;
    }

    if (data.projects.length > 0) {
        rawText += `\n项目经验：\n`;
        data.projects.forEach(proj => {
            rawText += `- ${proj.name}`;
            if (proj.role) rawText += `（${proj.role}）`;
            if (proj.description) rawText += `：${proj.description}`;
            rawText += `\n`;
            if (proj.tech_stack.length > 0) {
                rawText += `  技术栈：${proj.tech_stack.join('、')}\n`;
            }
            if (proj.highlights.length > 0) {
                proj.highlights.forEach(h => rawText += `  * ${h}\n`);
            }
        });
    }

    try {
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('generateBtn').innerHTML = '<span class="btn-icon">⏳</span>生成中...';

        const resume = await apiRequest(`${API_BASE_URL}/resume/${data.user_id}/generate`, {
            method: 'POST',
            body: JSON.stringify({ raw: rawText }),
        });

        showToast('简历生成成功！即将跳转到编辑页面...', 'success');

        // 跳转到编辑页面
        setTimeout(() => {
            window.location.href = `edit.html?userID=${data.user_id}`;
        }, 1000);

    } catch (error) {
        showToast(`生成失败：${error.message}`, 'error');
    } finally {
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('generateBtn').innerHTML = '<span class="btn-icon">✨</span>生成简历';
    }
}

// ========== 简历渲染 ==========

function renderResume(resume) {
    let html = '';

    // 基本信息
    if (resume.basic_info && resume.basic_info.length > 0) {
        const info = resume.basic_info[0];
        html += `<div class="resume-section">
            <h3>👤 基本信息</h3>
            <div class="basic-info-grid">
                ${info.name ? `<div class="info-item"><div class="info-label">姓名</div><div class="info-value">${info.name}</div></div>` : ''}
                ${info.email ? `<div class="info-item"><div class="info-label">邮箱</div><div class="info-value">${info.email}</div></div>` : ''}
                ${info.phone ? `<div class="info-item"><div class="info-label">电话</div><div class="info-value">${info.phone}</div></div>` : ''}
                ${info.location ? `<div class="info-item"><div class="info-label">地址</div><div class="info-value">${info.location}</div></div>` : ''}
                ${info.title ? `<div class="info-item"><div class="info-label">职位</div><div class="info-value">${info.title}</div></div>` : ''}
            </div>
        </div>`;
    }

    // 教育背景
    if (resume.education && resume.education.length > 0) {
        html += `<div class="resume-section"><h3>🎓 教育背景</h3>`;
        resume.education.forEach(edu => {
            html += `<div class="education-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${edu.school || ''}</div>
                        <div class="item-subtitle">${edu.major || ''} ${edu.degree ? `· ${edu.degree}` : ''}</div>
                    </div>
                    <div class="item-date">${edu.start_date || ''} - ${edu.end_date || ''}</div>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    // 工作经历
    if (resume.experience && resume.experience.length > 0) {
        html += `<div class="resume-section"><h3>💼 工作经历</h3>`;
        resume.experience.forEach(exp => {
            html += `<div class="experience-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${exp.company || ''}</div>
                        <div class="item-subtitle">${exp.position || ''}</div>
                    </div>
                    <div class="item-date">${exp.start_date || ''} - ${exp.end_date || ''}</div>
                </div>
                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                ${exp.achievements && exp.achievements.length > 0 ? `
                    <ul class="item-list">
                        ${exp.achievements.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>`;
        });
        html += `</div>`;
    }

    // 项目经验
    if (resume.projects && resume.projects.length > 0) {
        html += `<div class="resume-section"><h3>🚀 项目经验</h3>`;
        resume.projects.forEach(proj => {
            html += `<div class="project-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${proj.name || ''}</div>
                        ${proj.role ? `<div class="item-subtitle">${proj.role}</div>` : ''}
                    </div>
                </div>
                ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
                ${proj.tech_stack && proj.tech_stack.length > 0 ? `
                    <div class="tech-stack">
                        ${proj.tech_stack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    </div>
                ` : ''}
                ${proj.highlights && proj.highlights.length > 0 ? `
                    <ul class="item-list">
                        ${proj.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>`;
        });
        html += `</div>`;
    }

    // 技能
    if (resume.skills && resume.skills.length > 0) {
        html += `<div class="resume-section"><h3>⚡ 技能特长</h3>
            <div class="skills-container">
                ${resume.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        </div>`;
    }

    document.getElementById('resumeContent').innerHTML = html;
    document.getElementById('resumeDisplay').style.display = 'block';
}

// ========== 加载已有简历 ==========

async function loadExistingResume() {
    const userID = document.getElementById('userID').value.trim();

    if (!userID) {
        showToast('请先输入用户ID', 'error');
        return;
    }

    try {
        const resume = await apiRequest(`${API_BASE_URL}/resume/${userID}`);

        showToast('简历加载成功！即将跳转到编辑页面...', 'success');

        // 跳转到编辑页面
        setTimeout(() => {
            window.location.href = `edit.html?userID=${userID}`;
        }, 1000);

    } catch (error) {
        showToast(`加载失败：${error.message}`, 'error');
    }
}

// ========== GitHub项目分析 ==========

async function addGitHubProject() {
    const userID = document.getElementById('userID').value.trim();
    const repoURL = document.getElementById('githubURL').value.trim();

    if (!userID) {
        showToast('请输入用户ID', 'error');
        return;
    }

    if (!repoURL || !repoURL.includes('github.com')) {
        showToast('请输入有效的GitHub仓库链接', 'error');
        return;
    }

    try {
        document.getElementById('addGithubBtn').disabled = true;
        document.getElementById('addGithubBtn').innerHTML = '<span class="btn-icon">⏳</span>分析中...';

        const resume = await apiRequest(`${API_BASE_URL}/resume/${userID}/generate/github`, {
            method: 'POST',
            body: JSON.stringify({ repo_url: repoURL }),
        });

        // 如果返回的简历中有项目，添加到列表
        if (resume.projects && resume.projects.length > 0) {
            const lastProject = resume.projects[resume.projects.length - 1];
            addProject(lastProject);
            showToast('GitHub项目分析成功！已添加到项目列表', 'success');
            document.getElementById('githubURL').value = '';
        }

    } catch (error) {
        showToast(`分析失败：${error.message}`, 'error');
    } finally {
        document.getElementById('addGithubBtn').disabled = false;
        document.getElementById('addGithubBtn').innerHTML = '<span class="btn-icon">🔗</span>分析并添加';
    }
}

// ========== 导出功能 ==========

function exportJSON() {
    const data = collectFormData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_${data.user_id}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('JSON导出成功！', 'success');
}

function exportPDF() {
    window.print();
    showToast('请在打印对话框中选择"另存为PDF"', 'info');
}

// ========== 事件绑定 ==========

document.getElementById('prevBtn').addEventListener('click', prevStep);
document.getElementById('nextBtn').addEventListener('click', nextStep);
document.getElementById('addEducationBtn').addEventListener('click', () => addEducation());
document.getElementById('addExperienceBtn').addEventListener('click', () => addExperience());
document.getElementById('addProjectBtn').addEventListener('click', () => addProject());
document.getElementById('generateBtn').addEventListener('click', generateResume);
document.getElementById('saveBtn').addEventListener('click', generateResume); // 保存也是调用生成
document.getElementById('loadExistingBtn').addEventListener('click', loadExistingResume);
document.getElementById('addGithubBtn').addEventListener('click', addGitHubProject);
document.getElementById('exportJSONBtn').addEventListener('click', exportJSON);
document.getElementById('exportPDFBtn').addEventListener('click', exportPDF);

// ========== 初始化 ==========

showStep(1);
console.log('🎯 智能简历生成器已启动');
console.log(`📡 API地址: ${API_BASE_URL}`);
console.log('💡 提示：按步骤填写信息，轻松生成专业简历');
