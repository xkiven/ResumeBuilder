package agent

import (
	"_ResumeBuilder/internal/domain"
	"context"
)

type AIAgent interface {
	ParseResume(ctx context.Context, raw string) (*domain.Resume, error)
}
