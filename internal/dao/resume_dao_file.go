package dao

import (
	"ResumeBuilder/internal/domain"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// 文件存储的 DAO 实现
type fileResumeDAO struct {
	dataDir string     // 数据存储目录
	mu      sync.RWMutex // 读写锁，保证并发安全
}

// NewFileResumeDAO 创建基于文件存储的 DAO
func NewFileResumeDAO() ResumeDAO {
	dataDir := "./data/resumes"

	// 确保数据目录存在
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		panic(fmt.Sprintf("无法创建数据目录: %v", err))
	}

	return &fileResumeDAO{
		dataDir: dataDir,
	}
}

// getFilePath 获取指定用户的简历文件路径
func (d *fileResumeDAO) getFilePath(userID string) string {
	return filepath.Join(d.dataDir, fmt.Sprintf("%s.json", userID))
}

// fileExists 检查文件是否存在
func (d *fileResumeDAO) fileExists(userID string) bool {
	_, err := os.Stat(d.getFilePath(userID))
	return err == nil
}

// Create 创建新简历
func (d *fileResumeDAO) Create(ctx context.Context, r *domain.Resume) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	// 检查是否已存在
	if d.fileExists(r.UserID) {
		return errors.New("简历已存在")
	}

	// 序列化为 JSON
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return fmt.Errorf("JSON 序列化失败: %v", err)
	}

	// 写入文件
	filePath := d.getFilePath(r.UserID)
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入文件失败: %v", err)
	}

	return nil
}

// Get 获取简历
func (d *fileResumeDAO) Get(ctx context.Context, userID string) (*domain.Resume, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	// 检查文件是否存在
	if !d.fileExists(userID) {
		return nil, errors.New("简历不存在")
	}

	// 读取文件
	filePath := d.getFilePath(userID)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %v", err)
	}

	// 反序列化
	var resume domain.Resume
	if err := json.Unmarshal(data, &resume); err != nil {
		return nil, fmt.Errorf("JSON 解析失败: %v", err)
	}

	return &resume, nil
}

// Update 更新简历
func (d *fileResumeDAO) Update(ctx context.Context, r *domain.Resume) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	// 检查是否存在
	if !d.fileExists(r.UserID) {
		// 如果不存在，直接创建
		data, err := json.MarshalIndent(r, "", "  ")
		if err != nil {
			return fmt.Errorf("JSON 序列化失败: %v", err)
		}

		filePath := d.getFilePath(r.UserID)
		if err := os.WriteFile(filePath, data, 0644); err != nil {
			return fmt.Errorf("写入文件失败: %v", err)
		}
		return nil
	}

	// 序列化为 JSON
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return fmt.Errorf("JSON 序列化失败: %v", err)
	}

	// 写入文件（覆盖）
	filePath := d.getFilePath(r.UserID)
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入文件失败: %v", err)
	}

	return nil
}

// Delete 删除简历
func (d *fileResumeDAO) Delete(ctx context.Context, userID string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	// 检查文件是否存在
	if !d.fileExists(userID) {
		return errors.New("简历不存在，无法删除")
	}

	// 删除文件
	filePath := d.getFilePath(userID)
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("删除文件失败: %v", err)
	}

	return nil
}
