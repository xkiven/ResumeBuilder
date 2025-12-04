package utils

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
)

// FetchFile 从指定URL获取文件内容（支持认证）
func FetchFile(ctx context.Context, url, token string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求文件失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return "", errors.New("文件不存在")
		}
		return "", fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取文件内容失败: %w", err)
	}
	return string(content), nil
}
