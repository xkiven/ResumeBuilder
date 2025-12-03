package agent

import (
	"_ResumeBuilder/internal/domain"
	"context"
	"encoding/json"
	"fmt"
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
	你是一个简历解析器。请根据以下文本生成结构化的简历（JSON 格式）。请确保生成的简历包含以下信息：基本信息、教育背景、工作经历、项目经验和技能（请按照以下结构输出 JSON 格式）：
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
		Model: "doubao-seed-1-6-251015",
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

// 分析GitHub项目并返回Project结构体
func (a *agent) AnalyzeGitHubRepo(ctx context.Context, client *arkruntime.Client, repoURL string) (*domain.Project, error) {
	prompt := fmt.Sprintf(`
	请分析GitHub仓库 %s，提取以下信息并以JSON格式返回（符合Project结构体）：
	- name: 项目名称（从URL提取或推断）
	- role: 留空（或填"开源项目"）
	- description: 项目技术特点描述（专业语言）
	- tech_stack: 核心技术栈列表（编程语言、框架、工具等）
	- highlights: 3-5个技术亮点
	
	JSON格式示例：
	{
		"name": "xxx项目",
		"role": "开源项目",
		"description": "该项目基于...",
		"tech_stack": ["Go", "Gin", "MySQL"],
		"highlights": ["高性能...", "模块化设计..."]
	}
	`, repoURL)

	req := model.CreateChatCompletionRequest{
		Model: "doubao-seed-1-6-251015",
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
		if err := json.Unmarshal([]byte(*resp.Choices[0].Message.Content.StringValue), &project); err != nil {
			return nil, fmt.Errorf("解析结果失败: %v", err)
		}
		return &project, nil
	}
	return nil, fmt.Errorf("未生成分析结果")
}
