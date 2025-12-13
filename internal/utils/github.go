package utils

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// httpClient 配置了超时的HTTP客户端
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

// FetchFile 从指定URL获取文件内容（支持认证）
func FetchFile(ctx context.Context, url, token string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := httpClient.Do(req)
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

// ParseGitHubURL 解析GitHub仓库URL，提取owner、repo和branch信息
// 支持多种格式：
// - https://github.com/user/repo
// - https://github.com/user/repo/tree/branch
// - https://github.com/user/repo/blob/branch/file
type GitHubRepoInfo struct {
	Owner  string
	Repo   string
	Branch string // 如果URL中包含分支信息，则提取；否则为空
}

func ParseGitHubURL(repoURL string) (*GitHubRepoInfo, error) {
	// 匹配多种GitHub URL格式
	// 格式1: github.com/owner/repo
	// 格式2: github.com/owner/repo/tree/branch
	// 格式3: github.com/owner/repo/blob/branch/...
	pattern := `(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)(?:/(?:tree|blob)/([^/]+))?`
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(repoURL)

	if len(matches) < 3 {
		return nil, errors.New("无效的GitHub仓库URL")
	}

	info := &GitHubRepoInfo{
		Owner: matches[1],
		Repo:  strings.TrimSuffix(matches[2], ".git"),
	}

	// 如果URL中包含分支信息（第3个捕获组）
	if len(matches) > 3 && matches[3] != "" {
		info.Branch = matches[3]
	}

	return info, nil
}

// ConvertToRawURL 将GitHub仓库URL转换为raw content URL
func ConvertToRawURL(repoURL, branch, filePath string) (string, error) {
	info, err := ParseGitHubURL(repoURL)
	if err != nil {
		return "", err
	}

	// 如果URL中指定了分支，优先使用URL中的分支
	targetBranch := branch
	if info.Branch != "" {
		targetBranch = info.Branch
	}

	// 构建raw.githubusercontent.com URL
	rawURL := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s",
		info.Owner, info.Repo, targetBranch, filePath)
	return rawURL, nil
}

// FetchREADME 智能获取GitHub仓库的README.md
// 自动尝试多个常见分支（main, master, develop）
// 如果URL中包含分支信息，则优先使用URL中的分支
func FetchREADME(ctx context.Context, repoURL, token string) (string, error) {
	// 解析URL，检查是否包含分支信息
	info, err := ParseGitHubURL(repoURL)
	if err != nil {
		return "", fmt.Errorf("URL解析失败: %w", err)
	}

	// 构建分支尝试列表
	var branches []string
	if info.Branch != "" {
		// 如果URL中指定了分支，优先尝试该分支，然后尝试其他常见分支
		branches = []string{info.Branch, "main", "master", "develop"}
	} else {
		// 否则按常见分支顺序尝试
		branches = []string{"main", "master", "develop"}
	}

	// 去重分支列表
	branches = uniqueStrings(branches)

	readmeFiles := []string{"README.md", "readme.md", "Readme.md"}

	var lastErr error
	for _, branch := range branches {
		for _, readme := range readmeFiles {
			rawURL, err := ConvertToRawURL(repoURL, branch, readme)
			if err != nil {
				return "", fmt.Errorf("URL转换失败: %w", err)
			}

			fmt.Printf("  → 尝试: %s/%s ... ", branch, readme)
			content, err := FetchFile(ctx, rawURL, token)
			if err == nil && content != "" {
				// 成功获取到内容
				fmt.Printf("✓ 成功 (%d字符)\n", len(content))
				return content, nil
			}
			if err != nil {
				fmt.Printf("✗ %v\n", err)
			} else {
				fmt.Printf("✗ 内容为空\n")
			}
			lastErr = err
		}
	}

	// 所有尝试都失败
	if lastErr != nil {
		return "", fmt.Errorf("无法获取README.md (已尝试分支: %v): %w", branches, lastErr)
	}
	return "", errors.New("README.md不存在或为空")
}

// uniqueStrings 去除字符串切片中的重复元素
func uniqueStrings(input []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, str := range input {
		if !seen[str] {
			seen[str] = true
			result = append(result, str)
		}
	}
	return result
}

// GitHubAPIResponse GitHub API返回的README响应
type GitHubAPIResponse struct {
	Content  string `json:"content"`
	Encoding string `json:"encoding"`
}

// GitHubRepoMetadata GitHub仓库元数据
type GitHubRepoMetadata struct {
	Name        string   `json:"name"`
	FullName    string   `json:"full_name"`
	Description string   `json:"description"`
	Language    string   `json:"language"`
	Topics      []string `json:"topics"`
	Stars       int      `json:"stargazers_count"`
	Forks       int      `json:"forks_count"`
}

// FetchREADMEViaAPI 使用GitHub API获取README（更稳定，适合国内网络环境）
func FetchREADMEViaAPI(ctx context.Context, repoURL, token string) (string, error) {
	// 解析仓库信息
	info, err := ParseGitHubURL(repoURL)
	if err != nil {
		return "", fmt.Errorf("URL解析失败: %w", err)
	}

	// 构建GitHub API URL
	// API文档: https://docs.github.com/en/rest/repos/contents
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/readme", info.Owner, info.Repo)

	// 如果URL中指定了分支，添加ref参数
	if info.Branch != "" {
		apiURL = fmt.Sprintf("%s?ref=%s", apiURL, info.Branch)
		fmt.Printf("  → API URL (with branch): %s\n", apiURL)
	} else {
		fmt.Printf("  → API URL: %s\n", apiURL)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Printf("  ✗ GitHub API请求失败: %v\n", err)
		return "", fmt.Errorf("请求GitHub API失败: %w", err)
	}
	defer resp.Body.Close()

	fmt.Printf("  → API响应状态码: %d\n", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			fmt.Printf("  ✗ API返回404: README不存在或仓库不存在\n")
			return "", errors.New("README不存在")
		}
		if resp.StatusCode == 403 {
			fmt.Printf("  ✗ API返回403: 可能是限流或需要认证\n")
		}
		return "", fmt.Errorf("GitHub API返回错误，状态码: %d", resp.StatusCode)
	}

	// 解析API响应
	var apiResp GitHubAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		fmt.Printf("  ✗ 解析API响应失败: %v\n", err)
		return "", fmt.Errorf("解析API响应失败: %w", err)
	}

	fmt.Printf("  → README编码格式: %s\n", apiResp.Encoding)

	// GitHub API返回base64编码的内容，需要解码
	if apiResp.Encoding == "base64" {
		decoded, err := decodeBase64(apiResp.Content)
		if err != nil {
			fmt.Printf("  ✗ Base64解码失败: %v\n", err)
			return "", fmt.Errorf("解码README内容失败: %w", err)
		}
		contentLen := len(decoded)
		fmt.Printf("  ✓ README解码成功，长度: %d 字符\n", contentLen)
		return decoded, nil
	}

	contentLen := len(apiResp.Content)
	fmt.Printf("  ✓ README获取成功，长度: %d 字符\n", contentLen)
	return apiResp.Content, nil
}

// decodeBase64 base64解码（移除空白字符后解码）
func decodeBase64(s string) (string, error) {
	// 移除所有空白字符
	s = strings.ReplaceAll(s, "\n", "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "\t", "")

	// 解码base64
	decoded, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

// FetchRepoMetadata 获取GitHub仓库元数据（作为README的备选方案）
func FetchRepoMetadata(ctx context.Context, repoURL, token string) (*GitHubRepoMetadata, error) {
	// 解析仓库信息
	info, err := ParseGitHubURL(repoURL)
	if err != nil {
		return nil, fmt.Errorf("URL解析失败: %w", err)
	}

	// 构建GitHub API URL
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", info.Owner, info.Repo)
	fmt.Printf("  → 获取仓库元数据: %s\n", apiURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Printf("  ✗ 请求失败: %v\n", err)
		return nil, fmt.Errorf("请求GitHub API失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API返回错误，状态码: %d", resp.StatusCode)
	}

	// 解析API响应
	var metadata GitHubRepoMetadata
	if err := json.NewDecoder(resp.Body).Decode(&metadata); err != nil {
		return nil, fmt.Errorf("解析元数据失败: %w", err)
	}

	fmt.Printf("  ✓ 获取成功: %s (%s, ⭐%d)\n", metadata.Name, metadata.Language, metadata.Stars)
	return &metadata, nil
}
