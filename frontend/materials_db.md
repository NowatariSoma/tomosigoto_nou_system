```mermaid
erDiagram

  USERS {
  }

  PLAYLISTS {
    uuid id PK
    string title
    string name
    string year
    string thumbnail_url
  }

  SUB_PLAYLISTS {
    uuid id PK
    uuid playlist_id FK
    string title
    date recorded_date
    string phase
    string playlist_url
    string thumbnail_url
  }

  VIDEOS {
    uuid id PK
    uuid sub_playlist_id FK
    string title
    string video_url
    date recorded_date
    string thumbnail_url
  }

  FAVORITES {
    uuid user_id FK
    uuid video_id FK
    timestamp created_at
  }

  %% 関係定義
  PLAYLISTS ||--o{ SUB_PLAYLISTS : "1対多（フェーズ）"
  SUB_PLAYLISTS ||--o{ VIDEOS : "1対多（動画）"
  USERS ||--o{ FAVORITES : "お気に入り登録"
  VIDEOS ||--o{ FAVORITES : "お気に入り対象"
