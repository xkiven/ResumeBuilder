package route

import (
	"ResumeBuilder/internal/controller"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Run(resumeController *controller.ResumeController) *gin.Engine {
	r := gin.Default()

	// CORS中间件 - 允许跨域请求
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// API路由 - 必须在静态文件之前定义
	api := r.Group("/api")
	{
		api.GET("/resume/:userID", resumeController.GetResumeHandler)
		api.POST("/resume", resumeController.SaveResumeHandler)
		api.POST("/resume/:userID/generate", resumeController.GenerateResumeHandler)
		api.DELETE("/resume/:userID", resumeController.DeleteResumeHandler)
		api.POST("/resume/:userID/generate/github", resumeController.AddGitHubProjectHandler)
	}

	// 静态文件服务 - 提供前端页面（放在最后，作为兜底路由）
	r.NoRoute(func(c *gin.Context) {
		// 如果请求的是文件（有扩展名），则从web目录提供
		path := c.Request.URL.Path
		if path == "/" || path == "/index.html" {
			c.File("./web/index.html")
			return
		}
		// 尝试从web目录提供静态文件
		filePath := "./web" + path
		c.File(filePath)
	})

	return r
}
