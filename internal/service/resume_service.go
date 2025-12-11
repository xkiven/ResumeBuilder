package service

import (
	"ResumeBuilder/internal/agent"
	"ResumeBuilder/internal/dao"
	"ResumeBuilder/internal/domain"
	"context"
	"errors"
)

type ResumeService interface {
	GetResume(ctx context.Context, userID string) (*domain.Resume, error)
	SaveResume(ctx context.Context, r *domain.Resume) error
	GenerateResume(ctx context.Context, raw string, userID string) (*domain.Resume, error)
	DeleteResume(ctx context.Context, userID string) error
	AnalyzeAndAddGitHubProject(ctx context.Context, userID, repoURL string) (*domain.Resume, error)
}

type resumeService struct {
	dao   dao.ResumeDAO
	agent agent.AIAgent
}

func NewResumeService(dao dao.ResumeDAO, agent agent.AIAgent) ResumeService {
	return &resumeService{
		dao:   dao,
		agent: agent,
	}
}

func (s *resumeService) GetResume(ctx context.Context, userID string) (*domain.Resume, error) {
	return s.dao.Get(ctx, userID)
}

func (s *resumeService) SaveResume(ctx context.Context, r *domain.Resume) error {
	if r.UserID == "" {
		return errors.New("UserID 不能为空")
	}
	return s.dao.Update(ctx, r)
}

func (s *resumeService) DeleteResume(ctx context.Context, userID string) error {
	if userID == "" {
		return errors.New("UserID 不能为空")
	}
	return s.dao.Delete(ctx, userID)
}

func (s *resumeService) GenerateResume(ctx context.Context, raw string, userID string) (*domain.Resume, error) {
	if raw == "" {
		return nil, errors.New("raw text cannot be empty")
	}

	aiClient, err := s.agent.InitializeClient()
	if err != nil {
		panic(err)
	}

	resume, err := s.agent.ParseResume(ctx, aiClient, raw)
	if err != nil {
		return nil, err
	}

	resume.UserID = userID

	// 保存数据库
	if err := s.dao.Create(ctx, resume); err != nil {
		return nil, err
	}

	return resume, nil
}

// AnalyzeAndAddGitHubProject 分析GitHub项目并添加到用户简历的Projects中
func (s *resumeService) AnalyzeAndAddGitHubProject(ctx context.Context, userID, repoURL string) (*domain.Resume, error) {
	//初始化AI客户端
	client, err := s.agent.InitializeClient()
	if err != nil {
		return nil, err
	}

	//分析项目得到Project结构体
	project, err := s.agent.AnalyzeGitHubRepo(ctx, client, repoURL)
	if err != nil {
		return nil, err
	}

	//获取用户现有简历
	resume, err := s.dao.Get(ctx, userID)
	if err != nil {
		// 若用户无简历，初始化一个新简历
		resume = &domain.Resume{UserID: userID}
	}

	// 将分析结果添加到Projects列表
	resume.Projects = append(resume.Projects, *project)

	// 保存更新后的简历
	if err := s.dao.Update(ctx, resume); err != nil {
		return nil, err
	}

	return resume, nil
}
