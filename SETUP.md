# 絆プロジェクト セットアップ手順

## 1. Firebase プロジェクト設定

### 1-1. Firebaseコンソールで設定
1. [Firebase Console](https://console.firebase.google.com/) → プロジェクト設定 → アプリ → ウェブアプリを追加
2. 表示された設定値をコピー

### 1-2. 環境変数を設定
```bash
cp .env.example .env
# .env を編集して Firebase の設定値を貼り付ける
```

### 1-3. Firebase サービスを有効化
- **Authentication**: メール/パスワード を有効化
- **Firestore**: データベースを作成（本番モードで開始）
- **Functions**: Blazeプラン（従量課金）が必要

## 2. 管理者アカウント作成

### 2-1. Firebase Authentication でユーザー作成
Firebaseコンソール → Authentication → ユーザーを追加
- メールアドレス・パスワードを設定
- 作成後、ユーザーのUIDをコピー

### 2-2. Firestore に管理者ドキュメント作成
Firebaseコンソール → Firestore → コレクション作成
```
コレクション: admins
ドキュメントID: {コピーしたUID}
フィールド:
  name: "管理者名"
  email: "admin@example.com"
  role: "owner"
```

## 3. LINE Messaging API 設定

### 3-1. Firebase Functions の環境変数設定
```bash
cd functions
firebase functions:config:set \
  line.channel_secret="YOUR_CHANNEL_SECRET" \
  line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"
```

### 3-2. Webhook URL 設定
Functions をデプロイ後、LINE Developers コンソールで Webhook URL を設定:
```
https://asia-northeast1-{project-id}.cloudfunctions.net/lineWebhook
```

## 4. 開発環境の起動

```bash
# 依存パッケージのインストール（済み）
npm install

# 開発サーバー起動
npm run dev
# → http://localhost:3000 でアクセス可能
```

## 5. デプロイ

### Firebase Hosting へデプロイ
```bash
# Nuxtをビルド
npm run generate

# Firebase Hosting にデプロイ
firebase deploy --only hosting
```

### Firebase Functions をデプロイ
```bash
cd functions
npm run deploy
```

## 6. Firestore セキュリティルールの確認

`firestore.rules` を確認・調整してデプロイ:
```bash
firebase deploy --only firestore:rules
```

## 画面一覧

| パス | 説明 |
|------|------|
| `/login` | ログイン画面 |
| `/` | ダッシュボード |
| `/users` | ユーザー一覧 |
| `/users/:id` | ユーザー詳細・チャット |
| `/chat` | チャット管理 |
| `/contents` | コンテンツ一覧 |
| `/contents/new` | コンテンツ追加 |
| `/contents/:id` | コンテンツ編集 |
| `/segments` | セグメント管理 |
| `/broadcasts` | 配信一覧 |
| `/broadcasts/new` | 配信作成 |
| `/settings/onboarding` | オンボーディング設定 |
| `/settings/admins` | 管理者設定 |
