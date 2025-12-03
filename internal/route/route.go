package route

import (
	"_ResumeBuilder/internal/controller"
	"github.com/gin-gonic/gin"
)

func Run(resumeController *controller.ResumeController) *gin.Engine {
	r := gin.Default()
	r.GET("/resume/:userID", resumeController.GetResumeHandler)
	r.POST("/resume", resumeController.SaveResumeHandler)
	r.POST("/resume/:userID/generate", resumeController.GenerateResumeHandler)
	r.DELETE("/resume/:userID", resumeController.DeleteResumeHandler)
	r.POST("/resume/:userID/generate/github", resumeController.AddGitHubProjectHandler)

	return r
}
