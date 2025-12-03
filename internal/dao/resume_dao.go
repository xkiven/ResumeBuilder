package dao

import (
	"_ResumeBuilder/internal/domain"
	"_ResumeBuilder/internal/model"
	"context"
	"encoding/json"
	"gorm.io/driver/mysql"
	"gorm.io/gorm/schema"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type ResumeDAO interface {
	Create(ctx context.Context, r *domain.Resume) error
	Get(ctx context.Context, userID string) (*domain.Resume, error)
	Update(ctx context.Context, r *domain.Resume) error
	Delete(ctx context.Context, userID string) error
}

type resumeDAO struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewResumeDAO() ResumeDAO {
	dbUrl := "root:xkw510724@tcp(127.0.0.1:3306)/resume_builder?charset=utf8"
	db, err := gorm.Open(mysql.Open(dbUrl), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(model.ResumeModel{})
	if err != nil {
		panic(err)
	}

	client := redis.NewClient(&redis.Options{
		Addr:     "127.0.0.1:6379",
		Password: "",
		DB:       0,
	})

	return &resumeDAO{
		db:    db,
		redis: client,
	}
}

func redisKey(userID string) string {
	return "resume:" + userID
}

var cacheTTL = time.Minute * 10

func domainToModel(r *domain.Resume) (*model.ResumeModel, error) {
	m := &model.ResumeModel{
		UserID: r.UserID,
	}

	// 结构体 -> JSON
	if b, err := json.Marshal(r.BasicInfo); err == nil {
		m.BasicInfo = b
	} else {
		return nil, err
	}

	if b, err := json.Marshal(r.Education); err == nil {
		m.Education = b
	} else {
		return nil, err
	}

	if b, err := json.Marshal(r.Experience); err == nil {
		m.Experience = b
	} else {
		return nil, err
	}

	if b, err := json.Marshal(r.Projects); err == nil {
		m.Projects = b
	} else {
		return nil, err
	}

	if b, err := json.Marshal(r.Skills); err == nil {
		m.Skills = b
	} else {
		return nil, err
	}

	return m, nil
}

func modelToDomain(m *model.ResumeModel) (*domain.Resume, error) {
	r := &domain.Resume{
		UserID: m.UserID,
	}

	// JSON -> 结构体
	if err := json.Unmarshal(m.BasicInfo, &r.BasicInfo); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(m.Education, &r.Education); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(m.Experience, &r.Experience); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(m.Projects, &r.Projects); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(m.Skills, &r.Skills); err != nil {
		return nil, err
	}

	return r, nil
}

func (d *resumeDAO) Create(ctx context.Context, r *domain.Resume) error {
	m, err := domainToModel(r)
	if err != nil {
		return err
	}

	if err := d.db.Create(m).Error; err != nil {
		return err
	}

	// 写缓存
	data, _ := json.Marshal(r)
	d.redis.Set(ctx, redisKey(r.UserID), data, cacheTTL)

	return nil
}

func (d *resumeDAO) Get(ctx context.Context, userID string) (*domain.Resume, error) {
	key := redisKey(userID)

	// 读缓存
	if val, err := d.redis.Get(ctx, key).Result(); err == nil {
		var r domain.Resume
		if err2 := json.Unmarshal([]byte(val), &r); err2 == nil {
			return &r, nil
		}
	}

	// 读 MySQL
	var m model.ResumeModel
	if err := d.db.Where("user_id = ?", userID).First(&m).Error; err != nil {
		return nil, err
	}

	// model → domain
	r, err := modelToDomain(&m)
	if err != nil {
		return nil, err
	}

	// 写缓存
	data, _ := json.Marshal(r)
	d.redis.Set(ctx, key, data, cacheTTL)

	return r, nil
}

func (d *resumeDAO) Update(ctx context.Context, r *domain.Resume) error {
	m, err := domainToModel(r)
	if err != nil {
		return err
	}

	if err := d.db.Model(&model.ResumeModel{}).
		Where("user_id = ?", r.UserID).
		Updates(m).Error; err != nil {
		return err
	}

	// 更新缓存
	data, _ := json.Marshal(r)
	d.redis.Set(ctx, redisKey(r.UserID), data, cacheTTL)

	return nil
}

func (d *resumeDAO) Delete(ctx context.Context, userID string) error {
	if err := d.db.Where("user_id = ?", userID).Delete(&model.ResumeModel{}).Error; err != nil {
		return err
	}

	d.redis.Del(ctx, redisKey(userID))
	return nil
}
