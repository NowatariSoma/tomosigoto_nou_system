```
flowchart TD
    A[親コンポーネント<br/>TrainingSchedule] --> B[DateButton<br/>currentDate={currentDate}<br/>onDateChange={navigateDate}]
    A --> C[Information<br/>currentDate={currentDate}]
    
    B --> D[ユーザーがクリック]
    D --> E[navigateDate関数実行]
    E --> F[setCurrentDateで状態更新]
    F --> G[Reactが再レンダリング]
    G --> H[全ての子コンポーネントが<br/>新しいcurrentDateを受け取る]