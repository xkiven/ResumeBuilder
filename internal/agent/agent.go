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

type AIAgent interface {
	InitializeClient() (*arkruntime.Client, error)
	ParseResume(ctx context.Context, client *arkruntime.Client, raw string) (*domain.Resume, error)
}

func InitializeClient() (*arkruntime.Client, error) {
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

	return client, nil
}

func ParseResume(ctx context.Context, client *arkruntime.Client, raw string) (*domain.Resume, error) {

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
