package domain

type Resume struct {
	UserID     string       `json:"user_id"`
	BasicInfo  []BasicInfo  `json:"basic_info"`
	Education  []Education  `json:"education"`
	Experience []Experience `json:"experience"`
	Projects   []Project    `json:"projects"`
	Skills     []string     `json:"skills"`
}

type BasicInfo struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Location string `json:"location"`
	Title    string `json:"title"`
}

type Education struct {
	School    string `json:"school"`
	Major     string `json:"major"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	Degree    string `json:"degree"`
}

type Experience struct {
	Company      string   `json:"company"`
	Position     string   `json:"position"`
	StartDate    string   `json:"start_date"`
	EndDate      string   `json:"end_date"`
	Description  string   `json:"description"`
	Achievements []string `json:"achievements"`
}

type Project struct {
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	Description string   `json:"description"`
	TechStack   []string `json:"tech_stack"`
	Highlights  []string `json:"highlights"`
}
