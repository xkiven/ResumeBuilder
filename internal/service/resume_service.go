package service

import (
	"_ResumeBuilder/internal/agent"
	"_ResumeBuilder/internal/dao"
	"_ResumeBuilder/internal/domain"
	"context"
	"errors"
)

type ResumeService interface {
	GetResume(ctx context.Context, userID string) (*domain.Resume, error)
	SaveResume(ctx context.Context, r *domain.Resume) error
	GenerateResume(ctx context.Context, raw string, userID string) (*domain.Resume, error)
	DeleteResume(ctx context.Context, userID string) error
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
