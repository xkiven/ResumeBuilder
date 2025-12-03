package controller

import (
	"_ResumeBuilder/internal/domain"
	"_ResumeBuilder/internal/service"
	"context"
	"github.com/gin-gonic/gin"

	"net/http"
)

// ResumeController 用于处理简历相关的 HTTP 请求
type ResumeController struct {
	service service.ResumeService
}

// NewResumeController 创建一个新的 ResumeController
func NewResumeController(service service.ResumeService) *ResumeController {
	return &ResumeController{
		service: service,
	}
}

// GetResumeHandler 获取简历
func (r *ResumeController) GetResumeHandler(c *gin.Context) {
	userID := c.Param("userID")

	// 调用服务层获取简历
	resume, err := r.service.GetResume(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resume)
}

// SaveResumeHandler 保存简历
func (r *ResumeController) SaveResumeHandler(c *gin.Context) {
	var resume domain.Resume
	if err := c.ShouldBindJSON(&resume); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// 调用服务层保存简历
	err := r.service.SaveResume(context.Background(), &resume)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume saved successfully"})
}

// GenerateResumeHandler 根据原始文本生成简历
func (r *ResumeController) GenerateResumeHandler(c *gin.Context) {
	var request struct {
		Raw string `json:"raw" binding:"required"`
	}

	userID := c.Param("userID")
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// 调用服务层生成简历
	resume, err := r.service.GenerateResume(context.Background(), request.Raw, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resume)
}

// DeleteResumeHandler 删除简历
func (r *ResumeController) DeleteResumeHandler(c *gin.Context) {
	userID := c.Param("userID")

	// 调用服务层删除简历
	err := r.service.DeleteResume(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume deleted successfully"})
}
