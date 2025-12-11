package agent

import (
	"ResumeBuilder/internal/domain"
	"ResumeBuilder/internal/utils"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/volcengine/volcengine-go-sdk/service/arkruntime"
	"github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
	"os"
)

// AIAgent 是我们自己定义的接口，包含初始化客户端和解析简历的方法
type AIAgent interface {
	InitializeClient() (*arkruntime.Client, error)
	ParseResume(ctx context.Context, client *arkruntime.Client, raw string) (*domain.Resume, error)
	AnalyzeGitHubRepo(ctx context.Context, client *arkruntime.Client, repoURL string) (*domain.Project, error)
}

// 实现 AIAgent 接口的结构体
type agent struct {
	client *arkruntime.Client
}

// NewAIAgent 返回一个实现 AIAgent 接口的 agent 对象
func NewAIAgent() AIAgent {
	return &agent{}
}

// InitializeClient 实现 AIAgent 接口的 InitializeClient 方法
func (a *agent) InitializeClient() (*arkruntime.Client, error) {
	// 从环境变量获取 API Key
	apiKey := os.Getenv("apiKey")
	if apiKey == "" {
		return nil, fmt.Errorf("API Key is missing")
	}

	// 初始化 Ark 客户端
	client := arkruntime.NewClientWithApiKey(
		apiKey,
		arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),
	)

	// 将客户端保存到结构体中
	a.client = client

	return a.client, nil
}

// ParseResume 实现 AIAgent 接口的 ParseResume 方法
func (a *agent) ParseResume(ctx context.Context, client *arkruntime.Client, raw string) (*domain.Resume, error) {

	// 构建简历生成的提示文本，要求生成结构化 JSON 简历
	prompt := fmt.Sprintf(`
	你是一个简历解析器。请根据以下文本生成结构化的简历（JSON 格式）。

	重要规则：
	1. 只提取文本中实际存在的信息
	2. 如果某个字段没有信息，请使用空字符串 "" 或空数组 []
	3. 绝对不要使用"未提供"、"未填写"、"暂无"等占位文本
	4. 没有信息的字段保持为空值，不要编造或填充任何内容

	请按照以下结构输出 JSON 格式：
	{
		"user_id": "用户ID",
		"basic_info": [{"name": "姓名", "email": "邮箱", "phone": "电话", "location": "位置", "title": "职位"}],
		"education": [{"school": "学校", "major": "专业", "start_date": "开始日期", "end_date": "结束日期", "degree": "学位"}],
		"experience": [{"company": "公司", "position": "职位", "start_date": "开始日期", "end_date": "结束日期", "description": "描述", "achievements": ["成就1", "成就2"]}],
		"projects": [{"name": "项目名称", "role": "角色", "description": "项目描述", "tech_stack": ["技术栈1", "技术栈2"], "highlights": ["亮点1", "亮点2"]}],
		"skills": ["技能1", "技能2"]
	}

	以下是简历文本：
	%s
	`, raw)

	// 构建请求
	req := model.CreateChatCompletionRequest{
		Model: "doubao-1-5-pro-32k-250115",
		Messages: []*model.ChatCompletionMessage{
			{
				Role: model.ChatMessageRoleUser,
				Content: &model.ChatCompletionMessageContent{
					ListValue: []*model.ChatCompletionMessageContentPart{
						{
							Type: model.ChatCompletionMessageContentPartTypeText,
							Text: prompt,
						},
					},
				},
			},
		},
	}

	// 发起 API 请求生成简历
	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("Error occurred while generating resume: %v", err)
	}

	// 输出返回的 JSON 格式简历
	if len(resp.Choices) > 0 && resp.Choices[0].Message.Content.StringValue != nil {
		// 将生成的文本转为 JSON 格式
		var resume domain.Resume
		err := json.Unmarshal([]byte(*resp.Choices[0].Message.Content.StringValue), &resume)
		if err != nil {
			return nil, fmt.Errorf("Error unmarshalling JSON: %v", err)
		}

		// 返回生成的结构化简历
		return &resume, nil
	} else {
		return nil, fmt.Errorf("No resume generated")
	}
}

// AnalyzeGitHubRepo 分析GitHub项目并返回Project结构体
func (a *agent) AnalyzeGitHubRepo(ctx context.Context, client *arkruntime.Client, repoURL string) (*domain.Project, error) {

	token := os.Getenv("GITHUB_TOKEN") // 从环境变量获取认证token（公开文件可留空）

	var fileContent string
	var err error
	var repoMetadata *utils.GitHubRepoMetadata

	// 策略1: 优先使用GitHub API获取README（更稳定，适合国内网络）
	fmt.Printf("\n📥 正在通过GitHub API获取README...\n")
	fileContent, err = utils.FetchREADMEViaAPI(ctx, repoURL, token)

	// 策略2: 如果API失败，降级使用raw.githubusercontent.com
	if err != nil {
		fmt.Printf("\n⚠️  GitHub API获取失败: %v\n", err)
		fmt.Printf("📥 尝试使用raw.githubusercontent.com...\n")
		fileContent, err = utils.FetchREADME(ctx, repoURL, token)
		if err != nil {
			fmt.Printf("\n⚠️  README获取失败: %v\n", err)
			// 策略3: 尝试获取仓库元数据作为备选
			fmt.Printf("📥 尝试获取仓库元数据作为备选...\n")
			repoMetadata, err = utils.FetchRepoMetadata(ctx, repoURL, token)
			if err != nil {
				fmt.Printf("⚠️  元数据获取也失败: %v\n", err)
				fileContent = ""
			} else {
				// 使用元数据构建简单的描述
				fileContent = fmt.Sprintf(`# %s

%s

**主要语言:** %s
**Stars:** %d
**Forks:** %d
**Topics:** %v

仓库地址: %s
`, repoMetadata.Name, repoMetadata.Description, repoMetadata.Language,
					repoMetadata.Stars, repoMetadata.Forks, repoMetadata.Topics, repoURL)
				fmt.Printf("✓ 使用仓库元数据生成描述 (%d字符)\n", len(fileContent))
			}
		} else {
			fmt.Printf("✓ raw URL获取README成功\n")
		}
	} else {
		fmt.Printf("✓ GitHub API获取README成功\n")
	}

	prompt := fmt.Sprintf(`
请深度分析以下GitHub项目的README.md，提取技术信息用于简历展示。

【项目URL】%s

【README内容】
%s

【分析要求】
1. name: 从URL或README提取项目名称（简洁明确）
2. role: 填写"开源项目"或"个人项目"
3. description: 100字以内的技术描述，突出架构设计和技术创新点
4. tech_stack: 完整技术栈列表（包括：编程语言、框架、数据库、中间件、部署工具等）
5. highlights: 3-5个技术亮点，每个亮点按STAR法则组织（不要写出S/T/A/R字母）：
   - 背景场景（Situation）：项目面临的技术挑战或业务需求
   - 任务目标（Task）：需要解决的具体技术问题
   - 采取方案（Action）：使用的技术方案、架构设计或优化手段
   - 达成效果（Result）：量化的性能提升、问题解决效果或业务价值
   示例："面对高并发访问需求，采用Redis缓存+分布式锁机制优化数据访问，使系统QPS从500提升至5000，响应时间降低80%%"

【JSON输出格式】（严格按照此格式，不要添加任何markdown标记）
{
	"name": "项目名称",
	"role": "开源项目",
	"description": "技术架构描述",
	"tech_stack": ["技术1", "技术2", "技术3"],
	"highlights": [
		"亮点1（STAR格式）",
		"亮点2（STAR格式）",
		"亮点3（STAR格式）"
	],
	"url": "%s"
}

注意：
- 只返回JSON，不要添加markdown代码块标记
- highlights必须体现技术深度和量化效果
- 如果README内容为空，请从URL推断项目基本信息
`, repoURL, fileContent, repoURL)

	req := model.CreateChatCompletionRequest{
		Model: "doubao-1-5-pro-32k-250115",
		Messages: []*model.ChatCompletionMessage{
			{
				Role: model.ChatMessageRoleUser,
				Content: &model.ChatCompletionMessageContent{
					ListValue: []*model.ChatCompletionMessageContentPart{
						{Type: model.ChatCompletionMessageContentPartTypeText, Text: prompt},
					},
				},
			},
		},
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("分析项目失败: %v", err)
	}

	if len(resp.Choices) > 0 && resp.Choices[0].Message.Content.StringValue != nil {
		var project domain.Project
		// 清理AI返回的JSON（移除markdown代码块标记）
		cleanedJSON := cleanAIResponse(*resp.Choices[0].Message.Content.StringValue)
		if err := json.Unmarshal([]byte(cleanedJSON), &project); err != nil {
			return nil, fmt.Errorf("解析结果失败: %v", err)
		}
		return &project, nil
	}
	return nil, fmt.Errorf("未生成分析结果")
}

// cleanAIResponse 清理AI返回的JSON字符串，移除markdown代码块标记
func cleanAIResponse(raw string) string {
	// 移除markdown代码块标记
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	return strings.TrimSpace(raw)
}
