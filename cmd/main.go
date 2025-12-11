package main

import (
	"ResumeBuilder/internal/agent"
	"ResumeBuilder/internal/controller"
	"ResumeBuilder/internal/dao"
	"ResumeBuilder/internal/route"
	"ResumeBuilder/internal/service"
	"log"
)

func main() {
	db := dao.NewResumeDAO()
	aiAgent := agent.NewAIAgent()
	resumeService := service.NewResumeService(db, aiAgent)
	resumeController := controller.NewResumeController(resumeService)
	r := route.Run(resumeController)

	// 启动服务器
	if err := r.Run(":8080"); err != nil {
		log.Fatal("服务启动失败： ", err)
	}
}
