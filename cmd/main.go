package main

import (
	"ResumeBuilder/internal/agent"
	"ResumeBuilder/internal/controller"
	"ResumeBuilder/internal/dao"
	"ResumeBuilder/internal/route"
	"ResumeBuilder/internal/service"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// 加载.env文件（如果存在）
	if err := godotenv.Load(); err != nil {
		log.Println("警告：未找到.env文件，将使用系统环境变量")
	} else {
		log.Println("✅ 成功加载.env文件")
	}

	// 检查必要的环境变量
	apiKey := os.Getenv("apiKey")
	if apiKey == "" {
		log.Fatal("❌ 错误：apiKey环境变量未设置，请在.env文件中配置或设置系统环境变量")
	}
	log.Println("✅ API Key已配置")

	// 初始化服务（使用文件存储）
	db := dao.NewFileResumeDAO()
	aiAgent := agent.NewAIAgent()
	resumeService := service.NewResumeService(db, aiAgent)
	resumeController := controller.NewResumeController(resumeService)
	r := route.Run(resumeController)

	// 启动服务器
	log.Println("🚀 服务器启动中...")
	log.Println("📡 监听地址: http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("❌ 服务启动失败： ", err)
	}
}
