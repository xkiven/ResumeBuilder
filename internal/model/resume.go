package model

import (
	"gorm.io/datatypes"
	"time"
)

type ResumeModel struct {
	ID         uint           `gorm:"primaryKey"`
	UserID     string         `gorm:"not null"`
	BasicInfo  datatypes.JSON `gorm:"type:json"`
	Education  datatypes.JSON `gorm:"type:json"`
	Experience datatypes.JSON `gorm:"type:json"`
	Projects   datatypes.JSON `gorm:"type:json"`
	Skills     datatypes.JSON `gorm:"type:json"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
